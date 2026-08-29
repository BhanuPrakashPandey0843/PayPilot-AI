/**
 * Lightweight audit-event emitter.
 *
 * PURPOSE:
 *   The full audit-log implementation (DB table, ingestion pipeline,
 *   retention, admin viewer) belongs to a later milestone. For now this
 *   module exists so that authentication / authorization / RBAC code can
 *   "fire and forget" well-typed audit events at the right places, and
 *   the next milestone can swap the transport layer WITHOUT touching
 *   every call site.
 *
 * TRANSPORT TODAY:
 *   - Structured, safe logs to stdout (NEVER contains passwords, hashes,
 *     tokens, or secrets — see scrub() below).
 *   - The `emit()` function never throws; even if Redis / DB / downstream
 *     sinks become unavailable later, auth/authorization must still work.
 *
 * TRANSPORT TOMORROW (audit-log milestone):
 *   - Write each event to an `audit_events` table via the same `emit()`
 *     signature (replay-safe, idempotent eventId).
 *   - Optionally publish to a Redis stream + async consumer so the
 *     critical request path stays fast.
 *   - All of that happens HERE — call sites do not change.
 *
 * EVENT CONTRACT (see AuditEvent):
 *   Every event has:
 *     id          — stable UUID, deterministic when possible (dedupe)
 *     type        — enum (see AuditEventType) — adding a new type is a
 *                   change HERE, not a new free-form string.
 *     actor       — { userId, organizationId? } — the caller. Can be
 *                   null for anonymous events (e.g. REGISTRATION_INITIATED
 *                   before a user row exists).
 *     target      — what resource was touched (if applicable)
 *     context     — { ip?, userAgent?, requestId? } — safe metadata only
 *     occurredAt  — ISO timestamp
 */

import { randomUUID } from "node:crypto";

export type AuditEventType =
  | "USER_REGISTERED"
  | "USER_LOGIN_SUCCESS"
  | "USER_LOGIN_FAILED"
  | "USER_LOGIN_INACTIVE"
  | "USER_LOGIN_NO_MEMBERSHIP"
  | "USER_VIEWED_ME"
  | "ROLE_CHANGED"
  | "ROLE_ASSIGNED"
  | "PERMISSION_CHECK_GRANTED"
  | "PERMISSION_CHECK_DENIED"
  | "ORGANIZATION_CREATED"
  | "AUTHENTICATION_FAILED"
  | "AUTHORIZATION_DENIED"
  // --- Milestone 5: checkout / payment / webhook lifecycle ---
  | "CHECKOUT_REQUESTED"
  | "CHECKOUT_IDEMPOTENT_REPLAY"
  | "CHECKOUT_RETRY_REQUESTED"
  | "CHECKOUT_FAILED"
  | "POLICY_CHECK_STARTED"
  | "POLICY_APPROVED"
  | "POLICY_REJECTED"
  | "INVENTORY_RESERVED"
  | "INVENTORY_RESERVATION_FAILED"
  | "INVENTORY_RESTORED"
  | "ORDER_CREATED"
  | "ORDER_STATUS_CHANGED"
  | "RAZORPAY_ORDER_CREATED"
  | "RAZORPAY_ORDER_CREATE_FAILED"
  | "PAYMENT_INITIATED"
  | "PAYMENT_VERIFICATION_STARTED"
  | "PAYMENT_VERIFIED"
  | "PAYMENT_SIGNATURE_INVALID"
  | "PAYMENT_CAPTURED"
  | "PAYMENT_AUTHORIZED"
  | "PAYMENT_FAILED"
  | "WEBHOOK_RECEIVED"
  | "WEBHOOK_SIGNATURE_INVALID"
  | "WEBHOOK_DUPLICATE_IGNORED"
  | "WEBHOOK_PROCESSING_FAILED";

export type AuditActorType = "USER" | "AI_AGENT" | "SYSTEM";

interface AuditActor {
  userId?: string;
  organizationId?: string;
  roleId?: string;
  role?: string;
  /** Who/what initiated this event. Defaults to "USER" when a userId is present, else "SYSTEM". */
  actorType?: AuditActorType;
}

interface AuditTarget {
  kind:
    | "user"
    | "organization"
    | "membership"
    | "role"
    | "permission"
    | "product"
    | "customer"
    | "order"
    | "payment"
    | "payment_attempt"
    | "checkout"
    | "webhook_event"
    | "ai_action";
  id?: string;
  extras?: Record<string, unknown>;
}

export interface AuditEvent {
  id: string;
  type: AuditEventType;
  actor: AuditActor | null;
  target?: AuditTarget;
  context: Record<string, unknown>;
  occurredAt: string;
}

// Values that should NEVER appear inside an audit event's context or
// target.extras fields, even by accident. Treat these as a last line of
// defense — callers are expected to pass only safe data in the first
// place.
const REDACT = "[REDACTED]";
const SENSITIVE_KEYS = new Set([
  "password",
  "passwordHash",
  "password_hash",
  "token",
  "jwt",
  "authorization",
  "cookie",
  "secret",
  "database_url",
  "redis_url",
  "razorpay_key_secret",
]);

function isSensitiveKey(key: string): boolean {
  const k = key.toLowerCase();
  if (SENSITIVE_KEYS.has(k)) return true;
  if (k.includes("password") || k.includes("secret") || k.includes("token")) return true;
  return false;
}

function scrub(value: unknown, depth = 0): unknown {
  if (depth > 4) return typeof value === "string" ? REDACT : null;
  if (value == null) return value;
  if (typeof value === "string") {
    if (value.length > 4096) return value.slice(0, 512) + "…[TRUNCATED]";
    return value;
  }
  if (Array.isArray(value)) return value.map((v) => scrub(v, depth + 1));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (isSensitiveKey(k)) {
        out[k] = REDACT;
      } else {
        out[k] = scrub(v, depth + 1);
      }
    }
    return out;
  }
  if (typeof value === "number" || typeof value === "boolean") return value;
  return String(value);
}

/**
 * Lazily-imported so this module has zero import-time dependency on the
 * database layer (keeps auth/authorization tests that don't touch a real
 * DB fast, and avoids any chance of a circular import). Resolved once and
 * cached.
 */
let dbModulePromise: Promise<typeof import("../db/index.js")> | null = null;
function getDbModule() {
  if (!dbModulePromise) dbModulePromise = import("../db/index.js");
  return dbModulePromise;
}

/**
 * Best-effort persistence of an already-scrubbed event to the
 * `audit_logs` table (Milestone 5, Phase 15) — this is what powers
 * GET /api/v1/audit. Deliberately fire-and-forget: emitAudit() itself
 * must return synchronously and must never let a DB hiccup break the
 * request that triggered the audit event.
 */
function persistToDatabase(full: AuditEvent): void {
  getDbModule()
    .then(async ({ db, schema }) => {
      await db.insert(schema.auditLogs).values({
        id: full.id,
        organizationId: full.actor?.organizationId ?? null,
        actorType: full.actor?.actorType ?? (full.actor?.userId ? "USER" : "SYSTEM"),
        actorId: full.actor?.userId ?? null,
        action: full.type,
        resourceType: full.target?.kind ?? null,
        resourceId: full.target?.id ?? null,
        reason: typeof full.context?.reason === "string" ? (full.context.reason as string) : null,
        metadata: { ...full.context, ...(full.target?.extras ?? {}) },
        createdAt: new Date(full.occurredAt),
      });
    })
    .catch(() => {
      // Swallowed — see function doc. The console.log line below is still
      // the guaranteed-durable-enough-for-a-hackathon-demo transport even
      // if the DB write fails (e.g. during a migration window).
    });
}

/**
 * Emit an audit event.
 *
 * GUARANTEES:
 *   1. Never throws.
 *   2. Never logs secrets — context/target.extras are passed through scrub().
 *   3. Call-site synchronous — both the structured-log transport and the
 *      audit_logs DB write are non-blocking; this function never awaits.
 */
export function emitAudit(event: Omit<AuditEvent, "id" | "occurredAt"> & { id?: string; occurredAt?: string }): void {
  try {
    const full: AuditEvent = {
      id: event.id ?? randomUUID(),
      occurredAt: event.occurredAt ?? new Date().toISOString(),
      type: event.type,
      actor: event.actor,
      target: event.target ? { ...event.target, extras: event.target.extras ? (scrub(event.target.extras) as Record<string, unknown>) : undefined } : undefined,
      context: scrub(event.context) as Record<string, unknown>,
    };

    const line = JSON.stringify({ audit: full });
    // eslint-disable-next-line no-console
    console.log(line);

    persistToDatabase(full);
  } catch {
    // Intentionally swallowed — audit transport must never break the
    // critical auth path. A future milestone could wire this to a
    // dedicated failure queue.
  }
}

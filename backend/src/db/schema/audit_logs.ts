import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

/**
 * Persistent audit trail (Milestone 5, Phase 15).
 *
 * This is the durable sink `emitAudit()` (src/utils/audit.ts) writes to —
 * every AI action, checkout step, payment transition, policy decision,
 * and webhook event that touches money flows through here so a judge/
 * merchant can answer "who did what, when, and why" for any order.
 *
 * Deliberately NOT foreign-keyed to organizations/users:
 *   - Some events happen before an org/user row exists yet (e.g. a failed
 *     login attempt, a rejected registration).
 *   - Audit writes must never fail because of an unrelated FK violation —
 *     emitAudit() is a fire-and-forget, best-effort sink (see its
 *     "NEVER throws" guarantee) and a hard FK would turn a downstream
 *     data problem into a lost audit event.
 * organizationId/actorId are still indexed for fast, tenant-scoped reads.
 */
export const auditActorTypeEnum = pgEnum("audit_actor_type", ["USER", "AI_AGENT", "SYSTEM"]);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Nullable — see class comment. Every checkout/payment/order event
    // does have one; only a handful of pre-tenant auth events don't.
    organizationId: uuid("organization_id"),
    actorType: auditActorTypeEnum("actor_type").notNull().default("SYSTEM"),
    // Nullable — SYSTEM-originated events (e.g. a webhook-driven state
    // transition) have no human/agent actor.
    actorId: uuid("actor_id"),
    // The AuditEventType string (e.g. "CHECKOUT_REQUESTED",
    // "PAYMENT_CAPTURED") — kept as free text here (not a DB enum) so a
    // new event type is a one-line change in audit.ts, not a migration.
    action: varchar("action", { length: 128 }).notNull(),
    resourceType: varchar("resource_type", { length: 64 }),
    // Not a uuid column on purpose: a resourceId can be an internal UUID
    // (order/payment id) OR a provider id (e.g. "order_Ncy3XX...").
    resourceId: varchar("resource_id", { length: 255 }),
    reason: text("reason"),
    // Already scrubbed of secrets by emitAudit()/scrub() before it gets
    // here — this column must never receive raw request bodies.
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    orgCreatedIdx: index("audit_logs_org_created_idx").on(table.organizationId, table.createdAt),
    resourceIdx: index("audit_logs_resource_idx").on(table.resourceType, table.resourceId),
    actionIdx: index("audit_logs_action_idx").on(table.action),
  })
);

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

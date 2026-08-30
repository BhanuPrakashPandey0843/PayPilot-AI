/**
 * Payment state machine + webhook idempotency (Phases 9, 11, 12, 14).
 * This is the ONLY module allowed to write `payment_attempts.status` or
 * insert into `payments` — checkout.service.ts and webhook.routes.ts
 * both call through here rather than touching the repository directly,
 * so a transition can never be applied twice by two different code paths.
 */
import type { Executor } from "../../db/index.js";
import { db } from "../../db/index.js";
import { Errors } from "../../utils/errors.js";
import { emitAudit, type AuditActorType } from "../../utils/audit.js";
import { isValidAttemptTransition, type PaymentAttemptStatus } from "./payment.constants.js";
import {
  casUpdatePaymentAttemptStatus,
  getPaymentAttemptByIdScoped,
  insertPayment,
  listActiveAttemptsForOrder,
  claimWebhookEventOnce,
  markWebhookEventProcessed,
} from "./payment.repository.js";
import { listItemsForOrder, transitionOrderStatus } from "../orders/orders.service.js";
import { restoreInventoryForOrg } from "../products/products.service.js";
import type { PaymentAttempt } from "../../db/schema/payments.js";
import type { NewWebhookEvent } from "../../db/schema/webhook_events.js";

interface ActorInfo {
  userId?: string;
  actorType?: AuditActorType;
}

export interface TransitionOutcome {
  attempt: PaymentAttempt;
  /**
   * true  = this call performed the actual state change.
   * false = a concurrent writer had already reached `toStatus` first (a
   *         benign race); the row is unchanged by THIS call. Callers with
   *         additional side effects gated on the transition itself
   *         (captureAttempt's payment insert, failAttempt's inventory
   *         restore) must check this and skip those side effects when
   *         `applied` is false, or they'd run twice for the same event.
   */
  applied: boolean;
}

/**
 * Applies a validated status transition to a payment attempt. Rejects
 * (throws Errors.conflict) any transition not in ATTEMPT_STATUS_TRANSITIONS
 * — e.g. a stale/replayed webhook can never move a `captured` attempt
 * back to `pending`.
 *
 * Concurrency-safe: the actual write is a compare-and-swap on the exact
 * status `attempt` was read at (see payment.repository.ts
 * `casUpdatePaymentAttemptStatus`). Two callers racing on the same
 * attempt (e.g. a Razorpay webhook and a racing /verify-payment call)
 * can no longer have the second one blindly overwrite what the first
 * one just committed — the loser re-fetches and either finds the SAME
 * target state already reached (idempotent, returns `applied: false`)
 * or a genuinely conflicting state (throws).
 */
export async function transitionAttempt(
  executor: Executor,
  attempt: PaymentAttempt,
  toStatus: PaymentAttemptStatus,
  extra: Partial<{ providerPaymentId: string | null; providerOrderId: string | null; failureCode: string | null; failureMessage: string | null }> = {},
  actor: ActorInfo = { actorType: "SYSTEM" }
): Promise<TransitionOutcome> {
  if (!isValidAttemptTransition(attempt.status, toStatus)) {
    throw Errors.conflict(`Invalid payment attempt transition: ${attempt.status} -> ${toStatus}`, {
      attemptId: attempt.id,
      from: attempt.status,
      to: toStatus,
    });
  }

  const updated = await casUpdatePaymentAttemptStatus(executor, attempt.id, attempt.status, { status: toStatus, ...extra });

  if (!updated) {
    // Lost the race — someone else wrote to this row between our caller's
    // read and this UPDATE. Find out what actually happened.
    const fresh = await getPaymentAttemptByIdScoped(attempt.organizationId, attempt.id, executor);
    if (!fresh) throw Errors.notFound("Payment attempt not found");
    if (fresh.status === toStatus) return { attempt: fresh, applied: false }; // same target reached by a concurrent writer — idempotent
    throw Errors.conflict(
      `Payment attempt was concurrently transitioned to "${fresh.status}" while attempting ${attempt.status} -> ${toStatus}`,
      { attemptId: attempt.id, from: attempt.status, attemptedTo: toStatus, actualStatus: fresh.status }
    );
  }

  emitAudit({
    type:
      toStatus === "captured"
        ? "PAYMENT_CAPTURED"
        : toStatus === "authorized"
          ? "PAYMENT_AUTHORIZED"
          : toStatus === "failed"
            ? "PAYMENT_FAILED"
            : "PAYMENT_VERIFIED",
    actor: { userId: actor.userId, organizationId: attempt.organizationId, actorType: actor.actorType ?? "SYSTEM" },
    target: { kind: "payment_attempt", id: attempt.id, extras: { from: attempt.status, to: toStatus, orderId: attempt.orderId } },
    context: { reason: `Payment attempt transitioned ${attempt.status} -> ${toStatus}` },
  });

  return { attempt: updated, applied: true };
}

/**
 * Captures a payment: the definitive "money has actually moved" state.
 * Idempotent by construction — `payments.payment_attempt_id` has a unique
 * index, so a webhook redelivering `payment.captured` after
 * /verify-payment already handled it hits a no-op FK/attempt-transition
 * (captured -> captured is a same-state no-op per isValidAttemptTransition)
 * rather than double-crediting anything.
 */
export async function captureAttempt(
  executor: Executor,
  attempt: PaymentAttempt,
  razorpayPaymentId: string,
  actor: ActorInfo = { actorType: "SYSTEM" }
): Promise<void> {
  if (attempt.status === "captured") return; // already handled — idempotent replay

  const { applied } = await transitionAttempt(executor, attempt, "captured", { providerPaymentId: razorpayPaymentId }, actor);
  // A concurrent writer (e.g. the webhook and /verify-payment racing for
  // the same payment) already captured this exact attempt first — it
  // already inserted the `payments` row and transitioned the order.
  // Doing so again would hit the unique index on payments.payment_attempt_id.
  if (!applied) return;

  await insertPayment(executor, {
    organizationId: attempt.organizationId,
    orderId: attempt.orderId,
    paymentAttemptId: attempt.id,
    provider: "razorpay",
    providerPaymentId: razorpayPaymentId,
    amount: attempt.amount,
    currency: attempt.currency,
    status: "captured",
    capturedAt: new Date(),
  });

  await transitionOrderStatus(executor, attempt.organizationId, attempt.orderId, "paid", "Razorpay payment captured and signature/webhook verified.", actor);
}

/**
 * Marks an attempt failed (Phase 12) and, if this was the order's last
 * active attempt, flips the order itself to `failed` and restores the
 * inventory reserved at checkout time (Phase 14) — a buyer whose payment
 * failed shouldn't have permanently taken stock away from other buyers.
 * If another attempt is still in flight for the same order (shouldn't
 * normally happen, but defensively handled), the order stays `pending`.
 */
export async function failAttempt(
  executor: Executor,
  attempt: PaymentAttempt,
  failureCode: string | null,
  failureMessage: string | null,
  actor: ActorInfo = { actorType: "SYSTEM" }
): Promise<void> {
  if (attempt.status === "failed") return; // already handled

  const { applied } = await transitionAttempt(executor, attempt, "failed", { failureCode, failureMessage }, actor);
  // A concurrent writer already marked this exact attempt failed (and, if
  // applicable, already restored inventory / flipped the order) — doing
  // it again would double-restore stock that was only reserved once.
  if (!applied) return;

  const stillActive = await listActiveAttemptsForOrder(attempt.orderId, executor);
  if (stillActive.length === 0) {
    await transitionOrderStatus(
      executor,
      attempt.organizationId,
      attempt.orderId,
      "failed",
      failureMessage ?? "Payment failed.",
      actor
    );

    const items = await listItemsForOrder(attempt.orderId, executor);
    for (const item of items) {
      if (!item.productId) continue; // product was deleted from the catalog — nothing to restore against
      await restoreInventoryForOrg(executor, attempt.organizationId, item.productId, item.quantity);
      emitAudit({
        type: "INVENTORY_RESTORED",
        actor: { organizationId: attempt.organizationId, actorType: "SYSTEM" },
        target: { kind: "product", id: item.productId, extras: { orderId: attempt.orderId, quantity: item.quantity } },
        context: { reason: "Payment ultimately failed with no further attempt in flight — reserved stock released." },
      });
    }
  }
}

// --- Webhook idempotency (Phase 11) -------------------------------------

export interface WebhookClaimResult {
  claimed: boolean;
  id?: string;
}

/** Claims a webhook event exactly once (DB-backed, multi-instance-safe — see payment.repository.ts). */
export async function recordWebhookEventOnce(values: NewWebhookEvent): Promise<WebhookClaimResult> {
  const claimed = await claimWebhookEventOnce(db, values);
  return claimed ? { claimed: true, id: claimed.id } : { claimed: false };
}

export async function finishWebhookEvent(id: string, status: "PROCESSED" | "IGNORED" | "FAILED"): Promise<void> {
  await markWebhookEventProcessed(db, id, status);
}

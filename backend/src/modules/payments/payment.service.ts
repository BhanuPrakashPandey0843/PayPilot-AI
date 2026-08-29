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
  updatePaymentAttempt,
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

/**
 * Applies a validated status transition to a payment attempt. Rejects
 * (throws Errors.conflict) any transition not in ATTEMPT_STATUS_TRANSITIONS
 * — e.g. a stale/replayed webhook can never move a `captured` attempt
 * back to `pending`.
 */
export async function transitionAttempt(
  executor: Executor,
  attempt: PaymentAttempt,
  toStatus: PaymentAttemptStatus,
  extra: Partial<{ providerPaymentId: string | null; failureCode: string | null; failureMessage: string | null }> = {},
  actor: ActorInfo = { actorType: "SYSTEM" }
): Promise<PaymentAttempt> {
  if (!isValidAttemptTransition(attempt.status, toStatus)) {
    throw Errors.conflict(`Invalid payment attempt transition: ${attempt.status} -> ${toStatus}`, {
      attemptId: attempt.id,
      from: attempt.status,
      to: toStatus,
    });
  }

  const updated = await updatePaymentAttempt(executor, attempt.id, { status: toStatus, ...extra });
  if (!updated) throw Errors.notFound("Payment attempt not found");

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

  return updated;
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

  await transitionAttempt(executor, attempt, "captured", { providerPaymentId: razorpayPaymentId }, actor);

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

  await transitionAttempt(executor, attempt, "failed", { failureCode, failureMessage }, actor);

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

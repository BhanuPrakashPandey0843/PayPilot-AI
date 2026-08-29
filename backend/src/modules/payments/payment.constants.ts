import type { paymentAttemptStatusEnum } from "../../db/schema/payments.js";

export type PaymentAttemptStatus = (typeof paymentAttemptStatusEnum.enumValues)[number];

/**
 * Centralized payment_attempt state machine (Phase 9). This is the ONE
 * place a transition is allowed or rejected — payment.service.ts's
 * `transitionAttempt()` is the only function permitted to write
 * `payment_attempts.status`, and it always checks this matrix first.
 *
 *   created -> pending -> authorized -> captured   (happy path)
 *   pending -> failed                              (payment failure)
 *   created/pending -> cancelled                   (buyer abandoned checkout)
 *
 * captured/failed/cancelled are all terminal for a given ATTEMPT. A
 * retry (Phase 13) never reopens a terminal attempt — it creates a brand
 * new attempt row (attemptNumber + 1) against the same order.
 */
export const ATTEMPT_STATUS_TRANSITIONS: Record<PaymentAttemptStatus, PaymentAttemptStatus[]> = {
  created: ["pending", "failed", "cancelled"],
  pending: ["authorized", "captured", "failed", "cancelled"],
  authorized: ["captured", "failed"],
  captured: [],
  failed: [],
  cancelled: [],
};

export function isValidAttemptTransition(from: PaymentAttemptStatus, to: PaymentAttemptStatus): boolean {
  if (from === to) return true;
  return ATTEMPT_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export const TERMINAL_ATTEMPT_STATUSES: readonly PaymentAttemptStatus[] = ["captured", "failed", "cancelled"];

/** Razorpay webhook event names this system understands (Phase 10) — never invented, only what Razorpay actually sends. */
export const HANDLED_WEBHOOK_EVENTS = [
  "payment.authorized",
  "payment.captured",
  "payment.failed",
] as const;
export type HandledWebhookEvent = (typeof HANDLED_WEBHOOK_EVENTS)[number];

import type { orderStatusEnum } from "../../db/schema/orders.js";

export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];

/**
 * Centralized order state machine (Phase 9 applies this principle to
 * orders too, not just payment_attempts). Reuses the existing
 * `order_status` enum ("pending" | "paid" | "partially_paid" |
 * "cancelled" | "failed" | "refunded") rather than inventing new states
 * — "pending" already covers both DRAFT and PENDING_PAYMENT from the
 * spec's example lifecycle.
 *
 * pending <-> failed is the retry loop (Phase 13): a failed checkout can
 * be retried, which moves the SAME order back to pending with a new
 * payment_attempt, rather than creating a second order.
 */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["paid", "failed", "cancelled"],
  failed: ["pending", "cancelled"], // retry, or buyer gives up
  paid: ["refunded", "partially_paid"],
  partially_paid: ["paid", "refunded"],
  cancelled: [],
  refunded: [],
};

export function isValidOrderTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return true; // idempotent no-op, not an error
  return ORDER_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

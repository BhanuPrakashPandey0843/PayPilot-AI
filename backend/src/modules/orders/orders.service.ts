import { Errors } from "../../utils/errors.js";
import type { Executor } from "../../db/index.js";
import {
  insertOrderWithItems,
  getOrderByIdScoped,
  getOrderByIdempotencyKeyScoped,
  casUpdateOrderStatusScoped,
  getOrderItemsForOrder,
  generateOrderNumber,
} from "./orders.repository.js";
import { isValidOrderTransition } from "./orders.types.js";
import { emitAudit } from "../../utils/audit.js";
import type { NewOrder, NewOrderItem, Order } from "../../db/schema/orders.js";

export async function getOrderForOrg(organizationId: string, id: string): Promise<Order> {
  const order = await getOrderByIdScoped(organizationId, id);
  if (!order) throw Errors.notFound("Order not found");
  return order;
}

export async function findOrderByIdempotencyKey(
  organizationId: string,
  idempotencyKey: string
): Promise<Order | undefined> {
  return getOrderByIdempotencyKeyScoped(organizationId, idempotencyKey);
}

export async function createOrderWithItems(
  executor: Executor,
  values: Omit<NewOrder, "orderNumber"> & { orderNumber?: string },
  items: Omit<NewOrderItem, "orderId">[]
) {
  const orderNumber = values.orderNumber ?? generateOrderNumber();
  const { order, items: insertedItems } = await insertOrderWithItems(
    executor,
    { ...values, orderNumber },
    items
  );
  return { order, items: insertedItems };
}

/**
 * The ONLY place an order's status is ever written (Phase 9's "centralize
 * state transitions, don't scatter status updates across routes"
 * principle, applied to orders as well as payment_attempts). Rejects any
 * transition not in the allowed matrix — e.g. a webhook replaying an old
 * "captured" event can never move a "refunded" order back to "paid".
 */
export async function transitionOrderStatus(
  executor: Executor,
  organizationId: string,
  orderId: string,
  toStatus: Order["status"],
  reason: string,
  actor: { userId?: string; actorType?: "USER" | "AI_AGENT" | "SYSTEM" } = { actorType: "SYSTEM" }
): Promise<Order> {
  const current = await getOrderByIdScoped(organizationId, orderId, executor);
  if (!current) throw Errors.notFound("Order not found");

  if (!isValidOrderTransition(current.status, toStatus)) {
    throw Errors.conflict(
      `Invalid order status transition: ${current.status} -> ${toStatus}`,
      { orderId, from: current.status, to: toStatus }
    );
  }

  // Compare-and-swap on the exact status we just read (concurrency fix).
  // Under READ COMMITTED, a concurrent writer (e.g. a racing webhook vs.
  // /verify-payment, or two attempts on the same order failing/succeeding
  // near-simultaneously) could otherwise have already moved this order
  // to a DIFFERENT state between our SELECT above and this UPDATE — an
  // unconditional write would silently overwrite that. If the CAS misses,
  // re-fetch: reaching the SAME target status some other way is a benign
  // idempotent race (return the fresh row); reaching any OTHER status is
  // a genuine conflict and must not be papered over.
  const updated = await casUpdateOrderStatusScoped(organizationId, orderId, current.status, toStatus, executor);
  if (!updated) {
    const fresh = await getOrderByIdScoped(organizationId, orderId, executor);
    if (!fresh) throw Errors.notFound("Order not found");
    if (fresh.status === toStatus) return fresh;
    throw Errors.conflict(
      `Order was concurrently transitioned to "${fresh.status}" while attempting ${current.status} -> ${toStatus}`,
      { orderId, from: current.status, attemptedTo: toStatus, actualStatus: fresh.status }
    );
  }

  emitAudit({
    type: "ORDER_STATUS_CHANGED",
    actor: { userId: actor.userId, organizationId, actorType: actor.actorType ?? "SYSTEM" },
    target: { kind: "order", id: orderId, extras: { from: current.status, to: toStatus } },
    context: { reason },
  });

  return updated;
}

export async function listItemsForOrder(orderId: string, executor?: Executor) {
  return getOrderItemsForOrder(orderId, executor);
}

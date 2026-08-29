import { Errors } from "../../utils/errors.js";
import type { Executor } from "../../db/index.js";
import {
  insertOrderWithItems,
  getOrderByIdScoped,
  getOrderByIdempotencyKeyScoped,
  updateOrderStatusScoped,
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

  const updated = await updateOrderStatusScoped(organizationId, orderId, toStatus, executor);
  if (!updated) throw Errors.notFound("Order not found");

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

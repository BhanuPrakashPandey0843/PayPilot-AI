import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db, type Executor } from "../../db/index.js";
import { orders, orderItems, type NewOrder, type NewOrderItem, type Order } from "../../db/schema/orders.js";

/**
 * Every function here accepts an optional `executor` (plain `db` or a
 * `db.transaction()` callback's `tx`) so callers (checkout.service.ts)
 * can compose order creation + inventory decrement + payment_attempt
 * creation into a single atomic transaction (Phase 25), while routes
 * that just need a read can pass nothing and get the default pool.
 */
export type { Executor };

export async function insertOrderWithItems(
  executor: Executor,
  orderValues: NewOrder,
  items: Omit<NewOrderItem, "orderId">[]
): Promise<{ order: Order; items: NewOrderItem[] }> {
  const [order] = await executor.insert(orders).values(orderValues).returning();
  const insertedItems = items.length
    ? await executor
        .insert(orderItems)
        .values(items.map((i) => ({ ...i, orderId: order.id })))
        .returning()
    : [];
  return { order, items: insertedItems };
}

export async function getOrderByIdScoped(
  organizationId: string,
  id: string,
  executor: Executor = db
): Promise<Order | undefined> {
  const [row] = await executor
    .select()
    .from(orders)
    .where(and(eq(orders.id, id), eq(orders.organizationId, organizationId)))
    .limit(1);
  return row;
}

export async function getOrderByIdempotencyKeyScoped(
  organizationId: string,
  idempotencyKey: string,
  executor: Executor = db
): Promise<Order | undefined> {
  const [row] = await executor
    .select()
    .from(orders)
    .where(and(eq(orders.organizationId, organizationId), eq(orders.idempotencyKey, idempotencyKey)))
    .limit(1);
  return row;
}

export async function updateOrderStatusScoped(
  organizationId: string,
  id: string,
  status: Order["status"],
  executor: Executor = db
): Promise<Order | undefined> {
  const [row] = await executor
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(orders.id, id), eq(orders.organizationId, organizationId)))
    .returning();
  return row;
}

export async function getOrderItemsForOrder(orderId: string, executor: Executor = db) {
  return executor.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

/** Order numbers are unique per-organization (see orders.ts) — human-friendly, e.g. "ORD-20260829-4F2A". */
export function generateOrderNumber(): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = randomUUID().slice(0, 6).toUpperCase();
  return `ORD-${datePart}-${randomPart}`;
}

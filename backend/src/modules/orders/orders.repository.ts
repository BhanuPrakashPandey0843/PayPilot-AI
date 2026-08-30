import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
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

/**
 * Compare-and-swap status update (concurrency fix — same rationale as
 * payment.repository.ts's `casUpdatePaymentAttemptStatus`). The WHERE
 * clause requires the row to STILL be in `fromStatus`, so two concurrent
 * writers racing on the same order (e.g. a webhook-driven capture and a
 * failure callback for a stale attempt) can never have the second one
 * blindly overwrite what the first one just committed. Returns
 * `undefined` if the row wasn't in `fromStatus` at UPDATE time — callers
 * must re-fetch to find out what actually happened.
 */
export async function casUpdateOrderStatusScoped(
  organizationId: string,
  id: string,
  fromStatus: Order["status"],
  toStatus: Order["status"],
  executor: Executor = db
): Promise<Order | undefined> {
  const [row] = await executor
    .update(orders)
    .set({ status: toStatus, updatedAt: new Date() })
    .where(and(eq(orders.id, id), eq(orders.organizationId, organizationId), eq(orders.status, fromStatus)))
    .returning();
  return row;
}

export async function getOrderItemsForOrder(orderId: string, executor: Executor = db) {
  return executor.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

/**
 * Milestone 6 Phase 7/8 — revenue-opportunity PAYMENT_RECOVERY execution
 * (revenue.execution.ts) needs the most recent FAILED order for a given
 * customer, scoped to the organization, to prepare a fresh recovery
 * payment attempt. Never trusts a client-supplied orderId — always
 * re-derives it here from (organizationId, customerId, status="failed").
 */
export async function getMostRecentFailedOrderForCustomer(
  organizationId: string,
  customerId: string,
  executor: Executor = db
): Promise<Order | undefined> {
  const [row] = await executor
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.organizationId, organizationId),
        eq(orders.customerId, customerId),
        eq(orders.status, "failed")
      )
    )
    .orderBy(desc(orders.updatedAt))
    .limit(1);
  return row;
}

/** Order numbers are unique per-organization (see orders.ts) — human-friendly, e.g. "ORD-20260829-4F2A". */
export function generateOrderNumber(): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = randomUUID().slice(0, 6).toUpperCase();
  return `ORD-${datePart}-${randomPart}`;
}

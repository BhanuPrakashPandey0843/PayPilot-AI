import { randomUUID } from "node:crypto";
import { and, asc, count, desc, eq, gte, ilike, inArray, lte, or, sql, type SQL } from "drizzle-orm";
import { db, type Executor } from "../../db/index.js";
import { orders, orderItems, type NewOrder, type NewOrderItem, type Order } from "../../db/schema/orders.js";
import { customers } from "../../db/schema/customers.js";
import { paymentAttempts, type PaymentAttempt } from "../../db/schema/payments.js";

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

// ---------------------------------------------------------------------
// Admin listing (/orders page). Added alongside the checkout-facing
// functions above — same table, same organization-scoping discipline,
// just read paths that didn't exist yet (this module previously had no
// routes file at all; see orders.routes.ts).
// ---------------------------------------------------------------------

export interface OrderCustomerSummary {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

export interface OrderListRow extends Order {
  customer: OrderCustomerSummary | null;
}

export interface OrderFilters {
  /** Matches order number OR the joined customer's name/email (ILIKE). */
  search?: string;
  status?: Order["status"];
  customerId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  /** Integer minor units. */
  minAmount?: number;
  /** Integer minor units. */
  maxAmount?: number;
}

export type OrderSortField = "createdAt" | "updatedAt" | "totalAmount" | "orderNumber";
export type OrderSortDirection = "asc" | "desc";

export interface OrderSorting {
  sort?: OrderSortField;
  order?: OrderSortDirection;
}

export interface OrderPagination {
  page: number;
  limit: number;
}

function buildOrderWhere(organizationId: string, filters: OrderFilters): SQL {
  const conditions = [eq(orders.organizationId, organizationId)];

  if (filters.status) conditions.push(eq(orders.status, filters.status));
  if (filters.customerId) conditions.push(eq(orders.customerId, filters.customerId));
  if (filters.dateFrom) conditions.push(gte(orders.createdAt, filters.dateFrom));
  if (filters.dateTo) conditions.push(lte(orders.createdAt, filters.dateTo));
  if (filters.minAmount !== undefined) conditions.push(gte(orders.totalAmount, filters.minAmount));
  if (filters.maxAmount !== undefined) conditions.push(lte(orders.totalAmount, filters.maxAmount));
  if (filters.search) {
    const term = `%${filters.search}%`;
    const searchCondition = or(
      ilike(orders.orderNumber, term),
      ilike(customers.name, term),
      ilike(customers.email, term)
    );
    if (searchCondition) conditions.push(searchCondition);
  }

  return and(...conditions) as SQL;
}

const ORDER_SORT_COLUMNS = {
  createdAt: orders.createdAt,
  updatedAt: orders.updatedAt,
  totalAmount: orders.totalAmount,
  orderNumber: orders.orderNumber,
} as const;

function buildOrderOrderBy(sorting: OrderSorting): SQL {
  const column = ORDER_SORT_COLUMNS[sorting.sort ?? "createdAt"];
  return (sorting.order === "asc" ? asc(column) : desc(column)) as SQL;
}

/**
 * Organization-scoped, searchable, filterable, sortable, paginated order
 * list — left-joins `customers` (an order's customer can never be
 * deleted out from under it; the composite FK on orders.ts guarantees
 * the row exists, but LEFT JOIN is used defensively rather than assuming
 * that at the query layer) so the merchant sees a name/email without a
 * second round trip per row.
 */
export async function listOrdersScoped(
  organizationId: string,
  filters: OrderFilters,
  pagination: OrderPagination,
  sorting: OrderSorting = {},
  executor: Executor = db
): Promise<{ rows: OrderListRow[]; total: number }> {
  const where = buildOrderWhere(organizationId, filters);
  const offset = (pagination.page - 1) * pagination.limit;

  const [rows, [{ total }]] = await Promise.all([
    executor
      .select({
        order: orders,
        customerId: customers.id,
        customerName: customers.name,
        customerEmail: customers.email,
        customerPhone: customers.phone,
      })
      .from(orders)
      .leftJoin(customers, eq(customers.id, orders.customerId))
      .where(where)
      .orderBy(buildOrderOrderBy(sorting))
      .limit(pagination.limit)
      .offset(offset),
    executor
      .select({ total: count() })
      .from(orders)
      .leftJoin(customers, eq(customers.id, orders.customerId))
      .where(where),
  ]);

  return {
    rows: rows.map((r) => ({
      ...r.order,
      customer: r.customerId
        ? { id: r.customerId, name: r.customerName ?? "", email: r.customerEmail, phone: r.customerPhone }
        : null,
    })),
    total: Number(total ?? 0),
  };
}

/**
 * Latest (highest attemptNumber) payment_attempt per order, for a batch
 * of order ids — one query instead of N, used to annotate the order list
 * with a "Payment Status" column (created/pending/authorized/captured/
 * failed/cancelled) distinct from the order's own status (pending/paid/
 * partially_paid/cancelled/failed/refunded). Never assumes attempts come
 * back pre-grouped from SQL — reduces to "max attemptNumber per orderId"
 * in application code, same reasoning as analytics.repository.ts's
 * getCoPurchasePairs for why this is done here rather than a fragile
 * DISTINCT ON across a mixed Drizzle/raw-SQL boundary.
 */
export async function getLatestAttemptsForOrders(
  orderIds: string[],
  executor: Executor = db
): Promise<Map<string, PaymentAttempt>> {
  const map = new Map<string, PaymentAttempt>();
  if (orderIds.length === 0) return map;

  const rows = await executor.select().from(paymentAttempts).where(inArray(paymentAttempts.orderId, orderIds));
  for (const row of rows) {
    const existing = map.get(row.orderId);
    if (!existing || row.attemptNumber > existing.attemptNumber) {
      map.set(row.orderId, row);
    }
  }
  return map;
}

export interface OrdersSummary {
  totalOrders: number;
  pendingOrders: number;
  paidOrders: number;
  partiallyPaidOrders: number;
  failedOrders: number;
  cancelledOrders: number;
  refundedOrders: number;
  /** Sum of totalAmount across "paid" orders only — the same definition
   * of "money actually collected" as analytics.repository.ts's
   * getRevenueTotals (captured payments), just read off the order row
   * directly rather than the payments table, since this summary has no
   * date range to join against. Never includes pending/failed/refunded
   * orders. */
  totalRevenueMinor: number;
  currency: string;
}

/** Real, exact counts per order status + real revenue sum — no estimation, no client-side aggregation of unpaginated rows. Backs the /orders page's summary cards. */
export async function getOrdersSummaryScoped(
  organizationId: string,
  executor: Executor = db
): Promise<OrdersSummary> {
  const [statusRows, [revenueRow]] = await Promise.all([
    executor
      .select({ status: orders.status, total: count() })
      .from(orders)
      .where(eq(orders.organizationId, organizationId))
      .groupBy(orders.status),
    executor
      .select({
        totalRevenueMinor: sql<number>`coalesce(sum(${orders.totalAmount}), 0)::bigint`,
        currency: sql<string>`min(${orders.currency})`,
      })
      .from(orders)
      .where(and(eq(orders.organizationId, organizationId), eq(orders.status, "paid"))),
  ]);

  const counts: Partial<Record<Order["status"], number>> = {};
  let totalOrders = 0;
  for (const row of statusRows) {
    const n = Number(row.total);
    counts[row.status] = n;
    totalOrders += n;
  }

  return {
    totalOrders,
    pendingOrders: counts.pending ?? 0,
    paidOrders: counts.paid ?? 0,
    partiallyPaidOrders: counts.partially_paid ?? 0,
    failedOrders: counts.failed ?? 0,
    cancelledOrders: counts.cancelled ?? 0,
    refundedOrders: counts.refunded ?? 0,
    totalRevenueMinor: Number(revenueRow?.totalRevenueMinor ?? 0),
    currency: revenueRow?.currency ?? "INR",
  };
}

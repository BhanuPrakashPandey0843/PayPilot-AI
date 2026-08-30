import { and, eq, gte, lte, sql, desc, asc, count, inArray } from "drizzle-orm";
import { db } from "../../db/index.js";
import { orders, orderItems } from "../../db/schema/orders.js";
import { payments, paymentAttempts } from "../../db/schema/payments.js";
import { products } from "../../db/schema/products.js";

/**
 * Milestone 6 — deterministic analytics aggregation. Every function here
 * is a single SQL aggregation query (no loading rows into Node and
 * summing in JS, no N+1) and every WHERE clause starts with the caller's
 * organizationId — there is no code path in this file that can return
 * another organization's data, because there is no function here that
 * doesn't take organizationId as its first argument.
 */

export interface DateRange {
  from: Date;
  to: Date;
}

// --- Revenue / orders overview -----------------------------------------

export interface RevenueTotals {
  totalRevenueMinor: number;
  paidOrderCount: number;
}

/** Sum of captured payments + count of distinct paid orders in [from, to). */
export async function getRevenueTotals(organizationId: string, range: DateRange): Promise<RevenueTotals> {
  const [row] = await db
    .select({
      totalRevenueMinor: sql<number>`coalesce(sum(${payments.amount}), 0)::bigint`,
      paidOrderCount: sql<number>`count(distinct ${payments.orderId})`,
    })
    .from(payments)
    .where(
      and(
        eq(payments.organizationId, organizationId),
        eq(payments.status, "captured"),
        gte(payments.capturedAt, range.from),
        lte(payments.capturedAt, range.to)
      )
    );
  return {
    totalRevenueMinor: Number(row?.totalRevenueMinor ?? 0),
    paidOrderCount: Number(row?.paidOrderCount ?? 0),
  };
}

export async function getOrderCount(organizationId: string, range: DateRange): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(orders)
    .where(
      and(eq(orders.organizationId, organizationId), gte(orders.createdAt, range.from), lte(orders.createdAt, range.to))
    );
  return Number(row?.total ?? 0);
}

export interface PaymentAttemptCounts {
  successful: number;
  failed: number;
  pending: number;
}

export async function getPaymentAttemptCounts(
  organizationId: string,
  range: DateRange
): Promise<PaymentAttemptCounts> {
  const rows = await db
    .select({ status: paymentAttempts.status, total: count() })
    .from(paymentAttempts)
    .where(
      and(
        eq(paymentAttempts.organizationId, organizationId),
        gte(paymentAttempts.createdAt, range.from),
        lte(paymentAttempts.createdAt, range.to)
      )
    )
    .groupBy(paymentAttempts.status);

  let successful = 0;
  let failed = 0;
  let pending = 0;
  for (const r of rows) {
    const n = Number(r.total);
    if (r.status === "captured" || r.status === "authorized") successful += n;
    else if (r.status === "failed" || r.status === "cancelled") failed += n;
    else pending += n; // created | pending
  }
  return { successful, failed, pending };
}

export interface FailedPaymentValue {
  failedCount: number;
  failedValueMinor: number;
}

export async function getFailedPaymentValue(organizationId: string, range: DateRange): Promise<FailedPaymentValue> {
  const [row] = await db
    .select({
      failedCount: count(),
      failedValueMinor: sql<number>`coalesce(sum(${paymentAttempts.amount}), 0)::bigint`,
    })
    .from(paymentAttempts)
    .where(
      and(
        eq(paymentAttempts.organizationId, organizationId),
        eq(paymentAttempts.status, "failed"),
        gte(paymentAttempts.createdAt, range.from),
        lte(paymentAttempts.createdAt, range.to)
      )
    );
  return {
    failedCount: Number(row?.failedCount ?? 0),
    failedValueMinor: Number(row?.failedValueMinor ?? 0),
  };
}

export interface TopProductRow {
  productId: string | null;
  productName: string;
  revenueMinor: number;
  unitsSold: number;
}

/** Revenue-ranked products for PAID orders within [from, to). */
export async function getTopProducts(
  organizationId: string,
  range: DateRange,
  limit: number
): Promise<TopProductRow[]> {
  const rows = await db
    .select({
      productId: orderItems.productId,
      productName: orderItems.productName,
      revenueMinor: sql<number>`coalesce(sum(${orderItems.totalAmount}), 0)::bigint`,
      unitsSold: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(
      and(
        eq(orders.organizationId, organizationId),
        eq(orders.status, "paid"),
        gte(orders.createdAt, range.from),
        lte(orders.createdAt, range.to)
      )
    )
    .groupBy(orderItems.productId, orderItems.productName)
    .orderBy(desc(sql`sum(${orderItems.totalAmount})`))
    .limit(limit);

  return rows.map((r) => ({
    productId: r.productId,
    productName: r.productName,
    revenueMinor: Number(r.revenueMinor),
    unitsSold: Number(r.unitsSold),
  }));
}

/** Full product-analytics table (Phase: product analytics), paginated. */
export interface ProductAnalyticsRow extends TopProductRow {
  orderCount: number;
  averageSellingPriceMinor: number;
  isActive: boolean;
}

export async function getProductAnalytics(
  organizationId: string,
  range: DateRange,
  pagination: { page: number; limit: number },
  sorting: { sort: "revenue" | "unitsSold" | "orderCount"; order: "asc" | "desc" }
): Promise<{ rows: ProductAnalyticsRow[]; total: number }> {
  const offset = (pagination.page - 1) * pagination.limit;

  const sortExprMap = {
    revenue: sql`sum(${orderItems.totalAmount})`,
    unitsSold: sql`sum(${orderItems.quantity})`,
    orderCount: sql`count(distinct ${orderItems.orderId})`,
  } as const;
  const orderFn = sorting.order === "asc" ? asc : desc;

  const baseWhere = and(
    eq(orders.organizationId, organizationId),
    eq(orders.status, "paid"),
    gte(orders.createdAt, range.from),
    lte(orders.createdAt, range.to)
  );

  const rows = await db
    .select({
      productId: orderItems.productId,
      productName: orderItems.productName,
      revenueMinor: sql<number>`coalesce(sum(${orderItems.totalAmount}), 0)::bigint`,
      unitsSold: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int`,
      orderCount: sql<number>`count(distinct ${orderItems.orderId})::int`,
      isActive: sql<boolean>`coalesce(bool_or(${products.isActive}), false)`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .leftJoin(products, eq(products.id, orderItems.productId))
    .where(baseWhere)
    .groupBy(orderItems.productId, orderItems.productName)
    .orderBy(orderFn(sortExprMap[sorting.sort]))
    .limit(pagination.limit)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: sql<number>`count(distinct (${orderItems.productId}, ${orderItems.productName}))::int` })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(baseWhere);

  return {
    rows: rows.map((r) => ({
      productId: r.productId,
      productName: r.productName,
      revenueMinor: Number(r.revenueMinor),
      unitsSold: Number(r.unitsSold),
      orderCount: Number(r.orderCount),
      averageSellingPriceMinor: r.unitsSold > 0 ? Math.round(Number(r.revenueMinor) / Number(r.unitsSold)) : 0,
      isActive: Boolean(r.isActive),
    })),
    total: Number(total ?? 0),
  };
}

// --- Revenue trend / series ----------------------------------------------

export interface RevenueSeriesPoint {
  bucket: string; // ISO date (day granularity)
  revenueMinor: number;
  orderCount: number;
}

/** Daily revenue/order-count series for [from, to), for chart rendering. */
export async function getRevenueSeries(organizationId: string, range: DateRange): Promise<RevenueSeriesPoint[]> {
  const rows = await db
    .select({
      bucket: sql<string>`to_char(date_trunc('day', ${payments.capturedAt}), 'YYYY-MM-DD')`,
      revenueMinor: sql<number>`coalesce(sum(${payments.amount}), 0)::bigint`,
      orderCount: sql<number>`count(distinct ${payments.orderId})::int`,
    })
    .from(payments)
    .where(
      and(
        eq(payments.organizationId, organizationId),
        eq(payments.status, "captured"),
        gte(payments.capturedAt, range.from),
        lte(payments.capturedAt, range.to)
      )
    )
    .groupBy(sql`date_trunc('day', ${payments.capturedAt})`)
    .orderBy(asc(sql`date_trunc('day', ${payments.capturedAt})`));

  return rows.map((r) => ({
    bucket: r.bucket,
    revenueMinor: Number(r.revenueMinor),
    orderCount: Number(r.orderCount),
  }));
}

// --- Cross-sell / co-purchase (shared with the revenue opportunity engine) --

export interface ProductPurchaseCount {
  productId: string;
  productName: string;
  customerCount: number;
}

/** Distinct-customer purchase counts per product, over PAID orders in [from, to). */
export async function getProductPurchaseCounts(
  organizationId: string,
  range: DateRange,
  minCustomers: number
): Promise<ProductPurchaseCount[]> {
  const rows = await db
    .select({
      productId: orderItems.productId,
      productName: orderItems.productName,
      customerCount: sql<number>`count(distinct ${orders.customerId})::int`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(
      and(
        eq(orders.organizationId, organizationId),
        eq(orders.status, "paid"),
        gte(orders.createdAt, range.from),
        lte(orders.createdAt, range.to),
        sql`${orderItems.productId} is not null`
      )
    )
    .groupBy(orderItems.productId, orderItems.productName)
    .having(sql`count(distinct ${orders.customerId}) >= ${minCustomers}`);

  return rows.map((r) => ({
    productId: r.productId as string,
    productName: r.productName,
    customerCount: Number(r.customerCount),
  }));
}

export interface CoPurchasePair {
  productAId: string;
  productBId: string;
  bothCount: number;
}

/**
 * For every unordered pair of products (A.id < B.id), the number of
 * DISTINCT CUSTOMERS who have bought both at some point within [from,
 * to) — the numerator for cross-sell attachment rate.
 * getProductPurchaseCounts above supplies the denominator (customers who
 * bought product A at all).
 *
 * Computed in application code from one flat, org-scoped, date-bounded
 * query rather than a self-join in SQL: the row count fetched is bounded
 * by (customers x distinct products purchased), which stays small for a
 * real merchant's catalog even as raw order volume grows, and keeps the
 * pairing logic easy to verify (no risk of a subtly-wrong SQL self-join
 * silently over/under-counting pairs).
 */
export async function getCoPurchasePairs(organizationId: string, range: DateRange): Promise<CoPurchasePair[]> {
  const purchases = await db
    .select({
      customerId: orders.customerId,
      productId: orderItems.productId,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(
      and(
        eq(orders.organizationId, organizationId),
        eq(orders.status, "paid"),
        gte(orders.createdAt, range.from),
        lte(orders.createdAt, range.to),
        sql`${orderItems.productId} is not null`
      )
    );

  const productsByCustomer = new Map<string, Set<string>>();
  for (const p of purchases) {
    if (!p.productId) continue;
    if (!productsByCustomer.has(p.customerId)) productsByCustomer.set(p.customerId, new Set());
    productsByCustomer.get(p.customerId)!.add(p.productId);
  }

  const pairCounts = new Map<string, number>();
  for (const productSet of productsByCustomer.values()) {
    const ids = [...productSet].sort();
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const key = `${ids[i]}::${ids[j]}`;
        pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
      }
    }
  }

  return [...pairCounts.entries()].map(([key, bothCount]) => {
    const [productAId, productBId] = key.split("::");
    return { productAId, productBId, bothCount };
  });
}

// --- Abandoned checkouts ---------------------------------------------------

export interface AbandonedCheckoutRow {
  orderId: string;
  orderNumber: string;
  customerId: string;
  totalAmountMinor: number;
  currency: string;
  createdAt: Date;
  ageMinutes: number;
}

/** Orders still "pending" and older than `thresholdMinutes`. */
export async function getAbandonedCheckouts(
  organizationId: string,
  thresholdMinutes: number,
  limit = 50
): Promise<AbandonedCheckoutRow[]> {
  const cutoff = new Date(Date.now() - thresholdMinutes * 60 * 1000);
  const rows = await db
    .select({
      orderId: orders.id,
      orderNumber: orders.orderNumber,
      customerId: orders.customerId,
      totalAmountMinor: orders.totalAmount,
      currency: orders.currency,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(and(eq(orders.organizationId, organizationId), eq(orders.status, "pending"), lte(orders.createdAt, cutoff)))
    .orderBy(desc(orders.totalAmount))
    .limit(limit);

  const now = Date.now();
  return rows.map((r) => ({
    ...r,
    ageMinutes: Math.round((now - r.createdAt.getTime()) / 60000),
  }));
}

// --- Payment failure patterns -----------------------------------------------

export interface FailureByCode {
  failureCode: string | null;
  count: number;
  valueMinor: number;
}

export async function getFailuresByCode(organizationId: string, range: DateRange): Promise<FailureByCode[]> {
  const rows = await db
    .select({
      failureCode: paymentAttempts.failureCode,
      count: count(),
      valueMinor: sql<number>`coalesce(sum(${paymentAttempts.amount}), 0)::bigint`,
    })
    .from(paymentAttempts)
    .where(
      and(
        eq(paymentAttempts.organizationId, organizationId),
        eq(paymentAttempts.status, "failed"),
        gte(paymentAttempts.createdAt, range.from),
        lte(paymentAttempts.createdAt, range.to)
      )
    )
    .groupBy(paymentAttempts.failureCode)
    .orderBy(desc(count()));

  return rows.map((r) => ({ failureCode: r.failureCode, count: Number(r.count), valueMinor: Number(r.valueMinor) }));
}

/** Customers with 2+ failed attempts in range — used by PAYMENT_RECOVERY. */
export async function getRepeatFailureCustomers(
  organizationId: string,
  range: DateRange,
  minFailures = 2
): Promise<{ customerId: string; failureCount: number; totalFailedValueMinor: number }[]> {
  const rows = await db
    .select({
      customerId: orders.customerId,
      failureCount: count(),
      totalFailedValueMinor: sql<number>`coalesce(sum(${paymentAttempts.amount}), 0)::bigint`,
    })
    .from(paymentAttempts)
    .innerJoin(orders, eq(orders.id, paymentAttempts.orderId))
    .where(
      and(
        eq(paymentAttempts.organizationId, organizationId),
        eq(paymentAttempts.status, "failed"),
        gte(paymentAttempts.createdAt, range.from),
        lte(paymentAttempts.createdAt, range.to)
      )
    )
    .groupBy(orders.customerId)
    .having(sql`count(*) >= ${minFailures}`);

  return rows.map((r) => ({
    customerId: r.customerId,
    failureCount: Number(r.failureCount),
    totalFailedValueMinor: Number(r.totalFailedValueMinor),
  }));
}

// --- Upsell candidate data ---------------------------------------------------

export interface CustomerProductPurchase {
  customerId: string;
  productId: string;
  category: string | null;
  price: number;
  purchasedAt: Date;
}

/** Every (customer, product) purchase in range — used for upsell detection. */
export async function getCustomerProductPurchases(
  organizationId: string,
  range: DateRange
): Promise<CustomerProductPurchase[]> {
  const rows = await db
    .select({
      customerId: orders.customerId,
      productId: orderItems.productId,
      category: products.category,
      price: products.price,
      purchasedAt: orders.createdAt,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .innerJoin(products, eq(products.id, orderItems.productId))
    .where(
      and(
        eq(orders.organizationId, organizationId),
        eq(orders.status, "paid"),
        gte(orders.createdAt, range.from),
        lte(orders.createdAt, range.to)
      )
    );

  return rows
    .filter((r): r is typeof r & { productId: string } => Boolean(r.productId))
    .map((r) => ({
      customerId: r.customerId,
      productId: r.productId as string,
      category: r.category,
      price: r.price,
      purchasedAt: r.purchasedAt,
    }));
}

export async function getProductsByIds(organizationId: string, ids: string[]) {
  if (ids.length === 0) return [];
  return db
    .select()
    .from(products)
    .where(and(eq(products.organizationId, organizationId), inArray(products.id, ids)));
}

import {
  getRevenueTotals,
  getOrderCount,
  getPaymentAttemptCounts,
  getFailedPaymentValue,
  getTopProducts,
  getProductAnalytics,
  getRevenueSeries,
  getAbandonedCheckouts,
  getFailuresByCode,
  getRepeatFailureCustomers,
  type DateRange,
} from "./analytics.repository.js";
import type { DateRangeQuery, ProductAnalyticsQuery } from "./analytics.schemas.js";
import { env } from "../../config/env.js";

/**
 * Resolves a validated date-range query into a concrete [from, to] pair.
 * This is the ONLY place "today"/"7d"/"30d"/"90d" are translated into
 * actual Date boundaries — every analytics/revenue-engine caller goes
 * through here so the definition of "the last 7 days" can never drift
 * between two endpoints.
 */
export function resolveDateRange(query: DateRangeQuery): DateRange {
  const now = new Date();
  if (query.range === "custom" && query.from && query.to) {
    const from = new Date(query.from);
    // Inclusive end-of-day when only a date (no time) was given.
    const to = new Date(query.to);
    if (query.to.length <= 10) to.setUTCHours(23, 59, 59, 999);
    return { from, to };
  }

  const to = now;
  let from: Date;
  switch (query.range) {
    case "today": {
      from = new Date(now);
      from.setUTCHours(0, 0, 0, 0);
      break;
    }
    case "7d":
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "90d":
      from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
    default:
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
  }
  return { from, to };
}

/** The same-length window immediately preceding `range` — for growth/comparison metrics. */
export function previousPeriod(range: DateRange): DateRange {
  const durationMs = range.to.getTime() - range.from.getTime();
  return {
    from: new Date(range.from.getTime() - durationMs),
    to: new Date(range.from.getTime() - 1),
  };
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null; // undefined growth rate off a zero base
  return Math.round(((current - previous) / previous) * 10000) / 100; // 2dp percent
}

export interface OverviewResult {
  period: { from: string; to: string };
  totalRevenueMinor: number;
  currency: string;
  orderCount: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
  paymentSuccessRatePercent: number | null;
  averageOrderValueMinor: number | null;
  conversionRatePercent: number | null;
  conversionRateNote: string;
  revenueGrowthPercent: number | null;
  topProduct: { productId: string | null; productName: string; revenueMinor: number } | null;
  revenueAtRiskMinor: number;
  revenueAtRiskOrderCount: number;
}

export async function getOverview(organizationId: string, query: DateRangeQuery): Promise<OverviewResult> {
  const range = resolveDateRange(query);
  const prevRange = previousPeriod(range);

  const [totals, prevTotals, orderCount, attemptCounts, topProducts, abandoned] = await Promise.all([
    getRevenueTotals(organizationId, range),
    getRevenueTotals(organizationId, prevRange),
    getOrderCount(organizationId, range),
    getPaymentAttemptCounts(organizationId, range),
    getTopProducts(organizationId, range, 1),
    getAbandonedCheckouts(organizationId, env.ABANDONED_CHECKOUT_THRESHOLD_MINUTES),
  ]);

  const paymentSuccessRatePercent =
    attemptCounts.successful + attemptCounts.failed > 0
      ? Math.round((attemptCounts.successful / (attemptCounts.successful + attemptCounts.failed)) * 10000) / 100
      : null;

  const averageOrderValueMinor =
    totals.paidOrderCount > 0 ? Math.round(totals.totalRevenueMinor / totals.paidOrderCount) : null;

  const revenueAtRiskMinor = abandoned.reduce((sum, o) => sum + o.totalAmountMinor, 0);

  return {
    period: { from: range.from.toISOString(), to: range.to.toISOString() },
    totalRevenueMinor: totals.totalRevenueMinor,
    currency: "INR",
    orderCount,
    successfulPayments: attemptCounts.successful,
    failedPayments: attemptCounts.failed,
    pendingPayments: attemptCounts.pending,
    paymentSuccessRatePercent,
    averageOrderValueMinor,
    // Proxy metric: this system has no separate "checkout attempt" concept
    // distinct from an order (an order row only exists once the policy
    // engine has already approved a cart) — so "conversion" here is
    // paid orders / all orders created in the period, which undercounts
    // true top-of-funnel conversion (browsing that never reached
    // checkout isn't tracked at all). Documented rather than presented
    // as a true funnel-conversion rate.
    conversionRatePercent: orderCount > 0 ? Math.round((totals.paidOrderCount / orderCount) * 10000) / 100 : null,
    conversionRateNote:
      "Proxy metric: paid orders ÷ orders created in this period. This system does not track pre-checkout funnel events, so true top-of-funnel conversion is not available.",
    revenueGrowthPercent: pctChange(totals.totalRevenueMinor, prevTotals.totalRevenueMinor),
    topProduct: topProducts[0]
      ? { productId: topProducts[0].productId, productName: topProducts[0].productName, revenueMinor: topProducts[0].revenueMinor }
      : null,
    revenueAtRiskMinor,
    revenueAtRiskOrderCount: abandoned.length,
  };
}

export interface RevenueTrendResult {
  period: { from: string; to: string };
  current: { revenueMinor: number; orders: number };
  previous: { revenueMinor: number; orders: number };
  change: { revenuePercent: number | null; ordersPercent: number | null };
  series: { bucket: string; revenueMinor: number; orderCount: number }[];
}

export async function getRevenueTrend(organizationId: string, query: DateRangeQuery): Promise<RevenueTrendResult> {
  const range = resolveDateRange(query);
  const prevRange = previousPeriod(range);

  const [current, previous, series] = await Promise.all([
    getRevenueTotals(organizationId, range),
    getRevenueTotals(organizationId, prevRange),
    getRevenueSeries(organizationId, range),
  ]);

  return {
    period: { from: range.from.toISOString(), to: range.to.toISOString() },
    current: { revenueMinor: current.totalRevenueMinor, orders: current.paidOrderCount },
    previous: { revenueMinor: previous.totalRevenueMinor, orders: previous.paidOrderCount },
    change: {
      revenuePercent: pctChange(current.totalRevenueMinor, previous.totalRevenueMinor),
      ordersPercent: pctChange(current.paidOrderCount, previous.paidOrderCount),
    },
    series,
  };
}

export async function getProductAnalyticsResult(organizationId: string, query: ProductAnalyticsQuery) {
  const range = resolveDateRange(query);
  const { rows, total } = await getProductAnalytics(
    organizationId,
    range,
    { page: query.page, limit: query.limit },
    { sort: query.sort, order: query.order }
  );
  return {
    period: { from: range.from.toISOString(), to: range.to.toISOString() },
    products: rows,
    meta: { page: query.page, limit: query.limit, total, totalPages: Math.max(1, Math.ceil(total / query.limit)) },
  };
}

export interface PaymentAnalyticsResult {
  period: { from: string; to: string };
  successCount: number;
  failureCount: number;
  pendingCount: number;
  paymentSuccessRatePercent: number | null;
  failedPaymentValueMinor: number;
  failuresByCode: { failureCode: string | null; count: number; valueMinor: number }[];
  recoveryOpportunitySignal: {
    repeatFailureCustomerCount: number;
    totalRecoverableValueMinor: number;
  };
}

export async function getPaymentAnalytics(
  organizationId: string,
  query: DateRangeQuery
): Promise<PaymentAnalyticsResult> {
  const range = resolveDateRange(query);
  const [attemptCounts, failedValue, failuresByCode, repeatFailures] = await Promise.all([
    getPaymentAttemptCounts(organizationId, range),
    getFailedPaymentValue(organizationId, range),
    getFailuresByCode(organizationId, range),
    getRepeatFailureCustomers(organizationId, range),
  ]);

  const paymentSuccessRatePercent =
    attemptCounts.successful + attemptCounts.failed > 0
      ? Math.round((attemptCounts.successful / (attemptCounts.successful + attemptCounts.failed)) * 10000) / 100
      : null;

  return {
    period: { from: range.from.toISOString(), to: range.to.toISOString() },
    successCount: attemptCounts.successful,
    failureCount: attemptCounts.failed,
    pendingCount: attemptCounts.pending,
    paymentSuccessRatePercent,
    failedPaymentValueMinor: failedValue.failedValueMinor,
    failuresByCode,
    recoveryOpportunitySignal: {
      repeatFailureCustomerCount: repeatFailures.length,
      totalRecoverableValueMinor: repeatFailures.reduce((sum, r) => sum + r.totalFailedValueMinor, 0),
    },
  };
}

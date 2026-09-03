"use client";

import { useApiResource } from "./useApiResource";
import type { UseApiResourceResult } from "./useApiResource";
import {
  getOverview,
  getRevenueTrend,
  getPaymentAnalytics,
  getProductAnalytics,
  listOpportunities,
  getPaymentsHistory,
  listCustomers,
  getProductCatalogCount,
  getAuditLog,
  type DateRange,
  type AnalyticsOverview,
  type RevenueTrend,
  type PaymentAnalytics,
  type ProductAnalyticsResult,
  type OpportunityListResult,
  type PaymentHistoryResult,
  type CustomerListResult,
  type AuditListResult,
} from "@/lib/api/dashboard";

/**
 * One hook per Dashboard Home data need, each a thin wrapper around
 * lib/api/dashboard.ts through useApiResource. Kept separate (rather
 * than one giant "useDashboardHome()") so a single section's loading/
 * error state never blocks the rest of the page — Section 3 can be
 * ready while Section 7 is still loading or has failed.
 */

export function useOverview(range: DateRange): UseApiResourceResult<AnalyticsOverview> {
  return useApiResource(() => getOverview(range), [range]);
}

/** Always "today" — powers the "Orders Today" KPI independent of the
 * page's selected range. */
export function useTodayOverview(): UseApiResourceResult<AnalyticsOverview> {
  return useApiResource(() => getOverview("today"), []);
}

export function useRevenueTrendData(range: DateRange): UseApiResourceResult<RevenueTrend> {
  return useApiResource(() => getRevenueTrend(range), [range]);
}

export function usePaymentAnalyticsData(range: DateRange): UseApiResourceResult<PaymentAnalytics> {
  return useApiResource(() => getPaymentAnalytics(range), [range]);
}

export function useTopProducts(range: DateRange, limit = 6): UseApiResourceResult<ProductAnalyticsResult> {
  return useApiResource(() => getProductAnalytics(range, { limit, sort: "revenue" }), [range, limit]);
}

export function useOpenOpportunities(limit = 6): UseApiResourceResult<OpportunityListResult> {
  return useApiResource(() => listOpportunities({ status: "OPEN", limit, sort: "score" }), [limit]);
}

/** Count-only reads — meta.total is what's used, `rows` is discarded by
 * callers. limit:1 keeps the payload trivial. */
export function useOpportunityCount(status: "OPEN" | "EXECUTED"): UseApiResourceResult<OpportunityListResult> {
  return useApiResource(() => listOpportunities({ status, limit: 1 }), [status]);
}

export function useRecentPayments(limit = 8): UseApiResourceResult<PaymentHistoryResult> {
  return useApiResource(() => getPaymentsHistory({ limit }), [limit]);
}

export function useCustomersSummary(limit = 8): UseApiResourceResult<CustomerListResult> {
  return useApiResource(() => listCustomers({ limit }), [limit]);
}

export function useActiveProductCount(): UseApiResourceResult<number> {
  return useApiResource(() => getProductCatalogCount(true), []);
}

export function useCustomerCount(): UseApiResourceResult<number> {
  return useApiResource(
    () => listCustomers({ limit: 1 }).then((r) => r.meta.total),
    []
  );
}

export function useAuditTimeline(limit = 8): UseApiResourceResult<AuditListResult> {
  return useApiResource(() => getAuditLog({ limit }), [limit]);
}

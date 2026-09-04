"use client";

import { useApiResource } from "./useApiResource";
import type { UseApiResourceResult } from "./useApiResource";
import {
  getProductAnalytics,
  type DateRange,
  type ProductAnalyticsResult,
} from "@/lib/api/dashboard";

/**
 * Analytics page (/analytics) data hooks.
 *
 * Deliberately NOT redefining useOverview / useRevenueTrendData /
 * usePaymentAnalyticsData / useOpenOpportunities here — those already
 * exist in useDashboardHome.ts, hit the exact same backend endpoints
 * this page needs (GET /analytics/overview, /analytics/revenue,
 * /analytics/payments, /revenue/opportunities), and AnalyticsView.tsx
 * imports them directly from there. Duplicating them here would be a
 * second frontend implementation of the same data need — see this
 * project's "no client-side business logic duplication" convention
 * (ProductsView/PaymentsView reuse hooks the same way).
 *
 * The one genuinely new need for this page: a PAGINATED, sortable
 * product-analytics table (Dashboard Home's useTopProducts is
 * intentionally capped at a small `limit` with no `page` control, for
 * the compact "Top products" card grid — this page needs the full,
 * paged table per Phase 9 of the brief).
 */
export interface ProductAnalyticsFilters {
  range: DateRange;
  page: number;
  limit: number;
  sort: "revenue" | "unitsSold" | "orderCount";
}

export function useProductAnalyticsList(
  filters: ProductAnalyticsFilters
): UseApiResourceResult<ProductAnalyticsResult> {
  return useApiResource(
    () => getProductAnalytics(filters.range, { page: filters.page, limit: filters.limit, sort: filters.sort }),
    [filters.range, filters.page, filters.limit, filters.sort]
  );
}

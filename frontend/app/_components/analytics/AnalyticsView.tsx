"use client";

import { useState } from "react";
import { useSession } from "@/hooks/useSession";
import { useOverview, useRevenueTrendData, usePaymentAnalyticsData, useOpenOpportunities } from "@/hooks/useDashboardHome";
import { useProductAnalyticsList, type ProductAnalyticsFilters } from "@/hooks/useAnalytics";
import { roleHasPermission } from "@/lib/permissions";
import type { DateRange } from "@/lib/api/dashboard";
import { AnalyticsHero } from "./AnalyticsHero";
import { AnalyticsKpiCards } from "./AnalyticsKpiCards";
import { TopProductsTable, type ProductSort } from "./TopProductsTable";
import { PaymentFailureAnalysis } from "./PaymentFailureAnalysis";
import { RiskSignals } from "./RiskSignals";
import { RevenueChart } from "../dashboard/home/RevenueChart";
import { OpportunitiesPanel } from "../dashboard/home/OpportunitiesPanel";
import { PaymentsSummaryCards } from "../payments/PaymentsSummaryCards";

const PRODUCTS_PAGE_SIZE = 8;

/**
 * Analytics (/analytics) — assembled entirely from real GET
 * /analytics/overview, /analytics/revenue, /analytics/products,
 * /analytics/payments, and /revenue/opportunities responses (see
 * lib/api/dashboard.ts). Gated on `analytics.read`, the exact
 * permission every one of those routes enforces server-side
 * (requirePermission("analytics.read") in
 * backend/src/modules/analytics/analytics.routes.ts) — same
 * fail-closed pattern as ProductsView/PaymentsView/CustomersView.
 *
 * One shared `range` drives every date-scoped section (overview,
 * revenue trend, payment analytics, product analytics) so "30D" means
 * the same window everywhere on this page at once, per Phase 15 of the
 * brief. The product-analytics table has its own page/sort state since
 * pagination and sort are independent of the date range.
 *
 * Sections reuse existing, already-correct components rather than
 * re-implementing the same calculations a second time (Phase 32):
 * RevenueChart and OpportunitiesPanel are the exact components
 * Dashboard Home uses for the same two endpoints; PaymentsSummaryCards
 * is the exact component the Payments page uses for
 * GET /analytics/payments's KPI cards.
 */
export function AnalyticsView() {
  const { session } = useSession();
  const canRead = roleHasPermission(session?.role, "analytics.read");

  const [range, setRange] = useState<DateRange>("30d");
  const [productPage, setProductPage] = useState(1);
  const [productSort, setProductSort] = useState<ProductSort>("revenue");

  const overview = useOverview(range);
  const revenueTrend = useRevenueTrendData(range);
  const paymentAnalytics = usePaymentAnalyticsData(range);
  const openOpportunities = useOpenOpportunities();

  const productFilters: ProductAnalyticsFilters = {
    range,
    page: productPage,
    limit: PRODUCTS_PAGE_SIZE,
    sort: productSort,
  };
  const productAnalytics = useProductAnalyticsList(productFilters);

  const currency = overview.data?.currency ?? "INR";

  function handleRangeChange(next: DateRange) {
    setRange(next);
    setProductPage(1);
  }

  function handleSortChange(next: ProductSort) {
    setProductSort(next);
    setProductPage(1);
  }

  function refetchAll() {
    overview.refetch();
    revenueTrend.refetch();
    paymentAnalytics.refetch();
    openOpportunities.refetch();
    productAnalytics.refetch();
  }

  const isRefreshing =
    overview.isLoading || revenueTrend.isLoading || paymentAnalytics.isLoading || productAnalytics.isLoading;

  // Placed after every hook above so hooks still run unconditionally on
  // every render — only the returned JSX branches, same pattern as
  // ProductsView/PaymentsView/CustomersView's canRead guard.
  if (session && !canRead) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
        <p className="text-sm font-medium text-zinc-200">You don&apos;t have access to Analytics</p>
        <p className="max-w-xs text-xs text-zinc-500">
          Ask an organization admin to grant you the analytics.read permission.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <AnalyticsHero
        organizationName={session?.organization.name ?? "your workspace"}
        range={range}
        onRangeChange={handleRangeChange}
        onRefresh={refetchAll}
        isRefreshing={isRefreshing}
      />

      <AnalyticsKpiCards overview={overview} />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <RevenueChart trend={revenueTrend} currency={currency} />
        <OpportunitiesPanel opportunities={openOpportunities} role={session?.role} currencyFallback={currency} />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-zinc-400">Payment performance</h2>
        <PaymentsSummaryCards result={paymentAnalytics} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PaymentFailureAnalysis result={paymentAnalytics} currency={currency} />
        <TopProductsTable
          result={productAnalytics}
          currency={currency}
          page={productPage}
          onPageChange={setProductPage}
          sort={productSort}
          onSortChange={handleSortChange}
        />
      </div>

      <RiskSignals overview={overview} paymentAnalytics={paymentAnalytics} currency={currency} />
    </div>
  );
}

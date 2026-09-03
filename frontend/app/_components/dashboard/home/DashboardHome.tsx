"use client";

import { useState } from "react";
import type { DateRange } from "@/lib/api/dashboard";
import { useSession } from "@/hooks/useSession";
import {
  useOverview,
  useRevenueTrendData,
  usePaymentAnalyticsData,
  useTopProducts,
  useOpenOpportunities,
  useRecentPayments,
  useActiveProductCount,
  useCustomerCount,
  useAuditTimeline,
} from "@/hooks/useDashboardHome";
import { DashboardHero } from "./DashboardHero";
import { DateRangeTabs } from "./DateRangeTabs";
import { KpiGrid } from "./KpiGrid";
import { RevenueChart } from "./RevenueChart";
import { OpportunitiesPanel } from "./OpportunitiesPanel";
import { RecentActivity } from "./RecentActivity";
import { TopProductsGrid } from "./TopProductsGrid";
import { AuditTimeline } from "./AuditTimeline";

/**
 * Dashboard Home — the screen after login. Assembles every widget from
 * real GET endpoints via the hooks in useDashboardHome.ts; this
 * component owns only the shared `range` state (Step 5-7 of the brief
 * all read the same range) and passes each hook's result down to its
 * section, which owns its own loading/error/empty rendering.
 */
export function DashboardHome() {
  const { session } = useSession();
  const [range, setRange] = useState<DateRange>("30d");

  const overview = useOverview(range);
  const revenueTrend = useRevenueTrendData(range);
  const paymentAnalytics = usePaymentAnalyticsData(range);
  const topProducts = useTopProducts(range);
  const openOpportunities = useOpenOpportunities();
  const recentPayments = useRecentPayments();
  const activeProductCount = useActiveProductCount();
  const customerCount = useCustomerCount();
  const auditTimeline = useAuditTimeline();

  const currency = overview.data?.currency ?? "INR";

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <DashboardHero
        firstName={session?.user.firstName ?? ""}
        organizationName={session?.organization.name ?? "your workspace"}
        overview={overview.data}
        overviewLoading={overview.isLoading}
        paymentAnalytics={paymentAnalytics.data}
        openOpportunities={openOpportunities.data}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-zinc-400">Business overview</h2>
        <DateRangeTabs value={range} onChange={setRange} />
      </div>

      <KpiGrid
        overview={overview}
        activeProductCount={activeProductCount}
        customerCount={customerCount}
        openOpportunityCount={openOpportunities}
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <RevenueChart trend={revenueTrend} currency={currency} />
        <OpportunitiesPanel opportunities={openOpportunities} role={session?.role} currencyFallback={currency} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentActivity payments={recentPayments} />
        <TopProductsGrid products={topProducts} currency={currency} />
      </div>

      <AuditTimeline audit={auditTimeline} />
    </div>
  );
}

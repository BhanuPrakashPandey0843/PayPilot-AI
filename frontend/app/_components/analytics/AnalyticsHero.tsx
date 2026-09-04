"use client";

import { BarChart3, RefreshCw } from "lucide-react";
import type { DateRange } from "@/lib/api/dashboard";
import { DateRangeTabs } from "../dashboard/home/DateRangeTabs";

interface AnalyticsHeroProps {
  organizationName: string;
  range: DateRange;
  onRangeChange: (range: DateRange) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

/**
 * Analytics hero — same glass-panel + grid + glow-blob visual language
 * as PaymentsHero / RevenueHero / OrdersHero (Phase 3 of the brief:
 * "use the existing PayPilot AI page-header design, do not create a
 * separate visual language").
 *
 * The date-range control lives directly in the header (Phase 4) and is
 * the exact same DateRangeTabs component Dashboard Home already uses —
 * today / 7d / 30d / 90d, because those are the only four range values
 * GET /analytics/* actually accepts as presets
 * (backend/src/modules/analytics/analytics.schemas.ts's
 * dateRangeQuerySchema). The backend also accepts range=custom&from&to,
 * but no page in this app has a custom date-range picker UI yet — per
 * the brief's "follow the existing architecture" instruction, this page
 * reuses the established control rather than introducing a new pattern
 * that would exist nowhere else in the product. Custom ranges are a
 * real, documented backend capability this page just doesn't expose a
 * control for yet.
 */
export function AnalyticsHero({ organizationName, range, onRangeChange, onRefresh, isRefreshing }: AnalyticsHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-[var(--border-subtle)] p-6 sm:p-10">
      <div className="glass-panel absolute inset-0 -z-20" />
      <div className="bg-grid absolute inset-0 -z-10 opacity-60" />
      <div
        className="glow-blob animate-mesh-drift absolute -right-20 -top-20 -z-10 h-72 w-72 rounded-full"
        style={{ background: "var(--accent-cyan)" }}
      />
      <div
        className="glow-blob animate-mesh-drift absolute -bottom-28 left-1/4 -z-10 h-64 w-64 rounded-full"
        style={{ background: "var(--accent-blue)", animationDelay: "-6s" }}
      />

      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-white/[0.03] px-3 py-1 text-xs font-medium text-[var(--accent-cyan)]">
            <BarChart3 className="h-3 w-3" /> Insights
          </p>
          <h1 className="mt-4 text-2xl font-semibold text-white sm:text-3xl">Analytics</h1>
          <p className="mt-2 max-w-lg text-sm text-zinc-400">
            Understand <span className="text-zinc-200">{organizationName}</span>&apos;s store performance,
            revenue trends, and payment activity.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-2xl border border-[var(--border-subtle)] bg-white/[0.03] px-5 py-3 text-sm font-medium text-zinc-200 transition-colors hover:border-[var(--border-strong)] hover:text-white disabled:opacity-40 sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 sm:mt-8">
        <span id="analytics-range-label" className="text-xs font-medium text-zinc-500">
          Date range
        </span>
        <div role="group" aria-labelledby="analytics-range-label">
          <DateRangeTabs value={range} onChange={onRangeChange} />
        </div>
      </div>
    </section>
  );
}

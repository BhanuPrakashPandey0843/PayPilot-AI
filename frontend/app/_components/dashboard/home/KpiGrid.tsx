"use client";

import type { ComponentType } from "react";
import {
  Wallet,
  ShoppingCart,
  Receipt,
  CheckCircle2,
  Percent,
  Package,
  Users,
  Sparkles,
} from "lucide-react";
import type { UseApiResourceResult } from "@/hooks/useApiResource";
import type { AnalyticsOverview } from "@/lib/api/dashboard";
import { formatMoney, formatNumber, formatPercent } from "./formatters";
import { KpiCardSkeleton, ErrorNote } from "./Skeletons";

interface KpiGridProps {
  overview: UseApiResourceResult<AnalyticsOverview>;
  activeProductCount: UseApiResourceResult<number>;
  customerCount: UseApiResourceResult<number>;
  openOpportunityCount: UseApiResourceResult<{ meta: { total: number } }>;
}

interface KpiDef {
  label: string;
  icon: ComponentType<{ className?: string }>;
  value: string | null;
  trend?: string | null;
  trendPositive?: boolean;
  accent: string;
}

/** Step 5 — the 8 headline KPI cards, each sourced from a real
 * useDashboardHome.ts hook. No sparkline data exists per-KPI in the
 * backend response, so cards show value + trend chip rather than an
 * invented mini-chart. */
export function KpiGrid({ overview, activeProductCount, customerCount, openOpportunityCount }: KpiGridProps) {
  const o = overview.data;

  const cards: KpiDef[] = [
    {
      label: "Revenue",
      icon: Wallet,
      value: o ? formatMoney(o.totalRevenueMinor, o.currency) : null,
      trend: o?.revenueGrowthPercent !== undefined ? formatPercent(o?.revenueGrowthPercent ?? null, { signed: true }) : null,
      trendPositive: (o?.revenueGrowthPercent ?? 0) >= 0,
      accent: "var(--accent-cyan)",
    },
    {
      label: "Orders",
      icon: ShoppingCart,
      value: o ? formatNumber(o.orderCount) : null,
      accent: "var(--accent-blue)",
    },
    {
      label: "Avg. Order Value",
      icon: Receipt,
      value: o ? formatMoney(o.averageOrderValueMinor, o.currency) : null,
      accent: "var(--accent-gold)",
    },
    {
      label: "Payment Success",
      icon: CheckCircle2,
      value: o ? formatPercent(o.paymentSuccessRatePercent) : null,
      accent: "var(--accent-emerald)",
    },
    {
      label: "Conversion Rate",
      icon: Percent,
      value: o ? formatPercent(o.conversionRatePercent) : null,
      accent: "var(--accent-violet)",
    },
    {
      label: "Active Products",
      icon: Package,
      value: activeProductCount.data !== null ? formatNumber(activeProductCount.data) : null,
      accent: "var(--accent-amber)",
    },
    {
      label: "Customers",
      icon: Users,
      value: customerCount.data !== null ? formatNumber(customerCount.data) : null,
      accent: "var(--accent-rose)",
    },
    {
      label: "AI Opportunities",
      icon: Sparkles,
      value: openOpportunityCount.data ? formatNumber(openOpportunityCount.data.meta.total) : null,
      accent: "var(--accent-cyan)",
    },
  ];

  if (overview.error) {
    return <ErrorNote message={overview.error} onRetry={overview.refetch} />;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) =>
        card.value === null ? (
          <KpiCardSkeleton key={card.label} />
        ) : (
          <div
            key={card.label}
            className="group relative overflow-hidden rounded-3xl border border-[var(--border-subtle)] bg-white/[0.02] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:bg-white/[0.04]"
          >
            <div
              className="absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-25"
              style={{ background: card.accent }}
            />
            <div className="flex items-center justify-between">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-xl"
                style={{ background: `color-mix(in srgb, ${card.accent} 16%, transparent)` }}
              >
                <card.icon className="h-4 w-4" style={{ color: card.accent }} />
              </span>
              {card.trend && (
                <span
                  className={`text-[11px] font-medium ${
                    card.trendPositive ? "text-[var(--accent-emerald)]" : "text-[var(--accent-rose)]"
                  }`}
                >
                  {card.trend}
                </span>
              )}
            </div>
            <p className="mt-3 text-xl font-semibold text-white">{card.value}</p>
            <p className="text-xs text-zinc-500">{card.label}</p>
          </div>
        )
      )}
    </div>
  );
}

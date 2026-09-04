"use client";

import type { ComponentType } from "react";
import { Wallet, ShoppingCart, CheckCircle2, Repeat, Percent, Receipt, Info, TrendingUp, TrendingDown } from "lucide-react";
import type { UseApiResourceResult } from "@/hooks/useApiResource";
import type { AnalyticsOverview } from "@/lib/api/dashboard";
import { formatMoney, formatNumber, formatPercent } from "../dashboard/home/formatters";
import { KpiCardSkeleton, ErrorNote } from "../dashboard/home/Skeletons";

interface AnalyticsKpiCardsProps {
  overview: UseApiResourceResult<AnalyticsOverview>;
}

interface KpiDef {
  key: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  value: string;
  accent: string;
  note?: string;
  trend?: { text: string; positive: boolean } | null;
}

/**
 * Analytics KPI row. Every value is a field straight off
 * GET /analytics/overview (backend/src/modules/analytics/
 * analytics.service.ts's getOverview) — no client-side recomputation of
 * revenue, orders, or rates.
 *
 * "Orders" vs "Successful payments" vs "Payment attempts" are kept as
 * three distinct cards (Phase 5's explicit "do not confuse these"
 * rule): orderCount is every order row created in the period regardless
 * of outcome; successfulPayments is captured/authorized attempts;
 * payment attempts (the "Payment activity" card) is
 * successful+failed+pending, i.e. every attempt regardless of outcome —
 * these three numbers can and do differ, and no card here computes one
 * from another beyond that documented sum.
 *
 * Conversion Rate carries the backend's own `conversionRateNote` as a
 * visible, accessible caption (not just a tooltip) — the backend
 * explicitly labels this a proxy (paid orders / orders created, since
 * there is no pre-checkout funnel tracking), and Phase 5 of the brief
 * requires that meaning be preserved in the UI rather than presented as
 * a true visitor-based conversion rate.
 */
export function AnalyticsKpiCards({ overview }: AnalyticsKpiCardsProps) {
  const o = overview.data;

  if (overview.error && !o) {
    return <ErrorNote message={overview.error} onRetry={overview.refetch} />;
  }

  if (overview.isLoading || !o) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const totalAttempts = o.successfulPayments + o.failedPayments + o.pendingPayments;
  const growthPositive = (o.revenueGrowthPercent ?? 0) >= 0;

  const cards: KpiDef[] = [
    {
      key: "revenue",
      label: "Total revenue",
      icon: Wallet,
      value: formatMoney(o.totalRevenueMinor, o.currency),
      accent: "var(--accent-cyan)",
      trend:
        o.revenueGrowthPercent === null
          ? null
          : { text: `${formatPercent(o.revenueGrowthPercent, { signed: true })} vs previous period`, positive: growthPositive },
    },
    {
      key: "orders",
      label: "Orders",
      icon: ShoppingCart,
      value: formatNumber(o.orderCount),
      accent: "var(--accent-blue)",
      note: "Every order created in this period, regardless of outcome.",
    },
    {
      key: "successful-payments",
      label: "Successful payments",
      icon: CheckCircle2,
      value: formatNumber(o.successfulPayments),
      accent: "var(--accent-emerald)",
      note: "Captured or authorized payment attempts.",
    },
    {
      key: "payment-attempts",
      label: "Payment attempts",
      icon: Repeat,
      value: formatNumber(totalAttempts),
      accent: "var(--accent-gold)",
      note: `${formatNumber(o.successfulPayments)} successful · ${formatNumber(o.failedPayments)} failed · ${formatNumber(o.pendingPayments)} pending`,
    },
    {
      key: "success-rate",
      label: "Payment success rate",
      icon: Percent,
      value: formatPercent(o.paymentSuccessRatePercent),
      accent: "var(--accent-emerald)",
      note: o.paymentSuccessRatePercent === null ? "No completed payment attempts in this period yet." : undefined,
    },
    {
      key: "aov",
      label: "Avg. order value",
      icon: Receipt,
      value: formatMoney(o.averageOrderValueMinor, o.currency),
      accent: "var(--accent-amber)",
      note: o.averageOrderValueMinor === null ? "No paid orders in this period yet." : undefined,
    },
    {
      key: "conversion",
      label: "Conversion rate",
      icon: Percent,
      value: formatPercent(o.conversionRatePercent),
      accent: "var(--accent-violet)",
      note: o.conversionRateNote,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.key}
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
                className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                  card.trend.positive ? "text-[var(--accent-emerald)]" : "text-[var(--accent-rose)]"
                }`}
              >
                {card.trend.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              </span>
            )}
          </div>
          <p className="mt-3 text-xl font-semibold text-white">{card.value}</p>
          <p className="flex items-center gap-1 text-xs text-zinc-500">
            {card.label}
            {card.note && <Info className="h-3 w-3 shrink-0 text-zinc-600" aria-hidden="true" />}
          </p>
          {card.trend && <p className="mt-1 text-[11px] text-zinc-500">{card.trend.text}</p>}
          {card.note && <p className="mt-1.5 text-[11px] leading-snug text-zinc-600">{card.note}</p>}
        </div>
      ))}
    </div>
  );
}

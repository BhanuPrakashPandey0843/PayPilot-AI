"use client";

import Link from "next/link";
import { Sparkles, TrendingUp, TrendingDown, ArrowUpRight, ShieldAlert } from "lucide-react";
import type { AnalyticsOverview, PaymentAnalytics, OpportunityListResult } from "@/lib/api/dashboard";
import { formatMoney, formatMoneyCompact, formatPercent, formatNumber } from "./formatters";
import { SkeletonBlock } from "./Skeletons";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

interface DashboardHeroProps {
  firstName: string;
  organizationName: string;
  overview: AnalyticsOverview | null;
  overviewLoading: boolean;
  paymentAnalytics: PaymentAnalytics | null;
  openOpportunities: OpportunityListResult | null;
}

/**
 * Step 4 of the brief — the first thing anyone sees after login. Every
 * number here comes from GET /analytics/overview, /analytics/payments,
 * and /revenue/opportunities?status=OPEN (via the hooks in
 * useDashboardHome.ts) — nothing is invented, so on a fresh/empty
 * organization this correctly reads "₹0" / "0 opportunities" rather
 * than fabricated demo numbers.
 */
export function DashboardHero({
  firstName,
  organizationName,
  overview,
  overviewLoading,
  paymentAnalytics,
  openOpportunities,
}: DashboardHeroProps) {
  const growth = overview?.revenueGrowthPercent ?? null;
  const isPositiveGrowth = (growth ?? 0) >= 0;
  const recoverable = paymentAnalytics?.recoveryOpportunitySignal.totalRecoverableValueMinor ?? null;
  const openCount = openOpportunities?.meta.total ?? null;

  const briefItems = [
    {
      icon: TrendingUp,
      label: "Open opportunities",
      value: openCount === null ? null : formatNumber(openCount),
      accent: "text-[var(--accent-violet)]",
    },
    {
      icon: ShieldAlert,
      label: "Revenue at risk",
      value: overview ? formatMoneyCompact(overview.revenueAtRiskMinor, overview.currency) : null,
      accent: "text-[var(--accent-amber)]",
    },
    {
      icon: Sparkles,
      label: "Recoverable revenue",
      value: recoverable === null ? null : formatMoneyCompact(recoverable, overview?.currency ?? "INR"),
      accent: "text-[var(--accent-cyan)]",
    },
  ];

  return (
    <section className="relative overflow-hidden rounded-3xl border border-[var(--border-subtle)] p-6 sm:p-10">
      {/* Background: glass + glow, matching the site's shared depth system */}
      <div className="glass-panel absolute inset-0 -z-20" />
      <div className="bg-grid absolute inset-0 -z-10 opacity-60" />
      <div
        className="glow-blob animate-mesh-drift absolute -right-24 -top-24 -z-10 h-80 w-80 rounded-full"
        style={{ background: "var(--accent-violet)" }}
      />
      <div
        className="glow-blob animate-mesh-drift absolute -bottom-32 left-1/3 -z-10 h-72 w-72 rounded-full"
        style={{ background: "var(--accent-gold)", animationDelay: "-6s" }}
      />

      <div className="max-w-2xl">
        {/* Greeting + AI brief */}
        <div>
          <p className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-white/[0.03] px-3 py-1 text-xs font-medium text-[var(--accent-cyan)]">
            <Sparkles className="h-3 w-3" /> AI Daily Brief
          </p>
          <h1 className="mt-4 text-2xl font-semibold text-white sm:text-3xl">
            {greeting()}, {firstName || "there"} <span aria-hidden>👋</span>
          </h1>
          <p className="mt-2 max-w-lg text-sm text-zinc-400">
            AI analyzed <span className="text-zinc-200">{organizationName}</span>&apos;s commerce workspace.
            Here&apos;s what changed and what&apos;s worth your attention.
          </p>

          <div className="mt-6 flex flex-wrap items-end gap-x-8 gap-y-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Revenue this period</p>
              {overviewLoading || !overview ? (
                <SkeletonBlock className="mt-1 h-8 w-32" />
              ) : (
                <p className="mt-1 text-3xl font-semibold text-white">
                  {formatMoney(overview.totalRevenueMinor, overview.currency)}
                </p>
              )}
            </div>
            {!overviewLoading && growth !== null && (
              <span
                className={`mb-1 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                  isPositiveGrowth
                    ? "bg-[var(--accent-emerald)]/10 text-[var(--accent-emerald)]"
                    : "bg-[var(--accent-rose)]/10 text-[var(--accent-rose)]"
                }`}
              >
                {isPositiveGrowth ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {formatPercent(growth, { signed: true })} vs previous period
              </span>
            )}
          </div>

          <div className="mt-7 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {briefItems.map(({ icon: Icon, label, value, accent }) => (
              <div
                key={label}
                className="glass-panel rounded-2xl p-3.5 transition-colors hover:border-[var(--border-strong)]"
              >
                <Icon className={`h-4 w-4 ${accent}`} />
                {value === null ? (
                  <SkeletonBlock className="mt-2 h-5 w-16" />
                ) : (
                  <p className="mt-1.5 text-lg font-semibold text-white">{value}</p>
                )}
                <p className="text-[11px] text-zinc-500">{label}</p>
              </div>
            ))}
          </div>

          <Link
            href="/revenue-opportunities"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent-cyan)] hover:text-white"
          >
            Review revenue opportunities <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

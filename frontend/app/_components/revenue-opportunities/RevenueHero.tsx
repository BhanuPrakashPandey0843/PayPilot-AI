"use client";

import { TrendingUp, Sparkles } from "lucide-react";
import type { UseApiResourceResult } from "@/hooks/useApiResource";
import type { AnalyticsOverview } from "@/lib/api/dashboard";
import { formatMoney } from "../dashboard/home/formatters";
import { SkeletonBlock } from "../dashboard/home/Skeletons";

interface RevenueHeroProps {
  organizationName: string;
  overview: UseApiResourceResult<AnalyticsOverview>;
}

/**
 * Revenue Opportunities hero. The one number in the header — revenue at
 * risk — is real (GET /analytics/overview's revenueAtRiskMinor, the
 * same figure Dashboard Home uses), not a decorative estimate. Matches
 * the visual language of AuditHero / RolesHero (glass panel + grid +
 * drifting glow blobs) so the page reads as part of the same product.
 */
export function RevenueHero({ organizationName, overview }: RevenueHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-[var(--border-subtle)] p-6 sm:p-10">
      <div className="glass-panel absolute inset-0 -z-20" />
      <div className="bg-grid absolute inset-0 -z-10 opacity-60" />
      <div
        className="glow-blob animate-mesh-drift absolute -right-20 -top-20 -z-10 h-72 w-72 rounded-full"
        style={{ background: "var(--accent-violet)" }}
      />
      <div
        className="glow-blob animate-mesh-drift absolute -bottom-28 left-1/4 -z-10 h-64 w-64 rounded-full"
        style={{ background: "var(--accent-emerald)", animationDelay: "-6s" }}
      />

      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-white/[0.03] px-3 py-1 text-xs font-medium text-[var(--accent-violet)]">
            <Sparkles className="h-3 w-3" /> Revenue Intelligence
          </p>
          <h1 className="mt-4 text-2xl font-semibold text-white sm:text-3xl">Revenue Opportunities</h1>
          <p className="mt-2 max-w-lg text-sm text-zinc-400">
            PayPilot continuously analyzes <span className="text-zinc-200">{organizationName}</span>&apos;s orders
            and payments to surface actionable opportunities to recover or grow revenue — each one scored,
            explained, and ready for your review.
          </p>
        </div>

        <div className="glass-panel flex shrink-0 items-center gap-3 self-start rounded-2xl px-5 py-4 sm:self-auto">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-rose)]/15">
            <TrendingUp className="h-4 w-4 text-[var(--accent-rose)]" />
          </span>
          <div>
            {overview.isLoading || overview.data === null ? (
              <SkeletonBlock className="h-6 w-24" />
            ) : (
              <p className="text-xl font-semibold text-white">
                {formatMoney(overview.data.revenueAtRiskMinor, overview.data.currency)}
              </p>
            )}
            <p className="text-[11px] text-zinc-500">Revenue at risk (30d)</p>
          </div>
        </div>
      </div>
    </section>
  );
}

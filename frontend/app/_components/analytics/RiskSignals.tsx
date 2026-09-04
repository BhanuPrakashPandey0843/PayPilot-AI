"use client";

import Link from "next/link";
import { ShoppingBag, RotateCcw, ArrowUpRight } from "lucide-react";
import type { UseApiResourceResult } from "@/hooks/useApiResource";
import type { AnalyticsOverview, PaymentAnalytics } from "@/lib/api/dashboard";
import { formatMoney, formatNumber } from "../dashboard/home/formatters";
import { SkeletonBlock } from "../dashboard/home/Skeletons";

interface RiskSignalsProps {
  overview: UseApiResourceResult<AnalyticsOverview>;
  paymentAnalytics: UseApiResourceResult<PaymentAnalytics>;
  currency: string;
}

/**
 * Two honest, aggregate-only risk signals — deliberately NOT lists of
 * individual orders or customers, because the analytics API doesn't
 * expose either as a list:
 *
 *  - Abandoned checkout signals: GET /analytics/overview's
 *    revenueAtRiskMinor / revenueAtRiskOrderCount (backend/src/modules/
 *    analytics/analytics.service.ts's getOverview, sourced from
 *    getAbandonedCheckouts — orders still `pending` and older than
 *    ABANDONED_CHECKOUT_THRESHOLD_MINUTES). This is a payment/order
 *    STATE condition, not a measurement of customer intent — see the
 *    "signals" wording and caption below, matching Phase 13's
 *    instruction not to claim certainty about why an order stalled.
 *    There is no dedicated list endpoint for the individual orders
 *    behind this number, so none is fabricated here.
 *
 *  - Repeat payment failures: GET /analytics/payments's
 *    recoveryOpportunitySignal (repeatFailureCustomerCount,
 *    totalRecoverableValueMinor) — an aggregate count/value only. The
 *    backend has no endpoint that lists WHICH customers these are
 *    (getRepeatFailureCustomers in analytics.repository.ts is used
 *    internally to compute this signal and to seed PAYMENT_RECOVERY
 *    revenue opportunities, but is never returned as rows over the
 *    API), so per Phase 12's "display only the data the backend
 *    provides" this shows the real count and value and nothing more —
 *    individual, actionable cases are what the Revenue Opportunities
 *    page's PAYMENT_RECOVERY cards are for, hence the link below.
 */
export function RiskSignals({ overview, paymentAnalytics, currency }: RiskSignalsProps) {
  const o = overview.data;
  const p = paymentAnalytics.data;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-3xl border border-[var(--border-subtle)] bg-white/[0.02] p-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-amber)]/12">
            <ShoppingBag className="h-4 w-4 text-[var(--accent-amber)]" />
          </span>
          <div>
            <p className="text-sm font-medium text-white">Abandoned checkout signals</p>
            <p className="text-xs text-zinc-500">Orders stuck pending long enough to look stalled.</p>
          </div>
        </div>

        {overview.isLoading || !o ? (
          <SkeletonBlock className="mt-4 h-12 w-40" />
        ) : (
          <div className="mt-4 flex items-baseline gap-2">
            <p className="text-2xl font-semibold text-white">{formatMoney(o.revenueAtRiskMinor, o.currency)}</p>
            <p className="text-xs text-zinc-500">
              across {formatNumber(o.revenueAtRiskOrderCount)} order{o.revenueAtRiskOrderCount === 1 ? "" : "s"}
            </p>
          </div>
        )}
        <p className="mt-3 text-[11px] leading-snug text-zinc-600">
          Based on order state (still pending past a stale-checkout threshold), not confirmed customer intent —
          PayPilot doesn&apos;t track cart or browsing sessions, so this can&apos;t claim someone deliberately
          abandoned checkout.
        </p>
      </div>

      <div className="rounded-3xl border border-[var(--border-subtle)] bg-white/[0.02] p-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-rose)]/12">
            <RotateCcw className="h-4 w-4 text-[var(--accent-rose)]" />
          </span>
          <div>
            <p className="text-sm font-medium text-white">Repeat payment failures</p>
            <p className="text-xs text-zinc-500">Customers with 2+ failed attempts in this period.</p>
          </div>
        </div>

        {paymentAnalytics.isLoading || !p ? (
          <SkeletonBlock className="mt-4 h-12 w-40" />
        ) : (
          <div className="mt-4 flex items-baseline gap-2">
            <p className="text-2xl font-semibold text-white">
              {formatNumber(p.recoveryOpportunitySignal.repeatFailureCustomerCount)}
            </p>
            <p className="text-xs text-zinc-500">
              customer{p.recoveryOpportunitySignal.repeatFailureCustomerCount === 1 ? "" : "s"} ·{" "}
              {formatMoney(p.recoveryOpportunitySignal.totalRecoverableValueMinor, currency)} recoverable
            </p>
          </div>
        )}
        <p className="mt-3 text-[11px] leading-snug text-zinc-600">
          Aggregate signal only — individual customers aren&apos;t listed here since this endpoint doesn&apos;t
          expose them. Actionable cases surface as{" "}
          <Link href="/revenue-opportunities" className="text-zinc-400 underline underline-offset-2 hover:text-white">
            Payment Recovery opportunities <ArrowUpRight className="inline h-3 w-3" />
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

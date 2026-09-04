"use client";

import {
  CheckCircle2,
  Clock,
  IndianRupee,
  TrendingUp,
  XCircle,
  CreditCard,
} from "lucide-react";
import type { UseApiResourceResult } from "@/hooks/useApiResource";
import type { PaymentAnalytics } from "@/lib/api/payments";
import { formatMoney, formatNumber, formatPercent } from "../dashboard/home/formatters";
import { ErrorNote, KpiCardSkeleton } from "../dashboard/home/Skeletons";

interface PaymentsSummaryCardsProps {
  result: UseApiResourceResult<PaymentAnalytics>;
}

/**
 * Real numbers only — every figure here is a field on the
 * GET /analytics/payments response (backend/src/modules/analytics/
 * analytics.repository.ts's real aggregate queries):
 *
 *  - successCount (captured payments)
 *  - failureCount (failed attempt transitions)
 *  - pendingCount (attempts still in created/pending/authorized)
 *  - paymentSuccessRatePercent — already a percentage computed server-
 *    side over the full period, never a client division of a page subset
 *  - failedPaymentValueMinor — sum of failed attempt amounts, minor units
 *
 * Total payments = successCount + failureCount + pendingCount is a safe
 * arithmetic identity here (the three buckets partition the backend's
 * count set). No client-side SUM over the paginated history rows is ever
 * used for a KPI card.
 */
export function PaymentsSummaryCards({ result }: PaymentsSummaryCardsProps) {
  const a = result.data;

  if (result.error && !a) {
    return <ErrorNote message={result.error} onRetry={result.refetch} />;
  }

  const totalPayments = a ? a.successCount + a.failureCount + a.pendingCount : null;

  const cards = [
    {
      label: "Total payments",
      icon: CreditCard,
      color: "var(--accent-cyan)",
      value: totalPayments !== null ? formatNumber(totalPayments) : null,
    },
    {
      label: "Successful",
      icon: CheckCircle2,
      color: "var(--accent-emerald)",
      value: a ? formatNumber(a.successCount) : null,
    },
    {
      label: "Failed",
      icon: XCircle,
      color: "var(--accent-rose)",
      value: a ? formatNumber(a.failureCount) : null,
    },
    {
      label: "Pending",
      icon: Clock,
      color: "var(--accent-amber)",
      value: a ? formatNumber(a.pendingCount) : null,
    },
    {
      label: "Success rate",
      icon: TrendingUp,
      color: "var(--accent-violet)",
      value: a ? formatPercent(a.paymentSuccessRatePercent) : null,
    },
    {
      label: "At-risk value",
      icon: IndianRupee,
      color: "var(--accent-rose)",
      value: a ? formatMoney(a.failedPaymentValueMinor, "INR") : null,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) =>
        result.isLoading || card.value === null ? (
          <KpiCardSkeleton key={card.label} />
        ) : (
          <div
            key={card.label}
            className="group relative overflow-hidden rounded-3xl border border-[var(--border-subtle)] bg-white/[0.02] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:bg-white/[0.04]"
          >
            <div
              className="absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-25"
              style={{ background: card.color }}
            />
            <span
              className="flex h-8 w-8 items-center justify-center rounded-xl"
              style={{ background: `color-mix(in srgb, ${card.color} 16%, transparent)` }}
            >
              <card.icon className="h-4 w-4" style={{ color: card.color }} />
            </span>
            <p className="mt-3 text-xl font-semibold text-white">{card.value}</p>
            <p className="text-xs text-zinc-500">{card.label}</p>
            {a && (
              <p className="mt-1 text-[10px] uppercase tracking-wide text-zinc-600">
                {new Date(a.period.from).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                {" – "}
                {new Date(a.period.to).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            )}
          </div>
        )
      )}
    </div>
  );
}

"use client";

import { CheckCircle2, Clock, IndianRupee, ShoppingCart, XCircle } from "lucide-react";
import type { UseApiResourceResult } from "@/hooks/useApiResource";
import type { OrdersSummary } from "@/lib/api/orders";
import { formatMoney, formatNumber } from "../dashboard/home/formatters";
import { ErrorNote, KpiCardSkeleton } from "../dashboard/home/Skeletons";

interface OrdersSummaryCardsProps {
  result: UseApiResourceResult<OrdersSummary>;
}

/**
 * Real numbers only — every figure here is a field on the
 * GET /orders/summary response (backend/src/modules/orders/orders.repository.ts's
 * getOrdersSummaryScoped): exact per-status counts from a single grouped
 * COUNT query, and a revenue sum sums 100% of "paid" orders — never an
 * estimate, never a client-side aggregation over a paginated page of
 * rows. Same "cards read straight off one backend aggregate" discipline
 * as ProductsSummaryCards / AuditSummaryCards, just one summary request
 * instead of several limit:1 ones since the backend already group-by's
 * every status in one query.
 */
export function OrdersSummaryCards({ result }: OrdersSummaryCardsProps) {
  const s = result.data;

  if (result.error && !s) {
    return <ErrorNote message={result.error} onRetry={result.refetch} />;
  }

  const cards = [
    {
      label: "Total orders",
      icon: ShoppingCart,
      color: "var(--accent-cyan)",
      value: s ? formatNumber(s.totalOrders) : null,
    },
    {
      label: "Paid",
      icon: CheckCircle2,
      color: "var(--accent-emerald)",
      value: s ? formatNumber(s.paidOrders) : null,
    },
    {
      label: "Pending",
      icon: Clock,
      color: "var(--accent-amber)",
      value: s ? formatNumber(s.pendingOrders) : null,
    },
    {
      label: "Failed",
      icon: XCircle,
      color: "var(--accent-rose)",
      value: s ? formatNumber(s.failedOrders) : null,
    },
    {
      label: "Total revenue",
      icon: IndianRupee,
      color: "var(--accent-violet)",
      value: s ? formatMoney(s.totalRevenueMinor, s.currency) : null,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
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
          </div>
        )
      )}
    </div>
  );
}

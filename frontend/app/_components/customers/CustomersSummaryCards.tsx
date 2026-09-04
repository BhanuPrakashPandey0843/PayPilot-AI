"use client";

import { Ban, CheckCircle2, Users, XCircle } from "lucide-react";
import type { UseApiResourceResult } from "@/hooks/useApiResource";
import { formatNumber } from "../dashboard/home/formatters";
import { KpiCardSkeleton } from "../dashboard/home/Skeletons";

interface CustomersSummaryCardsProps {
  totalCount: UseApiResourceResult<number>;
  activeCount: UseApiResourceResult<number>;
  inactiveCount: UseApiResourceResult<number>;
  blockedCount: UseApiResourceResult<number>;
}

/**
 * Real numbers only — each card is an exact meta.total from a scoped
 * GET /customers?limit=1 request (see hooks/useCustomers.ts's
 * useCustomerCount), same pattern as ProductsSummaryCards. There is no
 * "Total Customer Revenue" or "Repeat Customers" card here: this
 * module has no aggregate revenue endpoint and no reliable way to
 * compute either across every customer without an N+1 fan-out over
 * every order in the organization, so — per the "don't invent metrics"
 * rule — they're left off the list view. Per-customer spend is instead
 * computed honestly, one customer at a time, in CustomerDetailModal.
 */
export function CustomersSummaryCards({
  totalCount,
  activeCount,
  inactiveCount,
  blockedCount,
}: CustomersSummaryCardsProps) {
  const cards = [
    { label: "Total customers", icon: Users, result: totalCount, color: "var(--accent-cyan)" },
    { label: "Active", icon: CheckCircle2, result: activeCount, color: "var(--accent-emerald)" },
    { label: "Inactive", icon: XCircle, result: inactiveCount, color: "var(--muted)" },
    { label: "Blocked", icon: Ban, result: blockedCount, color: "var(--accent-rose)" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((card) =>
        card.result.isLoading || card.result.data === null ? (
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
            <p className="mt-3 text-xl font-semibold text-white">{formatNumber(card.result.data)}</p>
            <p className="text-xs text-zinc-500">{card.label}</p>
          </div>
        )
      )}
    </div>
  );
}

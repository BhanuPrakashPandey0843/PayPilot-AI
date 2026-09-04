"use client";

import type { ComponentType } from "react";
import { ListTree, ThumbsUp, CheckCircle2, XCircle } from "lucide-react";
import type { UseApiResourceResult } from "@/hooks/useApiResource";
import { formatNumber } from "../dashboard/home/formatters";
import { KpiCardSkeleton } from "../dashboard/home/Skeletons";

interface RevenueSummaryCardsProps {
  openCount: UseApiResourceResult<number>;
  approvedCount: UseApiResourceResult<number>;
  executedCount: UseApiResourceResult<number>;
  failedCount: UseApiResourceResult<number>;
}

interface CardDef {
  label: string;
  icon: ComponentType<{ className?: string }>;
  value: number | null;
  loading: boolean;
  color: string;
}

/** Real counts only — each card is an exact meta.total from a
 * status-scoped GET /revenue/opportunities?status=...&limit=1 request,
 * same pattern as AuditSummaryCards. */
export function RevenueSummaryCards({ openCount, approvedCount, executedCount, failedCount }: RevenueSummaryCardsProps) {
  const cards: CardDef[] = [
    { label: "Open", icon: ListTree, value: openCount.data, loading: openCount.isLoading, color: "var(--accent-cyan)" },
    {
      label: "Approved · awaiting execution",
      icon: ThumbsUp,
      value: approvedCount.data,
      loading: approvedCount.isLoading,
      color: "var(--accent-blue)",
    },
    {
      label: "Executed",
      icon: CheckCircle2,
      value: executedCount.data,
      loading: executedCount.isLoading,
      color: "var(--accent-emerald)",
    },
    {
      label: "Failed",
      icon: XCircle,
      value: failedCount.data,
      loading: failedCount.isLoading,
      color: "var(--accent-rose)",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card) =>
        card.loading || card.value === null ? (
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
            <p className="mt-3 text-xl font-semibold text-white">{formatNumber(card.value)}</p>
            <p className="text-xs text-zinc-500">{card.label}</p>
          </div>
        )
      )}
    </div>
  );
}

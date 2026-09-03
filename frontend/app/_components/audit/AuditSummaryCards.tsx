"use client";

import type { ComponentType } from "react";
import { Sparkles, CreditCard, ShieldCheck, ShieldX, ListTree } from "lucide-react";
import type { UseApiResourceResult } from "@/hooks/useApiResource";
import type { AuditListResult } from "@/lib/api/audit";
import { getEventMeta } from "./eventMeta";
import { formatNumber } from "../dashboard/home/formatters";
import { KpiCardSkeleton } from "../dashboard/home/Skeletons";

interface AuditSummaryCardsProps {
  totalEvents: UseApiResourceResult<number>;
  aiActionEvents: UseApiResourceResult<number>;
  paymentEvents: UseApiResourceResult<number>;
  paymentAttemptEvents: UseApiResourceResult<number>;
  policyBlockedEvents: UseApiResourceResult<number>;
  /** Most recent page of events (unfiltered) — the only way to surface
   * a "failed events" figure, since the backend can't sum multiple
   * action values in one request. Explicitly scoped to "recent", not
   * "all-time", in the card copy below. */
  recentWindow: UseApiResourceResult<AuditListResult>;
}

interface CardDef {
  label: string;
  sublabel?: string;
  icon: ComponentType<{ className?: string }>;
  value: number | null;
  loading: boolean;
  color: string;
}

/** Real numbers only — each card is either an exact meta.total from a
 * scoped GET /audit request, or (for "Failed events") a count over the
 * most recent 100 events, labeled as such rather than presented as an
 * all-time figure the backend has no endpoint to compute. */
export function AuditSummaryCards({
  totalEvents,
  aiActionEvents,
  paymentEvents,
  paymentAttemptEvents,
  policyBlockedEvents,
  recentWindow,
}: AuditSummaryCardsProps) {
  const paymentTotal =
    paymentEvents.data !== null && paymentAttemptEvents.data !== null
      ? paymentEvents.data + paymentAttemptEvents.data
      : null;
  const paymentLoading = paymentEvents.isLoading || paymentAttemptEvents.isLoading;

  const recentFailures =
    recentWindow.data?.rows.filter((e) => getEventMeta(e.action).tone === "failure").length ?? null;

  const cards: CardDef[] = [
    {
      label: "Total events",
      icon: ListTree,
      value: totalEvents.data,
      loading: totalEvents.isLoading,
      color: "var(--accent-cyan)",
    },
    {
      label: "AI actions",
      icon: Sparkles,
      value: aiActionEvents.data,
      loading: aiActionEvents.isLoading,
      color: "var(--accent-violet)",
    },
    {
      label: "Payment events",
      icon: CreditCard,
      value: paymentTotal,
      loading: paymentLoading,
      color: "var(--accent-gold)",
    },
    {
      label: "Policy blocks",
      icon: ShieldCheck,
      value: policyBlockedEvents.data,
      loading: policyBlockedEvents.isLoading,
      color: "var(--accent-emerald)",
    },
    {
      label: "Failed events",
      sublabel: "of last 100",
      icon: ShieldX,
      value: recentFailures,
      loading: recentWindow.isLoading,
      color: "var(--accent-rose)",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
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
            <p className="text-xs text-zinc-500">
              {card.label}
              {card.sublabel ? <span className="text-zinc-600"> · {card.sublabel}</span> : null}
            </p>
          </div>
        )
      )}
    </div>
  );
}

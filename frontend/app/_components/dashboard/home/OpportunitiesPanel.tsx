"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowUpRight,
  CreditCard,
  ShoppingBag,
  TrendingDown,
  Layers,
  Check,
  X,
  Zap,
} from "lucide-react";
import type { ComponentType } from "react";
import type { UseApiResourceResult } from "@/hooks/useApiResource";
import type { OpportunityListResult, OpportunityType, OpportunitySeverity } from "@/lib/api/dashboard";
import { approveOpportunity, rejectOpportunity, executeOpportunity } from "@/lib/api/dashboard";
import { roleHasPermission } from "@/lib/permissions";
import { formatMoney } from "./formatters";
import { ListRowSkeleton, ErrorNote } from "./Skeletons";

const TYPE_META: Record<OpportunityType, { label: string; icon: ComponentType<{ className?: string }> }> = {
  PAYMENT_RECOVERY: { label: "Payment Recovery", icon: CreditCard },
  UPSELL: { label: "Upsell", icon: TrendingDown },
  CROSS_SELL: { label: "Cross Sell", icon: Layers },
  ABANDONED_CHECKOUT: { label: "Abandoned Checkout", icon: ShoppingBag },
  REVENUE_DROP: { label: "Revenue Drop", icon: TrendingDown },
};

const SEVERITY_COLOR: Record<OpportunitySeverity, string> = {
  LOW: "var(--muted)",
  MEDIUM: "var(--accent-amber)",
  HIGH: "var(--accent-rose)",
  CRITICAL: "var(--accent-rose)",
};

interface OpportunitiesPanelProps {
  opportunities: UseApiResourceResult<OpportunityListResult>;
  role: string | undefined;
  currencyFallback: string;
}

/** Step 6 — the hackathon-highlight Revenue Opportunity Center, backed
 * by GET /revenue/opportunities?status=OPEN. Approve/Reject/Execute call
 * the real POST routes and refetch on success; both require ai.execute,
 * same as the backend enforces, so the buttons are hidden entirely
 * (not just disabled) for roles that would get a 403 anyway. */
export function OpportunitiesPanel({ opportunities, role, currencyFallback }: OpportunitiesPanelProps) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const canExecute = roleHasPermission(role, "ai.execute");

  async function runAction(id: string, action: "approve" | "reject" | "execute") {
    setPendingId(id);
    setActionError(null);
    try {
      if (action === "approve") await approveOpportunity(id);
      else if (action === "reject") await rejectOpportunity(id);
      else await executeOpportunity(id);
      opportunities.refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Action failed. Please try again.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="rounded-3xl border border-[var(--border-subtle)] bg-white/[0.02] p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--accent-violet)]" />
          <p className="text-sm font-medium text-white">Revenue Opportunity Center</p>
        </div>
        <Link
          href="/revenue-opportunities"
          className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-white"
        >
          View all <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {actionError && <div className="mt-3"><ErrorNote message={actionError} /></div>}

      <div className="mt-4 space-y-3">
        {opportunities.error && <ErrorNote message={opportunities.error} onRetry={opportunities.refetch} />}

        {!opportunities.error && opportunities.isLoading && (
          <>
            <ListRowSkeleton />
            <ListRowSkeleton />
            <ListRowSkeleton />
          </>
        )}

        {!opportunities.isLoading && opportunities.data && opportunities.data.rows.length === 0 && (
          <p className="rounded-2xl border border-dashed border-[var(--border-subtle)] p-6 text-center text-sm text-zinc-500">
            No open opportunities right now — AI will surface new ones as your commerce activity comes in.
          </p>
        )}

        {opportunities.data?.rows.map((opp) => {
          const meta = TYPE_META[opp.type];
          const Icon = meta.icon;
          const isPending = pendingId === opp.id;
          return (
            <div
              key={opp.id}
              className="group rounded-2xl border border-[var(--border-subtle)] bg-white/[0.015] p-4 transition-colors hover:border-[var(--border-strong)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-violet)]/12">
                    <Icon className="h-4 w-4 text-[var(--accent-violet)]" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium text-white">{opp.title}</p>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{
                          background: `color-mix(in srgb, ${SEVERITY_COLOR[opp.severity]} 16%, transparent)`,
                          color: SEVERITY_COLOR[opp.severity],
                        }}
                      >
                        {opp.severity}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-zinc-400">{opp.description}</p>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-[var(--accent-emerald)]">
                    +{formatMoney(opp.estimatedRevenueImpact, opp.currency || currencyFallback)}
                  </p>
                  <p className="text-[11px] text-zinc-500">{opp.confidence}% confidence</p>
                </div>
              </div>

              {canExecute && (
                <div className="mt-3 flex items-center gap-2">
                  {opp.status === "OPEN" && (
                    <>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => runAction(opp.id, "approve")}
                        className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-emerald)]/12 px-3 py-1.5 text-xs font-medium text-[var(--accent-emerald)] transition-colors hover:bg-[var(--accent-emerald)]/20 disabled:opacity-50"
                      >
                        <Check className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => runAction(opp.id, "reject")}
                        className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
                      >
                        <X className="h-3.5 w-3.5" /> Dismiss
                      </button>
                    </>
                  )}
                  {opp.status === "APPROVED" && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => runAction(opp.id, "execute")}
                      className="inline-flex items-center gap-1 rounded-full bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-cyan)] px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      <Zap className="h-3.5 w-3.5" /> {isPending ? "Executing…" : "Execute"}
                    </button>
                  )}
                  {!["OPEN", "APPROVED"].includes(opp.status) && (
                    <span className="text-[11px] text-zinc-500">Status: {opp.status}</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

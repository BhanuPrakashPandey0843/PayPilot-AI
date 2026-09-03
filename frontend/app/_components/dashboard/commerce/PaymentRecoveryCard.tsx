"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertOctagon, ShieldCheck, Loader2, ArrowUpRight } from "lucide-react";
import { useApiResource } from "@/hooks/useApiResource";
import { listOpportunities, approveOpportunity, executeOpportunity, type RevenueOpportunity } from "@/lib/api/dashboard";
import { roleHasPermission } from "@/lib/permissions";
import { formatMoney } from "../home/formatters";

const SEVERITY_COLOR: Record<string, string> = {
  LOW: "text-zinc-400",
  MEDIUM: "text-[var(--accent-amber)]",
  HIGH: "text-[var(--accent-rose)]",
  CRITICAL: "text-[var(--accent-rose)]",
};

/**
 * Surfaces a REAL, already-detected PAYMENT_RECOVERY opportunity
 * (GET /revenue/opportunities?type=PAYMENT_RECOVERY&status=OPEN — the
 * same deterministic detection engine behind the Revenue Opportunities
 * page). Approve -> Execute follows revenue.routes.ts's actual OPEN ->
 * APPROVED -> EXECUTING -> EXECUTED state machine; execution prepares a
 * real fresh Razorpay payment attempt for the affected customer(s), it
 * never fabricates a "recovered ₹X" result (see revenue.execution.ts).
 */
export function PaymentRecoveryCard({ role }: { role: string | undefined }) {
  const canExecute = roleHasPermission(role, "ai.execute");
  const { data, isLoading, refetch } = useApiResource(
    () => listOpportunities({ type: "PAYMENT_RECOVERY", status: "OPEN", limit: 1, sort: "estimatedRevenueImpact" }),
    []
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [executed, setExecuted] = useState<RevenueOpportunity | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const opportunity = executed ?? data?.rows[0] ?? null;

  if (isLoading) {
    return <div className="h-28 animate-shimmer rounded-2xl border border-[var(--border-subtle)]" />;
  }
  if (!opportunity) return null;
  if (!canExecute && opportunity.status !== "EXECUTED") return null;

  async function handleApproveAndRecover() {
    if (!opportunity) return;
    setBusyId(opportunity.id);
    setErrorMsg(null);
    try {
      const approved =
        opportunity.status === "OPEN" ? await approveOpportunity(opportunity.id) : opportunity;
      const result = await executeOpportunity(approved.id);
      setExecuted(result);
      refetch();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Could not prepare the recovery attempt.");
    } finally {
      setBusyId(null);
    }
  }

  const results = (opportunity.executionResult?.results as Array<{ status: string; reason?: string }> | undefined) ?? [];
  const preparedCount = results.filter((r) => r.status === "prepared").length;

  return (
    <div className="rounded-2xl border border-[var(--accent-amber)]/25 bg-[var(--accent-amber)]/[0.04] p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm font-medium text-white">
          <AlertOctagon className="h-4 w-4 text-[var(--accent-amber)]" /> Payment Recovery
        </p>
        <span className={`text-[10px] font-medium uppercase tracking-wide ${SEVERITY_COLOR[opportunity.severity]}`}>
          {opportunity.severity}
        </span>
      </div>

      <p className="mt-2 text-lg font-semibold text-white">
        Recover {formatMoney(opportunity.estimatedRevenueImpact, opportunity.currency)}
      </p>
      <p className="mt-1 text-[11px] text-zinc-400">{opportunity.description}</p>
      <p className="mt-1 text-[11px] text-zinc-500">Confidence: {opportunity.confidence}%</p>

      {opportunity.status === "EXECUTED" ? (
        <div className="mt-3 rounded-xl border border-[var(--accent-emerald)]/25 bg-[var(--accent-emerald)]/[0.06] p-2.5">
          <p className="flex items-center gap-1.5 text-xs font-medium text-[var(--accent-emerald)]">
            <ShieldCheck className="h-3.5 w-3.5" /> {preparedCount} recovery link{preparedCount === 1 ? "" : "s"} prepared
          </p>
          <p className="mt-1 text-[11px] text-zinc-400">
            {(opportunity.executionResult?.summary as string) ?? "Prepared — see Revenue Opportunities for details."}
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleApproveAndRecover}
          disabled={busyId === opportunity.id}
          className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-[var(--accent-amber)] to-[var(--accent-rose)] px-3 py-2 text-xs font-medium text-white transition-opacity disabled:opacity-50"
        >
          {busyId === opportunity.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
          {busyId === opportunity.id ? "Preparing recovery…" : "Approve & Recover"}
        </button>
      )}
      {errorMsg && <p className="mt-1.5 text-[11px] text-[var(--accent-rose)]">{errorMsg}</p>}

      <Link
        href="/revenue-opportunities"
        className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-[var(--accent-cyan)] hover:text-white"
      >
        View all opportunities <ArrowUpRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

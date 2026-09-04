"use client";

import { useState } from "react";
import { Zap, X, ShieldAlert, CheckCircle2, Loader2, Lock } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { executeOpportunity, type RevenueOpportunity } from "@/lib/api/dashboard";
import { formatMoney } from "../dashboard/home/formatters";
import { TYPE_META, isLikelyExecutable, type PolicyCheck } from "./opportunityMeta";
import { PolicyChecks } from "./PolicyChecks";

interface ExecuteConfirmModalProps {
  opportunity: RevenueOpportunity;
  onClose: () => void;
  /** Called once execution finishes (success OR a definitive failure) so
   * the parent list can refetch and pick up the new status. Not called
   * for a 422 policy block, since that makes no state change on the
   * backend at all. */
  onSettled: () => void;
}

type ModalState =
  | { phase: "confirm" }
  | { phase: "executing" }
  | { phase: "blocked"; reason: string; checks: PolicyCheck[] }
  | { phase: "error"; message: string }
  | { phase: "done"; row: RevenueOpportunity };

/**
 * Confirmation UI required before POST /revenue/opportunities/:id/execute
 * actually runs. Never simulates success client-side — every outcome
 * shown here (blocked / error / done) comes straight from the real
 * response. A BLOCKED policy result (422) is rendered with the backend's
 * own itemized checks (action-policy.service.ts), not a generic error.
 */
export function ExecuteConfirmModal({ opportunity, onClose, onSettled }: ExecuteConfirmModalProps) {
  const [state, setState] = useState<ModalState>({ phase: "confirm" });
  const meta = TYPE_META[opportunity.type];
  const action = opportunity.recommendedAction as { description?: string; actionType?: string } | null;
  const likelyExecutable = isLikelyExecutable(opportunity.recommendedAction);

  async function handleConfirm() {
    setState({ phase: "executing" });
    try {
      const row = await executeOpportunity(opportunity.id);
      setState({ phase: "done", row });
      onSettled();
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        const details = err.details as { checks?: PolicyCheck[] } | undefined;
        setState({ phase: "blocked", reason: err.message, checks: details?.checks ?? [] });
        return; // 422 = no state change on the backend, nothing to refetch
      }
      setState({ phase: "error", message: err instanceof ApiError ? err.message : "Execution failed. Please try again." });
      onSettled(); // a non-422 failure (e.g. 409 already-executing) may still mean the row changed
    }
  }

  const isBusy = state.phase === "executing";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={isBusy ? undefined : onClose} />
      <div className="glass-panel relative w-full max-w-lg rounded-3xl border border-[var(--border-subtle)] bg-[var(--background-elevated)] p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          disabled={isBusy}
          className="absolute right-4 top-4 rounded-lg p-1 text-zinc-500 hover:bg-white/5 hover:text-white disabled:opacity-40"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-cyan)]/12">
            <meta.icon className="h-5 w-5" style={{ color: meta.color }} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Execute opportunity</p>
            <h2 className="mt-0.5 truncate text-lg font-semibold text-white">{opportunity.title}</h2>
          </div>
        </div>

        {state.phase === "confirm" && (
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-white/[0.02] p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">What will happen</p>
              <p className="mt-1.5 text-sm text-zinc-300">
                {action?.description ?? "No recommended action is recorded for this opportunity."}
              </p>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-[var(--border-subtle)] bg-white/[0.02] p-4">
              <span className="text-xs text-zinc-500">Estimated revenue impact</span>
              <span className="text-sm font-semibold text-[var(--accent-emerald)]">
                {formatMoney(opportunity.estimatedRevenueImpact, opportunity.currency)}
              </span>
            </div>

            {!likelyExecutable && (
              <div className="flex items-start gap-2 rounded-2xl border border-[var(--accent-amber)]/25 bg-[var(--accent-amber)]/[0.06] p-3 text-xs text-[var(--accent-amber)]">
                <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  This opportunity type has no automated execution path in PayPilot — the backend will likely block
                  this and tell you why. You can still try; nothing will be silently faked.
                </span>
              </div>
            )}

            <p className="flex items-start gap-2 text-[11px] text-zinc-500">
              <Lock className="mt-0.5 h-3 w-3 shrink-0" />
              Execution prepares a real backend action (e.g. a fresh Razorpay payment attempt or link) — it never
              charges the customer directly; they still complete their own authorization step.
            </p>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-[var(--border-subtle)] px-4 py-2 text-sm font-medium text-zinc-300 hover:border-[var(--border-strong)] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-cyan)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                <Zap className="h-4 w-4" /> Confirm & execute
              </button>
            </div>
          </div>
        )}

        {state.phase === "executing" && (
          <div className="mt-6 flex flex-col items-center gap-3 py-6 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--accent-cyan)]" />
            <p className="text-sm text-zinc-300">Running policy checks and executing…</p>
          </div>
        )}

        {state.phase === "blocked" && (
          <div className="mt-5 space-y-3">
            <div className="flex items-start gap-2 rounded-2xl border border-[var(--accent-amber)]/25 bg-[var(--accent-amber)]/[0.06] p-4">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-amber)]" />
              <div>
                <p className="text-sm font-medium text-[var(--accent-amber)]">Execution blocked by policy</p>
                <p className="mt-1 text-xs text-zinc-400">{state.reason}</p>
              </div>
            </div>
            {state.checks.length > 0 && (
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-white/[0.02] p-4">
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-zinc-500">Policy checks</p>
                <PolicyChecks checks={state.checks} />
              </div>
            )}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-[var(--border-subtle)] px-4 py-2 text-sm font-medium text-zinc-300 hover:border-[var(--border-strong)] hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {state.phase === "error" && (
          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-[var(--accent-rose)]/25 bg-[var(--accent-rose)]/[0.06] p-4 text-sm text-[var(--accent-rose)]">
              {state.message}
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-[var(--border-subtle)] px-4 py-2 text-sm font-medium text-zinc-300 hover:border-[var(--border-strong)] hover:text-white"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="rounded-xl bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-cyan)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {state.phase === "done" && (
          <div className="mt-5 space-y-3">
            <div className="flex items-start gap-2 rounded-2xl border border-[var(--accent-emerald)]/25 bg-[var(--accent-emerald)]/[0.06] p-4">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-emerald)]" />
              <div>
                <p className="text-sm font-medium text-[var(--accent-emerald)]">
                  {state.row.status === "EXECUTED" ? "Executed successfully" : "Execution finished with issues"}
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  {state.row.status === "EXECUTED"
                    ? "The recommended action has been prepared against real backend data."
                    : (state.row.executionFailureReason ?? "See the opportunity's status for details.")}
                </p>
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-[var(--border-subtle)] px-4 py-2 text-sm font-medium text-zinc-300 hover:border-[var(--border-strong)] hover:text-white"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

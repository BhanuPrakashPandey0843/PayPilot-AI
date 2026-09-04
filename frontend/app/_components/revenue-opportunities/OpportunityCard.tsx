"use client";

import { useState } from "react";
import { Check, X, Zap, ChevronDown, Users, Package, Clock, AlertTriangle } from "lucide-react";
import type { RevenueOpportunity } from "@/lib/api/dashboard";
import { formatMoney, relativeTime } from "../dashboard/home/formatters";
import { TYPE_META, SEVERITY_COLOR, STATUS_META, evidenceCustomerCount, evidenceProductNames } from "./opportunityMeta";

interface OpportunityCardProps {
  opportunity: RevenueOpportunity;
  canExecute: boolean;
  isPending: boolean;
  onApprove: () => void;
  onReject: (reason?: string) => void;
  onExecute: () => void;
  currencyFallback: string;
}

/**
 * One revenue opportunity, full-detail card. Covers every field the
 * brief asks for: type, an honest stand-in for "customer" (evidence's
 * real customer/product arrays — see opportunityMeta.ts's doc comment
 * for why there's no single-customer field), value, status, confidence/
 * priority (score + confidence + severity), created date, execution
 * status, and the actions actually available for its current status.
 */
export function OpportunityCard({
  opportunity,
  canExecute,
  isPending,
  onApprove,
  onReject,
  onExecute,
  currencyFallback,
}: OpportunityCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  const meta = TYPE_META[opportunity.type];
  const Icon = meta.icon;
  const statusMeta = STATUS_META[opportunity.status];
  const customerCount = evidenceCustomerCount(opportunity.evidence);
  const productNames = evidenceProductNames(opportunity.evidence);

  function submitReject() {
    onReject(reason.trim() || undefined);
    setRejecting(false);
    setReason("");
  }

  return (
    <div className="group rounded-3xl border border-[var(--border-subtle)] bg-white/[0.02] p-5 transition-colors hover:border-[var(--border-strong)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ background: `color-mix(in srgb, ${meta.color} 16%, transparent)` }}
          >
            <Icon className="h-5 w-5" style={{ color: meta.color }} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">{meta.label}</span>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{
                  background: `color-mix(in srgb, ${SEVERITY_COLOR[opportunity.severity]} 16%, transparent)`,
                  color: SEVERITY_COLOR[opportunity.severity],
                }}
              >
                {opportunity.severity}
              </span>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{
                  background: `color-mix(in srgb, ${statusMeta.color} 16%, transparent)`,
                  color: statusMeta.color,
                }}
              >
                {statusMeta.label}
              </span>
            </div>
            <p className="mt-1 truncate text-sm font-medium text-white sm:text-base">{opportunity.title}</p>
            <p className="mt-1 line-clamp-2 text-xs text-zinc-400 sm:text-sm">{opportunity.description}</p>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-base font-semibold text-[var(--accent-emerald)] sm:text-lg">
            +{formatMoney(opportunity.estimatedRevenueImpact, opportunity.currency || currencyFallback)}
          </p>
          <p className="text-[11px] text-zinc-500">
            {opportunity.score} score · {opportunity.confidence}% confidence
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-zinc-500">
        {customerCount !== null && (
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" /> {customerCount} customer{customerCount === 1 ? "" : "s"} affected
          </span>
        )}
        {productNames.length > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5" /> {productNames.slice(0, 2).join(", ")}
            {productNames.length > 2 ? ` +${productNames.length - 2}` : ""}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5" title={new Date(opportunity.createdAt).toLocaleString("en-IN")}>
          <Clock className="h-3.5 w-3.5" /> Created {relativeTime(opportunity.createdAt)}
        </span>
        {opportunity.status === "EXECUTING" && (
          <span className="inline-flex items-center gap-1.5 text-[var(--accent-amber)]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent-amber)]" /> Executing…
          </span>
        )}
        {opportunity.status === "EXECUTED" && opportunity.executedAt && (
          <span className="text-[var(--accent-emerald)]">Executed {relativeTime(opportunity.executedAt)}</span>
        )}
        {opportunity.status === "FAILED" && (
          <span className="inline-flex items-center gap-1.5 text-[var(--accent-rose)]">
            <AlertTriangle className="h-3.5 w-3.5" /> {opportunity.executionFailureReason ?? "Execution failed"}
          </span>
        )}
        {opportunity.status === "REJECTED" && opportunity.rejectedReason && (
          <span className="text-zinc-500">Rejected: {opportunity.rejectedReason}</span>
        )}

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="ml-auto inline-flex items-center gap-1 text-zinc-500 hover:text-white"
        >
          Details <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
      </div>

      {expanded && (
        <div className="mt-4 grid gap-4 border-t border-[var(--border-subtle)] pt-4 sm:grid-cols-2">
          <div className="space-y-2 text-xs">
            <Detail label="Opportunity ID" value={opportunity.id} mono />
            <Detail label="Recommended action" value={(opportunity.recommendedAction as { description?: string } | null)?.description ?? "—"} />
            {opportunity.executionResult && (
              <Detail label="Execution result" value={JSON.stringify(opportunity.executionResult)} mono />
            )}
          </div>
          <div>
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500">Evidence</p>
            <pre className="max-h-48 overflow-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--background-elevated)] p-3 text-[11px] leading-relaxed text-zinc-400">
              {JSON.stringify(opportunity.evidence ?? {}, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {canExecute && (
        <div className="mt-4 border-t border-[var(--border-subtle)] pt-4">
          {opportunity.status === "OPEN" && !rejecting && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={onApprove}
                className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-emerald)]/12 px-3 py-1.5 text-xs font-medium text-[var(--accent-emerald)] transition-colors hover:bg-[var(--accent-emerald)]/20 disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" /> Approve
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => setRejecting(true)}
                className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" /> Reject
              </button>
            </div>
          )}

          {opportunity.status === "OPEN" && rejecting && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason (optional) — shown in the audit trail"
                className="flex-1 rounded-xl border border-[var(--border-subtle)] bg-white/[0.02] px-3 py-1.5 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-[var(--border-strong)]"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={submitReject}
                  className="rounded-full bg-[var(--accent-rose)]/15 px-3 py-1.5 text-xs font-medium text-[var(--accent-rose)] hover:bg-[var(--accent-rose)]/25 disabled:opacity-50"
                >
                  Confirm reject
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRejecting(false);
                    setReason("");
                  }}
                  className="rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {opportunity.status === "APPROVED" && (
            <button
              type="button"
              disabled={isPending}
              onClick={onExecute}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-cyan)] px-4 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Zap className="h-3.5 w-3.5" /> Execute
            </button>
          )}

          {!["OPEN", "APPROVED"].includes(opportunity.status) && (
            <p className="text-[11px] text-zinc-500">No further action available for status &quot;{statusMeta.label}&quot;.</p>
          )}
        </div>
      )}
    </div>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</p>
      <p className={`mt-0.5 break-all text-zinc-300 ${mono ? "font-mono text-[11px]" : ""}`}>{value}</p>
    </div>
  );
}

"use client";

import Link from "next/link";
import { ArrowUpRight, CreditCard } from "lucide-react";
import type { UseApiResourceResult } from "@/hooks/useApiResource";
import type { PaymentHistoryResult, PaymentRecord } from "@/lib/api/dashboard";
import { formatMoney, relativeTime } from "./formatters";
import { ListRowSkeleton, ErrorNote } from "./Skeletons";

const STATUS_STYLE: Record<PaymentRecord["status"], { label: string; className: string }> = {
  captured: { label: "Paid", className: "bg-[var(--accent-emerald)]/10 text-[var(--accent-emerald)]" },
  partially_refunded: { label: "Partial refund", className: "bg-[var(--accent-amber)]/10 text-[var(--accent-amber)]" },
  refunded: { label: "Refunded", className: "bg-white/10 text-zinc-300" },
  failed: { label: "Failed", className: "bg-[var(--accent-rose)]/10 text-[var(--accent-rose)]" },
};

/**
 * Step 8 — recent orders & payments activity. There is no dedicated
 * GET /orders list in this backend (see lib/api/dashboard.ts's top
 * comment), so this reads GET /payments/history, where each row already
 * carries the orderId it belongs to — the honest real-data equivalent
 * of an "orders" feed rather than a fabricated one.
 */
export function RecentActivity({ payments }: { payments: UseApiResourceResult<PaymentHistoryResult> }) {
  return (
    <div className="rounded-3xl border border-[var(--border-subtle)] bg-white/[0.02] p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-[var(--accent-blue)]" />
          <p className="text-sm font-medium text-white">Recent payments</p>
        </div>
        <Link
          href="/payments"
          className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-white"
        >
          View all <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-4 space-y-2">
        {payments.error && <ErrorNote message={payments.error} onRetry={payments.refetch} />}

        {!payments.error && payments.isLoading && (
          <>
            <ListRowSkeleton />
            <ListRowSkeleton />
            <ListRowSkeleton />
          </>
        )}

        {!payments.isLoading && payments.data && payments.data.rows.length === 0 && (
          <p className="rounded-2xl border border-dashed border-[var(--border-subtle)] p-6 text-center text-sm text-zinc-500">
            No payments yet — they&apos;ll show up here as orders come in.
          </p>
        )}

        {payments.data?.rows.map((p) => {
          const status = STATUS_STYLE[p.status];
          return (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-2xl border border-transparent p-3 transition-colors hover:border-[var(--border-subtle)] hover:bg-white/[0.02]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 text-xs font-medium text-zinc-300">
                {p.provider.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-white">Order {p.orderId.slice(0, 8)}</p>
                <p className="truncate text-xs text-zinc-500">
                  {p.provider} · {relativeTime(p.createdAt)}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-medium text-white">{formatMoney(p.amount, p.currency)}</p>
                <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${status.className}`}>
                  {status.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

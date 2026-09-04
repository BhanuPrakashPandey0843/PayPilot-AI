"use client";

import { AlertTriangle } from "lucide-react";
import type { UseApiResourceResult } from "@/hooks/useApiResource";
import type { PaymentAnalytics } from "@/lib/api/dashboard";
import { formatMoney } from "../dashboard/home/formatters";
import { ErrorNote } from "../dashboard/home/Skeletons";

interface PaymentFailureAnalysisProps {
  result: UseApiResourceResult<PaymentAnalytics>;
  currency: string;
}

/**
 * Failure-code breakdown — GET /analytics/payments's `failuresByCode`
 * (backend/src/modules/analytics/analytics.repository.ts's
 * getFailuresByCode: a GROUP BY on payment_attempts.failure_code for
 * status='failed' rows). The backend never translates these codes to a
 * human description (no such mapping exists anywhere in the schema or
 * service layer), so per Phase 11 of the brief ("if human-readable
 * descriptions exist, use them; if not, preserve the code") this shows
 * the raw code exactly as returned rather than inventing a friendlier
 * label that could misrepresent what actually happened at the gateway.
 * A null failureCode (attempt failed before a provider code was
 * recorded) renders as "Unspecified" — a UI label for the null case,
 * not a renamed or reinterpreted code.
 *
 * Percentage-of-failures is computed here client-side from two numbers
 * already on this same response (each row's count ÷ the response's own
 * failureCount) — not a separate estimate, and guarded against a zero
 * denominator so it can never render NaN or Infinity.
 */
export function PaymentFailureAnalysis({ result, currency }: PaymentFailureAnalysisProps) {
  const data = result.data;
  const rows = data?.failuresByCode ?? [];
  const isEmpty = !result.isLoading && !result.error && rows.length === 0;

  return (
    <div className="rounded-3xl border border-[var(--border-subtle)] bg-white/[0.02] p-6">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-[var(--accent-rose)]" />
        <p className="text-sm font-medium text-white">Payment failure analysis</p>
      </div>

      {result.error && (
        <div className="mt-4">
          <ErrorNote message={result.error} onRetry={result.refetch} />
        </div>
      )}

      {!result.error && result.isLoading && (
        <div className="mt-4 space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-shimmer h-11 w-full rounded-xl bg-white/[0.03]" />
          ))}
        </div>
      )}

      {isEmpty && (
        <p className="mt-4 rounded-2xl border border-dashed border-[var(--border-subtle)] p-6 text-center text-xs text-zinc-500">
          No payment failures detected in this period.
        </p>
      )}

      {!result.isLoading && !result.error && data && rows.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {rows.map((f) => {
            const pct = data.failureCount > 0 ? (f.count / data.failureCount) * 100 : null;
            return (
              <li
                key={f.failureCode ?? "unspecified"}
                className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border-subtle)] bg-white/[0.015] px-4 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs text-zinc-200">{f.failureCode ?? "Unspecified"}</p>
                  <p className="text-[11px] text-zinc-500">
                    {f.count} attempt{f.count === 1 ? "" : "s"} · {formatMoney(f.valueMinor, currency)}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-medium text-[var(--accent-rose)]">
                  {pct === null ? "—" : `${pct.toFixed(1)}%`}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

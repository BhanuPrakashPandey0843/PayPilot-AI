"use client";

import { RefreshCw, Info } from "lucide-react";

interface PaymentsToolbarProps {
  onRefresh: () => void;
  isRefreshing: boolean;
}

/**
 * Payments toolbar.
 *
 * IMPORTANT CAPABILITY NOTICE:
 * Today the backend's GET /payments/history endpoint ONLY accepts
 * page + limit (payment.schemas.ts: paymentHistoryQuerySchema =
 * paginationQuerySchema). There is NO server-side search, status filter,
 * date-range filter, amount-range filter, or sort parameter on this
 * route yet.
 *
 * For that reason this toolbar intentionally does NOT expose a search
 * input, filter dropdowns, or a sort select — doing so would either:
 *   a) silently filter only the currently-loaded page and LIE about
 *      being "global search", or
 *   b) accept user input that is then thrown away before the HTTP call.
 *
 * When the backend adds real search/filter/sort support for the payments
 * list query schema, add those controls here AND wire them through
 * lib/api/payments.ts's listPayments() buildListParams.
 *
 * A plain-English notice card keeps the merchant informed rather than
 * presenting an empty row of non-functional inputs.
 */
export function PaymentsToolbar({ onRefresh, isRefreshing }: PaymentsToolbarProps) {
  return (
    <div className="glass-panel flex flex-col gap-3 rounded-2xl p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2 text-xs text-zinc-500">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent-cyan)]" />
          <p>
            <span className="font-medium text-zinc-300">Filters and search</span> for payments are
            coming soon. For now, browse the paginated history below or use{" "}
            <span className="font-medium text-zinc-300">Analytics → Revenue Opportunities</span>{" "}
            to find specific failed or at-risk payments.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Refresh payments"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border-subtle)] text-zinc-400 transition-colors hover:border-[var(--border-strong)] hover:text-white disabled:opacity-40 sm:ml-auto"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </button>
      </div>
    </div>
  );
}

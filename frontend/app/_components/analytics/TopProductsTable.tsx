"use client";

import { ChevronLeft, ChevronRight, Package } from "lucide-react";
import type { UseApiResourceResult } from "@/hooks/useApiResource";
import type { ProductAnalyticsResult } from "@/lib/api/dashboard";
import { formatMoney, formatNumber } from "../dashboard/home/formatters";
import { ErrorNote } from "../dashboard/home/Skeletons";

export type ProductSort = "revenue" | "unitsSold" | "orderCount";

interface TopProductsTableProps {
  result: UseApiResourceResult<ProductAnalyticsResult>;
  currency: string;
  page: number;
  onPageChange: (page: number) => void;
  sort: ProductSort;
  onSortChange: (sort: ProductSort) => void;
}

const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: "revenue", label: "Revenue" },
  { value: "unitsSold", label: "Units sold" },
  { value: "orderCount", label: "Order count" },
];

/**
 * Full paginated/sortable product-analytics table — GET
 * /analytics/products (backend/src/modules/analytics/
 * analytics.repository.ts's getProductAnalytics: one grouped SQL
 * aggregation over paid orders' order_items, joined to products only
 * for the isActive flag). Ranking is exactly whatever the backend
 * returns for the selected sort column and order=desc — this component
 * never re-sorts the page it receives.
 *
 * No product images: ProductAnalyticsRow (lib/api/dashboard.ts) has no
 * image field to render — the catalog schema this query reads from
 * doesn't carry one into this aggregate, so every row uses the same
 * neutral package icon rather than a fabricated placeholder image.
 */
export function TopProductsTable({ result, currency, page, onPageChange, sort, onSortChange }: TopProductsTableProps) {
  const rows = result.data?.rows ?? [];
  const meta = result.data?.meta;
  const isEmpty = !result.isLoading && !result.error && rows.length === 0;

  return (
    <div className="rounded-3xl border border-[var(--border-subtle)] bg-white/[0.02] p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-[var(--accent-amber)]" />
          <p className="text-sm font-medium text-white">Top products</p>
        </div>
        <label className="flex items-center gap-2 text-xs text-zinc-500">
          Sort by
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as ProductSort)}
            className="rounded-lg border border-[var(--border-subtle)] bg-white/[0.02] px-2 py-1.5 text-xs text-zinc-200 outline-none focus:border-[var(--border-strong)]"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[var(--background-elevated)]">
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {result.error && (
        <div className="mt-4">
          <ErrorNote message={result.error} onRetry={result.refetch} />
        </div>
      )}

      {!result.error && result.isLoading && (
        <div className="mt-4 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-shimmer h-12 w-full rounded-xl bg-white/[0.03]" />
          ))}
        </div>
      )}

      {isEmpty && (
        <p className="mt-6 rounded-2xl border border-dashed border-[var(--border-subtle)] py-10 text-center text-sm text-zinc-500">
          No products sold in this period.
        </p>
      )}

      {!result.isLoading && !result.error && rows.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-xs uppercase tracking-wide text-zinc-500">
                <th className="py-2 pr-4 font-medium">Product</th>
                <th className="py-2 pr-4 font-medium">Units sold</th>
                <th className="py-2 pr-4 font-medium">Orders</th>
                <th className="py-2 pr-4 font-medium">Avg. price</th>
                <th className="py-2 pr-2 text-right font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p, i) => (
                <tr
                  key={p.productId ?? `${p.productName}-${i}`}
                  className="border-b border-[var(--border-subtle)]/60 transition-colors hover:bg-white/[0.03]"
                >
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-medium text-zinc-500">
                        #{(meta ? (meta.page - 1) * meta.limit : 0) + i + 1}
                      </span>
                      <p className="truncate text-sm font-medium text-white" title={p.productName}>
                        {p.productName}
                      </p>
                      {!p.isActive && (
                        <span className="shrink-0 rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-zinc-500">
                          Inactive
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-zinc-300">{formatNumber(p.unitsSold)}</td>
                  <td className="py-3 pr-4 text-zinc-300">{formatNumber(p.orderCount)}</td>
                  <td className="py-3 pr-4 text-zinc-400">{formatMoney(p.averageSellingPriceMinor, currency)}</td>
                  <td className="py-3 pr-2 text-right font-medium text-[var(--accent-emerald)]">
                    {formatMoney(p.revenueMinor, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
          <span>
            Page {meta.page} of {meta.totalPages} · {meta.total} products
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] px-2.5 py-1.5 font-medium text-zinc-300 hover:border-[var(--border-strong)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </button>
            <button
              type="button"
              disabled={page >= meta.totalPages}
              onClick={() => onPageChange(page + 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] px-2.5 py-1.5 font-medium text-zinc-300 hover:border-[var(--border-strong)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

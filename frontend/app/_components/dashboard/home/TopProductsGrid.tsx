"use client";

import Link from "next/link";
import { ArrowUpRight, Package } from "lucide-react";
import type { UseApiResourceResult } from "@/hooks/useApiResource";
import type { ProductAnalyticsResult } from "@/lib/api/dashboard";
import { formatMoney, formatNumber } from "./formatters";
import { CardSkeleton, ErrorNote } from "./Skeletons";

/** Step 10 — top products by revenue, sourced from GET
 * /analytics/products?sort=revenue. No product images exist in the
 * catalog schema this hook reads from, so cards lead with the metric
 * (revenue) rather than a placeholder image. */
export function TopProductsGrid({
  products,
  currency,
}: {
  products: UseApiResourceResult<ProductAnalyticsResult>;
  currency: string;
}) {
  return (
    <div className="rounded-3xl border border-[var(--border-subtle)] bg-white/[0.02] p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-[var(--accent-amber)]" />
          <p className="text-sm font-medium text-white">Top products</p>
        </div>
        <Link
          href="/products"
          className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-white"
        >
          View all <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {products.error && (
        <div className="mt-4">
          <ErrorNote message={products.error} onRetry={products.refetch} />
        </div>
      )}

      {!products.error && products.isLoading && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <CardSkeleton className="h-28" />
          <CardSkeleton className="h-28" />
          <CardSkeleton className="h-28" />
        </div>
      )}

      {!products.isLoading && products.data && products.data.rows.length === 0 && (
        <p className="mt-4 rounded-2xl border border-dashed border-[var(--border-subtle)] p-6 text-center text-sm text-zinc-500">
          No product sales yet in this period.
        </p>
      )}

      {products.data && products.data.rows.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {products.data.rows.map((p, i) => (
            <div
              key={p.productId ?? p.productName}
              className="group relative overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-white/[0.015] p-4 transition-all hover:-translate-y-0.5 hover:border-[var(--border-strong)]"
            >
              <span className="text-[11px] font-medium text-zinc-500">#{i + 1}</span>
              <p className="mt-1 truncate text-sm font-medium text-white">{p.productName}</p>
              <p className="mt-2 text-base font-semibold text-[var(--accent-emerald)]">
                {formatMoney(p.revenueMinor, currency)}
              </p>
              <p className="text-[11px] text-zinc-500">
                {formatNumber(p.unitsSold)} units · {formatNumber(p.orderCount)} orders
              </p>
              {!p.isActive && (
                <span className="mt-2 inline-block rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-zinc-500">
                  Inactive
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

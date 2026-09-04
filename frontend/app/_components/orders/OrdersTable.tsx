"use client";

import { useState } from "react";
import { Check, ChevronLeft, ChevronRight, Copy, Eye, ShoppingCart, User } from "lucide-react";
import type { UseApiResourceResult } from "@/hooks/useApiResource";
import type { OrderListResult, OrderListRow } from "@/lib/api/orders";
import { formatMoney } from "../dashboard/home/formatters";
import { ErrorNote } from "../dashboard/home/Skeletons";
import { ORDER_STATUS_META, PAYMENT_ATTEMPT_STATUS_META } from "./orderMeta";

interface OrdersTableProps {
  result: UseApiResourceResult<OrderListResult>;
  page: number;
  onPageChange: (page: number) => void;
  hasActiveFilters: boolean;
  onView: (order: OrderListRow) => void;
  onClearFilters: () => void;
}

function OrderStatusBadge({ status }: { status: OrderListRow["status"] }) {
  const meta = ORDER_STATUS_META[status];
  const Icon = meta.icon;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ background: `color-mix(in srgb, ${meta.color} 16%, transparent)`, color: meta.color }}
    >
      <Icon className="h-3 w-3" /> {meta.label}
    </span>
  );
}

function PaymentStatusBadge({ attempt }: { attempt: OrderListRow["latestPaymentAttempt"] }) {
  if (!attempt) {
    return <span className="text-xs text-zinc-600">—</span>;
  }
  const meta = PAYMENT_ATTEMPT_STATUS_META[attempt.status];
  const Icon = meta.icon;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ background: `color-mix(in srgb, ${meta.color} 16%, transparent)`, color: meta.color }}
    >
      <Icon className="h-3 w-3" /> {meta.label}
    </span>
  );
}

function CopyOrderIdButton({ order }: { order: OrderListRow }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(order.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — silently no-op,
      // this is a convenience action, not a critical one.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label="Copy order ID"
      title="Copy order ID"
      className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-[var(--accent-emerald)]" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function RowActions({ order, onView }: { order: OrderListRow; onView: (o: OrderListRow) => void }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onView(order);
        }}
        aria-label="View order"
        title="View"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
      >
        <Eye className="h-3.5 w-3.5" />
      </button>
      <CopyOrderIdButton order={order} />
    </div>
  );
}

function CustomerCell({ order }: { order: OrderListRow }) {
  if (!order.customer) {
    return <span className="text-xs text-zinc-600">—</span>;
  }
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.04] text-zinc-500">
        <User className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm text-zinc-200">{order.customer.name}</p>
        {order.customer.email && <p className="truncate text-xs text-zinc-500">{order.customer.email}</p>}
      </div>
    </div>
  );
}

export function OrdersTable({ result, page, onPageChange, hasActiveFilters, onView, onClearFilters }: OrdersTableProps) {
  const rows = result.data?.rows ?? [];
  const pageMeta = result.data?.meta;
  const isEmpty = !result.isLoading && !result.error && rows.length === 0 && !hasActiveFilters;
  const isNoResults = !result.isLoading && !result.error && rows.length === 0 && hasActiveFilters;

  return (
    <div className="rounded-3xl border border-[var(--border-subtle)] bg-white/[0.02] p-6">
      <p className="text-sm font-medium text-white">All orders</p>

      {result.error && (
        <div className="mt-4">
          <ErrorNote message={result.error} onRetry={result.refetch} />
        </div>
      )}

      {!result.error && result.isLoading && (
        <div className="mt-4 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-shimmer h-14 w-full rounded-xl bg-white/[0.03]" />
          ))}
        </div>
      )}

      {isEmpty && (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--border-subtle)] py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04]">
            <ShoppingCart className="h-5 w-5 text-zinc-500" />
          </span>
          <p className="text-sm font-medium text-zinc-200">No orders yet</p>
          <p className="max-w-xs text-xs text-zinc-500">
            Orders will show up here as soon as a customer completes checkout.
          </p>
        </div>
      )}

      {isNoResults && (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--border-subtle)] py-14 text-center">
          <p className="text-sm font-medium text-zinc-200">No orders match these filters</p>
          <p className="max-w-xs text-xs text-zinc-500">Try widening your search or clearing filters.</p>
          <button
            type="button"
            onClick={onClearFilters}
            className="mt-2 rounded-xl border border-[var(--border-subtle)] px-4 py-2 text-xs font-medium text-zinc-300 hover:border-[var(--border-strong)] hover:text-white"
          >
            Clear filters
          </button>
        </div>
      )}

      {!result.isLoading && !result.error && rows.length > 0 && (
        <>
          {/* Desktop table */}
          <div className="mt-4 hidden overflow-x-auto md:block">
            <table className="w-full min-w-[920px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] text-xs uppercase tracking-wide text-zinc-500">
                  <th className="py-2 pr-4 font-medium">Order</th>
                  <th className="py-2 pr-4 font-medium">Customer</th>
                  <th className="py-2 pr-4 font-medium">Amount</th>
                  <th className="py-2 pr-4 font-medium">Order status</th>
                  <th className="py-2 pr-4 font-medium">Payment status</th>
                  <th className="py-2 pr-4 font-medium">Updated</th>
                  <th className="py-2 pl-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((order) => (
                  <tr
                    key={order.id}
                    className="cursor-pointer border-b border-[var(--border-subtle)]/60 transition-colors hover:bg-white/[0.03]"
                    onClick={() => onView(order)}
                  >
                    <td className="py-3 pr-4">
                      <p className="font-medium text-white">{order.orderNumber}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </td>
                    <td className="py-3 pr-4">
                      <CustomerCell order={order} />
                    </td>
                    <td className="py-3 pr-4 font-medium text-zinc-200">
                      {formatMoney(order.totalAmount, order.currency)}
                    </td>
                    <td className="py-3 pr-4">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="py-3 pr-4">
                      <PaymentStatusBadge attempt={order.latestPaymentAttempt} />
                    </td>
                    <td className="py-3 pr-4 text-xs text-zinc-500">
                      {new Date(order.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </td>
                    <td className="py-3 pl-4" onClick={(e) => e.stopPropagation()}>
                      <RowActions order={order} onView={onView} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="mt-4 flex flex-col gap-3 md:hidden">
            {rows.map((order) => (
              <div
                key={order.id}
                onClick={() => onView(order)}
                className="cursor-pointer rounded-2xl border border-[var(--border-subtle)] bg-white/[0.02] p-4 transition-colors hover:border-[var(--border-strong)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{order.orderNumber}</p>
                    <div className="mt-1">
                      <CustomerCell order={order} />
                    </div>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-white">
                    {formatMoney(order.totalAmount, order.currency)}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <OrderStatusBadge status={order.status} />
                  <PaymentStatusBadge attempt={order.latestPaymentAttempt} />
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-[var(--border-subtle)] pt-3">
                  <span className="text-[11px] text-zinc-500">
                    Updated {new Date(order.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                  <div onClick={(e) => e.stopPropagation()}>
                    <RowActions order={order} onView={onView} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {pageMeta && pageMeta.totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between text-xs text-zinc-500">
          <span>
            Page {pageMeta.page} of {pageMeta.totalPages} · {pageMeta.total} orders
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
              disabled={page >= pageMeta.totalPages}
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

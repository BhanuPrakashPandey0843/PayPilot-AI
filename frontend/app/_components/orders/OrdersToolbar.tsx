"use client";

import { RefreshCw, Search, SlidersHorizontal, X } from "lucide-react";
import type { OrderSortField, OrderStatus } from "@/lib/api/orders";
import { ORDER_STATUS_OPTIONS } from "./orderMeta";

export type OrderSortOption =
  | "createdAt_desc"
  | "createdAt_asc"
  | "totalAmount_desc"
  | "totalAmount_asc"
  | "orderNumber_asc"
  | "orderNumber_desc";

export interface OrdersFilterValues {
  search: string;
  status: OrderStatus | "";
  /** Major-units decimal strings, converted at the API call boundary. */
  minAmount: string;
  maxAmount: string;
  dateFrom: string;
  dateTo: string;
  sortOption: OrderSortOption;
}

export const DEFAULT_ORDER_FILTERS: OrdersFilterValues = {
  search: "",
  status: "",
  minAmount: "",
  maxAmount: "",
  dateFrom: "",
  dateTo: "",
  sortOption: "createdAt_desc",
};

const SORT_OPTIONS: { value: OrderSortOption; label: string }[] = [
  { value: "createdAt_desc", label: "Newest first" },
  { value: "createdAt_asc", label: "Oldest first" },
  { value: "totalAmount_desc", label: "Amount: high to low" },
  { value: "totalAmount_asc", label: "Amount: low to high" },
  { value: "orderNumber_desc", label: "Order number: Z to A" },
  { value: "orderNumber_asc", label: "Order number: A to Z" },
];

/** Maps the combined UI sort option to the two real query params
 * listOrdersQuerySchema actually accepts (sort/order). */
export function sortOptionToParams(option: OrderSortOption): { sort: OrderSortField; order: "asc" | "desc" } {
  const idx = option.lastIndexOf("_");
  return { sort: option.slice(0, idx) as OrderSortField, order: option.slice(idx + 1) as "asc" | "desc" };
}

/** Major-units decimal string ("499.00") -> integer minor units, or
 * undefined for blank/invalid input — same boundary-only conversion
 * rule as lib/validation/productValidation.ts's toMinorUnits. */
export function toMinorUnitsOrUndefined(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.round(n * 100);
}

interface OrdersToolbarProps {
  value: OrdersFilterValues;
  onChange: (value: OrdersFilterValues) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function OrdersToolbar({ value, onChange, onRefresh, isRefreshing }: OrdersToolbarProps) {
  const hasActiveFilter = Boolean(
    value.search || value.status || value.minAmount || value.maxAmount || value.dateFrom || value.dateTo
  );

  function set<K extends keyof OrdersFilterValues>(key: K, next: OrdersFilterValues[K]) {
    onChange({ ...value, [key]: next });
  }

  return (
    <div className="glass-panel flex flex-col gap-3 rounded-2xl p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by order number, customer name, or email…"
            value={value.search}
            onChange={(e) => set("search", e.target.value)}
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-white/[0.02] py-2 pl-9 pr-3 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-[var(--border-strong)]"
          />
        </div>

        <select
          value={value.status}
          onChange={(e) => set("status", e.target.value as OrderStatus | "")}
          className="rounded-xl border border-[var(--border-subtle)] bg-white/[0.02] px-3 py-2 text-sm text-white outline-none focus:border-[var(--border-strong)]"
        >
          <option value="" className="bg-[var(--background-elevated)]">
            All statuses
          </option>
          {ORDER_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[var(--background-elevated)]">
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={value.sortOption}
          onChange={(e) => set("sortOption", e.target.value as OrderSortOption)}
          className="rounded-xl border border-[var(--border-subtle)] bg-white/[0.02] px-3 py-2 text-sm text-white outline-none focus:border-[var(--border-strong)]"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[var(--background-elevated)]">
              {opt.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Refresh"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border-subtle)] text-zinc-400 transition-colors hover:border-[var(--border-strong)] hover:text-white disabled:opacity-40"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
          <SlidersHorizontal className="h-3.5 w-3.5" /> Amount
        </span>
        <input
          type="number"
          min={0}
          step="0.01"
          placeholder="Min"
          value={value.minAmount}
          onChange={(e) => set("minAmount", e.target.value)}
          className="w-24 rounded-xl border border-[var(--border-subtle)] bg-white/[0.02] px-3 py-1.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-[var(--border-strong)]"
        />
        <span className="text-zinc-600">–</span>
        <input
          type="number"
          min={0}
          step="0.01"
          placeholder="Max"
          value={value.maxAmount}
          onChange={(e) => set("maxAmount", e.target.value)}
          className="w-24 rounded-xl border border-[var(--border-subtle)] bg-white/[0.02] px-3 py-1.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-[var(--border-strong)]"
        />

        <span className="ml-1 text-xs text-zinc-500">Date</span>
        <input
          type="date"
          value={value.dateFrom}
          onChange={(e) => set("dateFrom", e.target.value)}
          className="rounded-xl border border-[var(--border-subtle)] bg-white/[0.02] px-3 py-1.5 text-sm text-white outline-none focus:border-[var(--border-strong)] [color-scheme:dark]"
        />
        <span className="text-zinc-600">–</span>
        <input
          type="date"
          value={value.dateTo}
          onChange={(e) => set("dateTo", e.target.value)}
          className="rounded-xl border border-[var(--border-subtle)] bg-white/[0.02] px-3 py-1.5 text-sm text-white outline-none focus:border-[var(--border-strong)] [color-scheme:dark]"
        />

        {hasActiveFilter && (
          <button
            type="button"
            onClick={() => onChange(DEFAULT_ORDER_FILTERS)}
            className="ml-auto inline-flex items-center gap-1 rounded-xl border border-[var(--border-subtle)] px-3 py-1.5 text-xs font-medium text-zinc-400 hover:border-[var(--border-strong)] hover:text-white"
          >
            <X className="h-3.5 w-3.5" /> Clear filters
          </button>
        )}
      </div>
    </div>
  );
}

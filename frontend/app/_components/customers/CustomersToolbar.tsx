"use client";

import { RefreshCw, Search, X } from "lucide-react";
import type { CustomerStatus } from "@/lib/api/customers";
import { CUSTOMER_STATUS_OPTIONS } from "./customerMeta";

export interface CustomersFilterValues {
  search: string;
  status: CustomerStatus | "";
}

export const DEFAULT_CUSTOMER_FILTERS: CustomersFilterValues = {
  search: "",
  status: "",
};

interface CustomersToolbarProps {
  value: CustomersFilterValues;
  onChange: (value: CustomersFilterValues) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

/**
 * Deliberately just search + status. listCustomersQuerySchema
 * (customers.schemas.ts) accepts only `search` and `status` — no sort
 * param (the repository always orders by name asc) and no date range —
 * so unlike OrdersToolbar/ProductsToolbar there's nothing here that
 * would silently do nothing against the real backend.
 */
export function CustomersToolbar({ value, onChange, onRefresh, isRefreshing }: CustomersToolbarProps) {
  const hasActiveFilter = Boolean(value.search || value.status);

  function set<K extends keyof CustomersFilterValues>(key: K, next: CustomersFilterValues[K]) {
    onChange({ ...value, [key]: next });
  }

  return (
    <div className="glass-panel flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative min-w-[220px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          placeholder="Search by name, email, or phone…"
          value={value.search}
          onChange={(e) => set("search", e.target.value)}
          className="w-full rounded-xl border border-[var(--border-subtle)] bg-white/[0.02] py-2 pl-9 pr-3 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-[var(--border-strong)]"
        />
      </div>

      <select
        value={value.status}
        onChange={(e) => set("status", e.target.value as CustomerStatus | "")}
        className="rounded-xl border border-[var(--border-subtle)] bg-white/[0.02] px-3 py-2 text-sm text-white outline-none focus:border-[var(--border-strong)]"
      >
        <option value="" className="bg-[var(--background-elevated)]">
          All statuses
        </option>
        {CUSTOMER_STATUS_OPTIONS.map((opt) => (
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

      {hasActiveFilter && (
        <button
          type="button"
          onClick={() => onChange(DEFAULT_CUSTOMER_FILTERS)}
          className="inline-flex items-center gap-1 rounded-xl border border-[var(--border-subtle)] px-3 py-1.5 text-xs font-medium text-zinc-400 hover:border-[var(--border-strong)] hover:text-white sm:ml-auto"
        >
          <X className="h-3.5 w-3.5" /> Clear filters
        </button>
      )}
    </div>
  );
}

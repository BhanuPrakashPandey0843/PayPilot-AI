"use client";

import { useState } from "react";
import { Search, X, RefreshCw, ArrowDownWideNarrow, ArrowUpWideNarrow } from "lucide-react";
import type { ProductSortField, ProductSortOrder } from "@/lib/api/products";

export interface ProductFilterValues {
  search: string;
  /** "" = all, "true" = active only, "false" = inactive only. */
  isActive: "" | "true" | "false";
  /** "" = all, "true" = in stock, "false" = out of stock. */
  available: "" | "true" | "false";
  category: string;
  /** Major-unit decimal strings (e.g. "499") — converted to minor units
   * at the call site, same as the create/edit form. */
  minPrice: string;
  maxPrice: string;
  sort: ProductSortField;
  order: ProductSortOrder;
}

export const DEFAULT_PRODUCT_FILTERS: ProductFilterValues = {
  search: "",
  isActive: "",
  available: "",
  category: "",
  minPrice: "",
  maxPrice: "",
  sort: "createdAt",
  order: "desc",
};

interface ProductsToolbarProps {
  value: ProductFilterValues;
  onChange: (value: ProductFilterValues) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

/**
 * Search/filter/sort bar for GET /products. Every control here maps
 * directly to a real query param the backend accepts (search, category,
 * isActive, minPrice/maxPrice, available, sort, order) — no
 * frontend-only filtering of a fetched page. Category has no dedicated
 * "list of categories" endpoint, so it's free text (like AuditFilters'
 * resourceId field) rather than a fabricated dropdown.
 */
export function ProductsToolbar({ value, onChange, onRefresh, isRefreshing }: ProductsToolbarProps) {
  const [priceOpen, setPriceOpen] = useState(false);

  const hasActiveFilter = Boolean(
    value.search ||
      value.isActive ||
      value.available ||
      value.category ||
      value.minPrice ||
      value.maxPrice ||
      value.sort !== "createdAt" ||
      value.order !== "desc"
  );

  function toggleOrder() {
    onChange({ ...value, order: value.order === "asc" ? "desc" : "asc" });
  }

  return (
    <div className="glass-panel flex flex-col gap-3 rounded-2xl p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search products by name, description, category…"
            value={value.search}
            onChange={(e) => onChange({ ...value, search: e.target.value })}
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-white/[0.02] py-2 pl-9 pr-3 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-[var(--border-strong)]"
          />
        </div>

        <select
          value={value.isActive}
          onChange={(e) => onChange({ ...value, isActive: e.target.value as ProductFilterValues["isActive"] })}
          className="rounded-xl border border-[var(--border-subtle)] bg-white/[0.02] px-3 py-2 text-sm text-white outline-none focus:border-[var(--border-strong)]"
        >
          <option value="" className="bg-[var(--background-elevated)]">
            All statuses
          </option>
          <option value="true" className="bg-[var(--background-elevated)]">
            Active
          </option>
          <option value="false" className="bg-[var(--background-elevated)]">
            Inactive
          </option>
        </select>

        <select
          value={value.available}
          onChange={(e) => onChange({ ...value, available: e.target.value as ProductFilterValues["available"] })}
          className="rounded-xl border border-[var(--border-subtle)] bg-white/[0.02] px-3 py-2 text-sm text-white outline-none focus:border-[var(--border-strong)]"
        >
          <option value="" className="bg-[var(--background-elevated)]">
            Any availability
          </option>
          <option value="true" className="bg-[var(--background-elevated)]">
            In stock
          </option>
          <option value="false" className="bg-[var(--background-elevated)]">
            Out of stock
          </option>
        </select>

        <input
          type="text"
          placeholder="Category…"
          value={value.category}
          onChange={(e) => onChange({ ...value, category: e.target.value })}
          className="w-40 rounded-xl border border-[var(--border-subtle)] bg-white/[0.02] px-3 py-2 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-[var(--border-strong)]"
        />

        <button
          type="button"
          onClick={() => setPriceOpen((v) => !v)}
          className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
            priceOpen || value.minPrice || value.maxPrice
              ? "border-[var(--border-strong)] text-white"
              : "border-[var(--border-subtle)] text-zinc-400 hover:text-white"
          }`}
        >
          Price range
        </button>

        <div className="flex items-center gap-1">
          <select
            value={value.sort}
            onChange={(e) => onChange({ ...value, sort: e.target.value as ProductSortField })}
            className="rounded-xl border border-[var(--border-subtle)] bg-white/[0.02] px-3 py-2 text-sm text-white outline-none focus:border-[var(--border-strong)]"
          >
            <option value="createdAt" className="bg-[var(--background-elevated)]">
              Sort: Newest
            </option>
            <option value="price" className="bg-[var(--background-elevated)]">
              Sort: Price
            </option>
            <option value="name" className="bg-[var(--background-elevated)]">
              Sort: Name
            </option>
          </select>
          <button
            type="button"
            onClick={toggleOrder}
            aria-label={value.order === "asc" ? "Ascending" : "Descending"}
            title={value.order === "asc" ? "Ascending" : "Descending"}
            className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl border border-[var(--border-subtle)] text-zinc-400 hover:border-[var(--border-strong)] hover:text-white"
          >
            {value.order === "asc" ? (
              <ArrowUpWideNarrow className="h-4 w-4" />
            ) : (
              <ArrowDownWideNarrow className="h-4 w-4" />
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Refresh"
          title="Refresh"
          className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl border border-[var(--border-subtle)] text-zinc-400 hover:border-[var(--border-strong)] hover:text-white disabled:opacity-40"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </button>

        {hasActiveFilter && (
          <button
            type="button"
            onClick={() => onChange(DEFAULT_PRODUCT_FILTERS)}
            className="inline-flex items-center gap-1 rounded-xl border border-[var(--border-subtle)] px-3 py-2 text-xs font-medium text-zinc-400 hover:border-[var(--border-strong)] hover:text-white"
          >
            <X className="h-3.5 w-3.5" /> Clear filters
          </button>
        )}
      </div>

      {priceOpen && (
        <div className="flex flex-wrap items-center gap-2 border-t border-[var(--border-subtle)] pt-3">
          <span className="text-xs text-zinc-500">Price range</span>
          <input
            type="number"
            min={0}
            placeholder="Min"
            value={value.minPrice}
            onChange={(e) => onChange({ ...value, minPrice: e.target.value })}
            className="w-28 rounded-xl border border-[var(--border-subtle)] bg-white/[0.02] px-3 py-1.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-[var(--border-strong)]"
          />
          <span className="text-zinc-600">–</span>
          <input
            type="number"
            min={0}
            placeholder="Max"
            value={value.maxPrice}
            onChange={(e) => onChange({ ...value, maxPrice: e.target.value })}
            className="w-28 rounded-xl border border-[var(--border-subtle)] bg-white/[0.02] px-3 py-1.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-[var(--border-strong)]"
          />
        </div>
      )}
    </div>
  );
}

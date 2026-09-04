"use client";

import { X } from "lucide-react";
import type { OpportunityType, OpportunityStatus } from "@/lib/api/dashboard";
import { ALL_TYPES, ALL_STATUSES, TYPE_META, STATUS_META } from "./opportunityMeta";

export interface RevenueFilterValues {
  type: OpportunityType | "";
  status: OpportunityStatus | "";
  sort: "score" | "createdAt" | "estimatedRevenueImpact";
}

interface RevenueFiltersProps {
  value: RevenueFilterValues;
  onChange: (value: RevenueFilterValues) => void;
}

/** Filter/sort bar for GET /revenue/opportunities — every option here
 * maps directly to a real query param the backend accepts (type,
 * status, sort), matching AuditFilters' style/structure. */
export function RevenueFilters({ value, onChange }: RevenueFiltersProps) {
  const hasActiveFilter = Boolean(value.type || value.status);

  return (
    <div className="glass-panel flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:flex-wrap sm:items-center">
      <select
        value={value.status}
        onChange={(e) => onChange({ ...value, status: e.target.value as OpportunityStatus | "" })}
        className="rounded-xl border border-[var(--border-subtle)] bg-white/[0.02] px-3 py-2 text-sm text-white outline-none focus:border-[var(--border-strong)]"
      >
        <option value="" className="bg-[var(--background-elevated)]">
          All statuses
        </option>
        {ALL_STATUSES.map((s) => (
          <option key={s} value={s} className="bg-[var(--background-elevated)]">
            {STATUS_META[s].label}
          </option>
        ))}
      </select>

      <select
        value={value.type}
        onChange={(e) => onChange({ ...value, type: e.target.value as OpportunityType | "" })}
        className="rounded-xl border border-[var(--border-subtle)] bg-white/[0.02] px-3 py-2 text-sm text-white outline-none focus:border-[var(--border-strong)]"
      >
        <option value="" className="bg-[var(--background-elevated)]">
          All types
        </option>
        {ALL_TYPES.map((t) => (
          <option key={t} value={t} className="bg-[var(--background-elevated)]">
            {TYPE_META[t].label}
          </option>
        ))}
      </select>

      <select
        value={value.sort}
        onChange={(e) => onChange({ ...value, sort: e.target.value as RevenueFilterValues["sort"] })}
        className="rounded-xl border border-[var(--border-subtle)] bg-white/[0.02] px-3 py-2 text-sm text-white outline-none focus:border-[var(--border-strong)]"
      >
        <option value="score" className="bg-[var(--background-elevated)]">
          Sort: Priority score
        </option>
        <option value="estimatedRevenueImpact" className="bg-[var(--background-elevated)]">
          Sort: Estimated value
        </option>
        <option value="createdAt" className="bg-[var(--background-elevated)]">
          Sort: Newest
        </option>
      </select>

      {hasActiveFilter && (
        <button
          type="button"
          onClick={() => onChange({ type: "", status: "", sort: value.sort })}
          className="inline-flex items-center gap-1 rounded-xl border border-[var(--border-subtle)] px-3 py-2 text-xs font-medium text-zinc-400 hover:border-[var(--border-strong)] hover:text-white"
        >
          <X className="h-3.5 w-3.5" /> Clear filters
        </button>
      )}
    </div>
  );
}

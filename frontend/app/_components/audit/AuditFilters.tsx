"use client";

import { Search, X } from "lucide-react";
import type { AuditResourceType } from "@/lib/api/audit";

const RESOURCE_TYPES: AuditResourceType[] = [
  "user",
  "organization",
  "membership",
  "role",
  "permission",
  "product",
  "customer",
  "order",
  "payment",
  "payment_attempt",
  "checkout",
  "webhook_event",
  "ai_action",
  "revenue_opportunity",
  "analytics",
];

/** A representative sample of the real AuditEventType enum
 * (backend/src/utils/audit.ts) offered as datalist suggestions — the
 * action filter itself accepts any exact string GET /audit will match,
 * this is just to save typing the common ones. */
const COMMON_ACTIONS = [
  "USER_LOGIN_SUCCESS",
  "USER_LOGIN_FAILED",
  "PAYMENT_CAPTURED",
  "PAYMENT_FAILED",
  "POLICY_APPROVED",
  "POLICY_REJECTED",
  "AI_ACTION_EXECUTED",
  "AI_ACTION_FAILED",
  "AI_TOOL_CALLED",
  "REVENUE_OPPORTUNITY_APPROVED",
  "REVENUE_OPPORTUNITY_REJECTED",
  "ORDER_CREATED",
  "ORDER_STATUS_CHANGED",
  "WEBHOOK_RECEIVED",
  "PERMISSION_CHECK_DENIED",
];

export interface AuditFilterValues {
  resourceType: string;
  action: string;
  resourceId: string;
}

interface AuditFiltersProps {
  value: AuditFilterValues;
  onChange: (value: AuditFilterValues) => void;
}

export function AuditFilters({ value, onChange }: AuditFiltersProps) {
  const hasActiveFilter = Boolean(value.resourceType || value.action || value.resourceId);

  return (
    <div className="glass-panel flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative min-w-[220px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          placeholder="Search by resource ID…"
          value={value.resourceId}
          onChange={(e) => onChange({ ...value, resourceId: e.target.value })}
          className="w-full rounded-xl border border-[var(--border-subtle)] bg-white/[0.02] py-2 pl-9 pr-3 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-[var(--border-strong)]"
        />
      </div>

      <select
        value={value.resourceType}
        onChange={(e) => onChange({ ...value, resourceType: e.target.value })}
        className="rounded-xl border border-[var(--border-subtle)] bg-white/[0.02] px-3 py-2 text-sm text-white outline-none focus:border-[var(--border-strong)]"
      >
        <option value="">All resource types</option>
        {RESOURCE_TYPES.map((rt) => (
          <option key={rt} value={rt} className="bg-[var(--background-elevated)]">
            {rt.replace(/_/g, " ")}
          </option>
        ))}
      </select>

      <input
        list="audit-action-suggestions"
        type="text"
        placeholder="Action (e.g. PAYMENT_CAPTURED)"
        value={value.action}
        onChange={(e) => onChange({ ...value, action: e.target.value.toUpperCase() })}
        className="w-56 rounded-xl border border-[var(--border-subtle)] bg-white/[0.02] px-3 py-2 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-[var(--border-strong)]"
      />
      <datalist id="audit-action-suggestions">
        {COMMON_ACTIONS.map((a) => (
          <option key={a} value={a} />
        ))}
      </datalist>

      {hasActiveFilter && (
        <button
          type="button"
          onClick={() => onChange({ resourceType: "", action: "", resourceId: "" })}
          className="inline-flex items-center gap-1 rounded-xl border border-[var(--border-subtle)] px-3 py-2 text-xs font-medium text-zinc-400 hover:border-[var(--border-strong)] hover:text-white"
        >
          <X className="h-3.5 w-3.5" /> Clear filters
        </button>
      )}
    </div>
  );
}

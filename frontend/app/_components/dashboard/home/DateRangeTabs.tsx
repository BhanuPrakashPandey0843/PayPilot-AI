"use client";

import type { DateRange } from "@/lib/api/dashboard";

const OPTIONS: { value: DateRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "90d", label: "90D" },
];

/**
 * Shared range switcher for every analytics-backed section on Dashboard
 * Home. Lives at the page level (see DashboardHome.tsx) and is passed
 * down, rather than each section owning its own range, so "30D" means
 * the same thing everywhere on the page at once.
 */
export function DateRangeTabs({
  value,
  onChange,
}: {
  value: DateRange;
  onChange: (range: DateRange) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Date range"
      className="inline-flex items-center gap-0.5 rounded-full border border-[var(--border-subtle)] bg-white/[0.02] p-1"
    >
      {OPTIONS.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              active
                ? "bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-cyan)] text-white shadow-[0_4px_16px_-4px_rgba(34,211,238,0.5)]"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

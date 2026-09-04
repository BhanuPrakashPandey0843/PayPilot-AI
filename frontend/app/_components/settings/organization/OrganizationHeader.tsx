"use client";

import { Building2 } from "lucide-react";

/**
 * Plain section header - same restrained style as
 * SecurityPageHeader.tsx (title + subtitle, no glass-panel hero), for
 * visual consistency across the /settings/* pages.
 */
export function OrganizationHeader() {
  return (
    <div>
      <p className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-white/[0.03] px-3 py-1 text-xs font-medium text-[var(--accent-cyan)]">
        <Building2 className="h-3 w-3" /> Settings
      </p>
      <h1 className="mt-4 text-2xl font-semibold text-white sm:text-3xl">Organization</h1>
      <p className="mt-2 max-w-lg text-sm text-zinc-400">
        Manage your workspace name, currency, and timezone.
      </p>
    </div>
  );
}

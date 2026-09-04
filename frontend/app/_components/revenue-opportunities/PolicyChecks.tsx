"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import type { PolicyCheck } from "./opportunityMeta";

const ICON = { PASS: CheckCircle2, FAIL: XCircle } as const;
const COLOR = { PASS: "text-[var(--accent-emerald)]", FAIL: "text-[var(--accent-rose)]" } as const;

/**
 * Renders action-policy.service.ts's evaluateExecutionPolicy() checks
 * verbatim (same visual language as
 * app/_components/dashboard/commerce/PolicyChecklist.tsx, but typed to
 * this module's ApiError.details.checks shape instead of importing that
 * component's incompatible commerce PolicyResult type). Every line here
 * is a real, traceable rule returned by the backend on a 422 — never a
 * fabricated or guessed reason.
 */
export function PolicyChecks({ checks }: { checks: PolicyCheck[] }) {
  return (
    <div className="space-y-1.5">
      {checks.map((check) => {
        const Icon = ICON[check.status];
        return (
          <div key={check.name} className="flex items-start gap-2 text-[11px]">
            <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${COLOR[check.status]}`} />
            <span className="text-zinc-400">{check.message}</span>
          </div>
        );
      })}
    </div>
  );
}

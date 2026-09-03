"use client";

import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import type { PolicyResult } from "@/lib/api/commerce";

const ICON = {
  PASS: CheckCircle2,
  WARNING: AlertTriangle,
  FAIL: XCircle,
} as const;

const COLOR = {
  PASS: "text-[var(--accent-emerald)]",
  WARNING: "text-[var(--accent-amber)]",
  FAIL: "text-[var(--accent-rose)]",
} as const;

/**
 * Renders policy.service.ts's checkPolicies() output verbatim — every
 * line is a real, traceable rule (inventory, active status, budget),
 * never a generic "policy passed" placeholder.
 */
export function PolicyChecklist({ policy }: { policy: PolicyResult }) {
  return (
    <div className="space-y-1.5">
      {policy.checks.map((check) => {
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

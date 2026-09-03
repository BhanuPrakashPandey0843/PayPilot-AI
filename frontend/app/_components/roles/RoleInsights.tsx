"use client";

import { Sparkles } from "lucide-react";
import { formatRoleLabel, PERMISSION_DESCRIPTIONS, ROLE_NAMES, type RoleName } from "@/lib/permissions";
import { buildRoleInsight, ROLE_ACCENT } from "./roleMeta";

/** "AI explains what each role can do" — genuinely computed from the
 * same permission data as the matrix (buildRoleInsight diffs a role's
 * grants against the sensitive-permission list), not hand-written copy
 * per role, so it can't drift from the matrix above it. */
export function RoleInsights() {
  const insightRoles = ROLE_NAMES.filter((r): r is RoleName => r !== "ORG_ADMIN");

  return (
    <div className="rounded-3xl border border-[var(--border-subtle)] bg-white/[0.02] p-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[var(--accent-violet)]" />
        <p className="text-sm font-medium text-white">What each role can and can&apos;t do</p>
      </div>
      <p className="mt-1 text-xs text-zinc-500">
        Derived from the permission matrix above — ORG_ADMIN has every permission, so it&apos;s omitted here.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {insightRoles.map((role) => {
          const insight = buildRoleInsight(role);
          const color = ROLE_ACCENT[role];
          const canSample = insight.can.slice(0, 3);
          const cannotSample = insight.cannot.slice(0, 3);

          return (
            <div key={role} className="rounded-2xl border border-[var(--border-subtle)] bg-white/[0.02] p-4">
              <p className="text-sm font-medium text-white" style={{ color }}>
                {formatRoleLabel(role)}
              </p>
              {canSample.length > 0 && (
                <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                  <span className="text-zinc-200">Can</span>{" "}
                  {canSample.map((p, i) => (
                    <span key={p}>
                      {i > 0 && (i === canSample.length - 1 ? " and " : ", ")}
                      {PERMISSION_DESCRIPTIONS[p].replace(/\.$/, "").toLowerCase()}
                    </span>
                  ))}
                  .
                </p>
              )}
              {cannotSample.length > 0 && (
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
                  <span className="text-zinc-400">Cannot</span>{" "}
                  {cannotSample.map((p, i) => (
                    <span key={p}>
                      {i > 0 && (i === cannotSample.length - 1 ? " or " : ", ")}
                      {PERMISSION_DESCRIPTIONS[p].replace(/\.$/, "").toLowerCase()}
                    </span>
                  ))}
                  .
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

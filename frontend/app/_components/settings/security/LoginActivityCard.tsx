"use client";

import { History } from "lucide-react";
import type { UseApiResourceResult } from "@/hooks/useApiResource";
import type { AuditEvent } from "@/lib/api/audit";
import { getEventMeta } from "../../audit/eventMeta";
import { relativeTime } from "../../dashboard/home/formatters";
import { ErrorNote, ListRowSkeleton } from "../../dashboard/home/Skeletons";

interface LoginActivityCardProps {
  result: UseApiResourceResult<AuditEvent[]>;
}

/**
 * Real login history only — GET /audit?resourceType=user&resourceId=
 * <selfId>&action=USER_LOGIN_SUCCESS (see hooks/useSecuritySettings.ts's
 * useLoginActivity doc comment for exactly why only USER_LOGIN_SUCCESS
 * is queryable this way). Failed-login attempts, password changes, and
 * 2FA events aren't shown because they either don't exist yet
 * (password change, 2FA — see PasswordSecurityCard / TwoFactorCard) or
 * can't be attributed to this specific account server-side (failed
 * logins carry no resourceId) — per the brief, that means omitting
 * them rather than fabricating rows.
 */
export function LoginActivityCard({ result }: LoginActivityCardProps) {
  const events = result.data ?? [];

  return (
    <div className="rounded-3xl border border-[var(--border-subtle)] bg-white/[0.02] p-6">
      <div className="flex items-center gap-2.5">
        <History className="h-4 w-4 text-[var(--accent-blue)]" />
        <div>
          <p className="text-sm font-medium text-white">Recent login activity</p>
          <p className="text-xs text-zinc-500">Your most recent successful sign-ins to PayPilot AI.</p>
        </div>
      </div>

      {result.error && (
        <div className="mt-4">
          <ErrorNote message={result.error} onRetry={result.refetch} />
        </div>
      )}

      {!result.error && result.isLoading && (
        <div className="mt-4 space-y-2">
          <ListRowSkeleton />
          <ListRowSkeleton />
          <ListRowSkeleton />
        </div>
      )}

      {!result.isLoading && !result.error && events.length === 0 && (
        <p className="mt-4 rounded-2xl border border-dashed border-[var(--border-subtle)] p-6 text-center text-xs text-zinc-500">
          No login activity recorded yet.
        </p>
      )}

      {!result.isLoading && !result.error && events.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {events.map((event) => {
            const meta = getEventMeta(event.action);
            const Icon = meta.icon;
            return (
              <li
                key={event.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border-subtle)] bg-white/[0.015] px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: `color-mix(in srgb, ${meta.color} 16%, transparent)` }}
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color: meta.color }} />
                  </span>
                  <span className="truncate text-sm text-zinc-200">{meta.label}</span>
                </div>
                <span className="shrink-0 text-xs text-zinc-500" title={new Date(event.createdAt).toLocaleString("en-IN")}>
                  {relativeTime(event.createdAt)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

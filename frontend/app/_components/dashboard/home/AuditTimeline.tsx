"use client";

import Link from "next/link";
import { ArrowUpRight, ScrollText, User, Bot, Cog } from "lucide-react";
import type { UseApiResourceResult } from "@/hooks/useApiResource";
import type { AuditListResult, AuditEvent } from "@/lib/api/dashboard";
import { relativeTime } from "./formatters";
import { ListRowSkeleton, ErrorNote } from "./Skeletons";

const ACTOR_ICON: Record<AuditEvent["actorType"], typeof User> = {
  USER: User,
  AI_AGENT: Bot,
  SYSTEM: Cog,
};

/** Step 13 — compact audit timeline for the home page (full searchable/
 * filterable view lives on /audit-logs). Sourced from GET /audit. */
export function AuditTimeline({ audit }: { audit: UseApiResourceResult<AuditListResult> }) {
  return (
    <div className="rounded-3xl border border-[var(--border-subtle)] bg-white/[0.02] p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ScrollText className="h-4 w-4 text-zinc-400" />
          <p className="text-sm font-medium text-white">Audit timeline</p>
        </div>
        <Link
          href="/audit-logs"
          className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-white"
        >
          View all <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-4 space-y-0">
        {audit.error && <ErrorNote message={audit.error} onRetry={audit.refetch} />}

        {!audit.error && audit.isLoading && (
          <>
            <ListRowSkeleton />
            <ListRowSkeleton />
          </>
        )}

        {!audit.isLoading && audit.data && audit.data.rows.length === 0 && (
          <p className="rounded-2xl border border-dashed border-[var(--border-subtle)] p-6 text-center text-sm text-zinc-500">
            No audit events yet.
          </p>
        )}

        {audit.data?.rows.map((event, i) => {
          const Icon = ACTOR_ICON[event.actorType];
          const isLast = i === (audit.data?.rows.length ?? 0) - 1;
          return (
            <div key={event.id} className="relative flex gap-3 pb-5 last:pb-0">
              {!isLast && <span className="absolute left-[15px] top-8 h-full w-px bg-[var(--border-subtle)]" />}
              <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--background-elevated)]">
                <Icon className="h-3.5 w-3.5 text-zinc-400" />
              </span>
              <div className="min-w-0 pt-1">
                <p className="text-sm text-zinc-200">
                  <span className="font-medium text-white">{event.action}</span>{" "}
                  <span className="text-zinc-500">on {event.resourceType}</span>
                </p>
                {event.reason && <p className="mt-0.5 truncate text-xs text-zinc-500">{event.reason}</p>}
                <p className="mt-0.5 text-[11px] text-zinc-600">{relativeTime(event.createdAt)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

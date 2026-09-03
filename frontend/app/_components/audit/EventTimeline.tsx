"use client";

import { ScrollText } from "lucide-react";
import type { UseApiResourceResult } from "@/hooks/useApiResource";
import type { AuditListResult, AuditEvent } from "@/lib/api/audit";
import { getEventMeta, ACTOR_ICON, formatResourceType } from "./eventMeta";
import { relativeTime } from "../dashboard/home/formatters";
import { ListRowSkeleton, ErrorNote } from "../dashboard/home/Skeletons";

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (sameDay(d, today)) return "Today";
  if (sameDay(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function groupByDay(rows: AuditEvent[]): Array<[string, AuditEvent[]]> {
  const groups = new Map<string, AuditEvent[]>();
  for (const row of rows) {
    const label = dayLabel(row.createdAt);
    const existing = groups.get(label);
    if (existing) existing.push(row);
    else groups.set(label, [row]);
  }
  return Array.from(groups.entries());
}

interface EventTimelineProps {
  recentWindow: UseApiResourceResult<AuditListResult>;
  /** Cap how many events render in the timeline (it's meant as a quick
   * chronological skim, not the full record — the table below is). */
  limit?: number;
}

/** Chronological timeline grouped by day, colour-coded by event category
 * (see eventMeta.ts). Sourced from the same recent-window fetch the
 * summary cards use. */
export function EventTimeline({ recentWindow, limit = 20 }: EventTimelineProps) {
  const rows = recentWindow.data?.rows.slice(0, limit) ?? [];
  const groups = groupByDay(rows);

  return (
    <div className="rounded-3xl border border-[var(--border-subtle)] bg-white/[0.02] p-6">
      <div className="flex items-center gap-2">
        <ScrollText className="h-4 w-4 text-zinc-400" />
        <p className="text-sm font-medium text-white">Recent activity</p>
      </div>

      <div className="mt-4">
        {recentWindow.error && <ErrorNote message={recentWindow.error} onRetry={recentWindow.refetch} />}

        {!recentWindow.error && recentWindow.isLoading && (
          <div className="space-y-2">
            <ListRowSkeleton />
            <ListRowSkeleton />
            <ListRowSkeleton />
          </div>
        )}

        {!recentWindow.isLoading && rows.length === 0 && !recentWindow.error && (
          <p className="rounded-2xl border border-dashed border-[var(--border-subtle)] p-6 text-center text-sm text-zinc-500">
            No audit events yet — actions will appear here as your workspace is used.
          </p>
        )}

        {groups.map(([label, events]) => (
          <div key={label} className="mb-6 last:mb-0">
            <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-zinc-500">{label}</p>
            <div className="space-y-0">
              {events.map((event, i) => {
                const meta = getEventMeta(event.action);
                const Icon = meta.icon;
                const ActorIcon = ACTOR_ICON[event.actorType];
                const isLast = i === events.length - 1;
                return (
                  <div key={event.id} className="relative flex gap-3 pb-4 last:pb-0">
                    {!isLast && (
                      <span className="absolute left-[15px] top-8 h-full w-px bg-[var(--border-subtle)]" />
                    )}
                    <span
                      className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border"
                      style={{
                        borderColor: "var(--border-subtle)",
                        background: `color-mix(in srgb, ${meta.color} 14%, var(--background-elevated))`,
                      }}
                    >
                      <Icon className="h-3.5 w-3.5" style={{ color: meta.color }} />
                    </span>
                    <div className="min-w-0 flex-1 pt-1">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className="text-sm font-medium text-white">{meta.label}</span>
                        <span className="text-xs text-zinc-500">on {formatResourceType(event.resourceType)}</span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-zinc-600">
                        <ActorIcon className="h-3 w-3" />
                        <span>{event.actorType === "USER" ? "User" : event.actorType === "AI_AGENT" ? "AI Agent" : "System"}</span>
                        <span>·</span>
                        <span>{relativeTime(event.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

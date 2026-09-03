"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import type { UseApiResourceResult } from "@/hooks/useApiResource";
import type { AuditListResult } from "@/lib/api/audit";
import { getEventMeta, ACTOR_ICON, formatResourceType } from "./eventMeta";
import { relativeTime } from "../dashboard/home/formatters";
import { ErrorNote } from "../dashboard/home/Skeletons";

interface AuditTableProps {
  result: UseApiResourceResult<AuditListResult>;
  page: number;
  onPageChange: (page: number) => void;
}

/** Full searchable/filterable/paginated audit table. Each row expands
 * inline (rather than a separate drawer component) to show the actor,
 * target, reason, and raw metadata JSON for that event — everything
 * GET /audit actually returns, nothing invented (no "confidence" or
 * "policy result" fields exist on the backend's audit_logs row; when a
 * caller happened to log those into `metadata`, they'll simply show up
 * in the JSON block below). */
export function AuditTable({ result, page, onPageChange }: AuditTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const rows = result.data?.rows ?? [];
  const pageMeta = result.data?.meta;

  return (
    <div className="rounded-3xl border border-[var(--border-subtle)] bg-white/[0.02] p-6">
      <p className="text-sm font-medium text-white">All events</p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] text-xs uppercase tracking-wide text-zinc-500">
              <th className="w-8 py-2 pr-2"></th>
              <th className="py-2 pr-4 font-medium">Event</th>
              <th className="py-2 pr-4 font-medium">Resource</th>
              <th className="py-2 pr-4 font-medium">Actor</th>
              <th className="py-2 pr-4 font-medium">Time</th>
            </tr>
          </thead>
          <tbody>
            {result.error && (
              <tr>
                <td colSpan={5} className="py-4">
                  <ErrorNote message={result.error} onRetry={result.refetch} />
                </td>
              </tr>
            )}

            {!result.error && result.isLoading &&
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-[var(--border-subtle)]/60">
                  <td colSpan={5} className="py-3">
                    <div className="animate-shimmer h-5 w-full rounded-lg bg-white/[0.03]" />
                  </td>
                </tr>
              ))}

            {!result.isLoading && !result.error && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-sm text-zinc-500">
                  No events match these filters.
                </td>
              </tr>
            )}

            {!result.isLoading &&
              rows.map((event) => {
                const meta = getEventMeta(event.action);
                const Icon = meta.icon;
                const ActorIcon = ACTOR_ICON[event.actorType];
                const isExpanded = expandedId === event.id;
                return (
                  <Fragment key={event.id}>
                    <tr
                      onClick={() => setExpandedId(isExpanded ? null : event.id)}
                      className="cursor-pointer border-b border-[var(--border-subtle)]/60 transition-colors hover:bg-white/[0.03]"
                    >
                      <td className="py-3 pr-2">
                        <ChevronDown
                          className={`h-4 w-4 text-zinc-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
                            style={{ background: `color-mix(in srgb, ${meta.color} 16%, transparent)` }}
                          >
                            <Icon className="h-3.5 w-3.5" style={{ color: meta.color }} />
                          </span>
                          <span className="text-zinc-200">{meta.label}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-zinc-400">
                        {formatResourceType(event.resourceType)}
                        {event.resourceId ? (
                          <span className="ml-1 text-zinc-600">#{event.resourceId.slice(0, 8)}</span>
                        ) : null}
                      </td>
                      <td className="py-3 pr-4">
                        <span className="inline-flex items-center gap-1.5 text-zinc-400">
                          <ActorIcon className="h-3.5 w-3.5" />
                          {event.actorType === "USER" ? "User" : event.actorType === "AI_AGENT" ? "AI Agent" : "System"}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-zinc-500">{relativeTime(event.createdAt)}</td>
                    </tr>
                    {isExpanded && (
                      <tr className="border-b border-[var(--border-subtle)]/60 bg-white/[0.015]">
                        <td colSpan={5} className="px-4 py-4">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2 text-xs">
                              <Detail label="Event ID" value={event.id} mono />
                              <Detail label="Actor ID" value={event.actorId ?? "—"} mono />
                              <Detail label="Resource ID" value={event.resourceId || "—"} mono />
                              <Detail label="Timestamp" value={new Date(event.createdAt).toLocaleString("en-IN")} />
                              <Detail label="Reason" value={event.reason || "—"} />
                            </div>
                            <div>
                              <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                                Metadata
                              </p>
                              <pre className="max-h-48 overflow-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--background-elevated)] p-3 text-[11px] leading-relaxed text-zinc-400">
                                {JSON.stringify(event.metadata ?? {}, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
          </tbody>
        </table>
      </div>

      {pageMeta && pageMeta.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
          <span>
            Page {pageMeta.page} of {pageMeta.totalPages} · {pageMeta.total} events
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] px-2.5 py-1.5 font-medium text-zinc-300 hover:border-[var(--border-strong)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </button>
            <button
              type="button"
              disabled={page >= pageMeta.totalPages}
              onClick={() => onPageChange(page + 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] px-2.5 py-1.5 font-medium text-zinc-300 hover:border-[var(--border-strong)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</p>
      <p className={`mt-0.5 break-all text-zinc-300 ${mono ? "font-mono text-[11px]" : ""}`}>{value}</p>
    </div>
  );
}

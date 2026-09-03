"use client";

import { ScrollText, Sparkles } from "lucide-react";
import type { UseApiResourceResult } from "@/hooks/useApiResource";
import { formatNumber } from "../dashboard/home/formatters";
import { SkeletonBlock } from "../dashboard/home/Skeletons";

interface AuditHeroProps {
  organizationName: string;
  totalEvents: UseApiResourceResult<number>;
}

/**
 * Audit Center hero. The one number in the header — total event count —
 * is real (GET /audit?limit=1's meta.total), not decorative; everything
 * else is static copy, matching what the backend can actually back up
 * (no live-event-count websocket, no computed "explainability score").
 */
export function AuditHero({ organizationName, totalEvents }: AuditHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-[var(--border-subtle)] p-6 sm:p-10">
      <div className="glass-panel absolute inset-0 -z-20" />
      <div className="bg-grid absolute inset-0 -z-10 opacity-60" />
      <div
        className="glow-blob animate-mesh-drift absolute -right-20 -top-20 -z-10 h-72 w-72 rounded-full"
        style={{ background: "var(--accent-cyan)" }}
      />
      <div
        className="glow-blob animate-mesh-drift absolute -bottom-28 left-1/4 -z-10 h-64 w-64 rounded-full"
        style={{ background: "var(--accent-violet)", animationDelay: "-6s" }}
      />

      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-white/[0.03] px-3 py-1 text-xs font-medium text-[var(--accent-cyan)]">
            <ScrollText className="h-3 w-3" /> Audit Center
          </p>
          <h1 className="mt-4 text-2xl font-semibold text-white sm:text-3xl">
            Every action, fully traceable
          </h1>
          <p className="mt-2 max-w-lg text-sm text-zinc-400">
            Every login, policy decision, payment transition, and AI action inside{" "}
            <span className="text-zinc-200">{organizationName}</span>&apos;s workspace lands here — who or what
            did it, and what it touched.
          </p>
        </div>

        <div className="glass-panel flex shrink-0 items-center gap-3 self-start rounded-2xl px-5 py-4 sm:self-auto">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-cyan)]/15">
            <Sparkles className="h-4 w-4 text-[var(--accent-cyan)]" />
          </span>
          <div>
            {totalEvents.isLoading || totalEvents.data === null ? (
              <SkeletonBlock className="h-6 w-16" />
            ) : (
              <p className="text-xl font-semibold text-white">{formatNumber(totalEvents.data)}</p>
            )}
            <p className="text-[11px] text-zinc-500">Total events logged</p>
          </div>
        </div>
      </div>
    </section>
  );
}

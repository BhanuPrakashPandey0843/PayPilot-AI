"use client";

import {
  CheckCircle2,
  Clock,
  Mail,
  Users,
  Ban,
  Wrench,
  ArrowRight,
} from "lucide-react";
import type { UseApiResourceResult } from "@/hooks/useApiResource";
import type { TeamMemberRow } from "@/lib/api/team";
import { ErrorNote, KpiCardSkeleton } from "../dashboard/home/Skeletons";

interface TeamSummaryCardsProps {
  result: UseApiResourceResult<TeamMemberRow[]>;
  /** True when the backend has a list-members API (today: false). */
  hasMemberListApi: boolean;
  /** True when the backend has invite API (today: false). */
  hasInviteApi: boolean;
  /** True when role change API exists (today: false). */
  hasRoleChangeApi: boolean;
}

interface Kpi {
  label: string;
  icon: typeof Users;
  color: string;
  value: number | null;
  /** Override the "N" formatter, e.g. "0 / 0 seats" */
  format?: (n: number) => string;
}

/**
 * Only metrics we can compute HONESTLY from the only data available:
 *
 *   Total members      = rows.length (always 1 for now; no list API).
 *   Active members     = rows.filter(m => membershipStatus===active).length
 *   Pending invites    = rows.filter(m => membershipStatus===invited)
 *                        — this is ALWAYS 0 right now because:
 *                        (a) no invitations schema on the backend,
 *                        (b) no invite API to actually create pending rows.
 *   Disabled/Suspended = same — we count them from real data only.
 *
 * NEVER invent arbitrary "seat limits" or "3 of 10 used" style counts:
 * the organizations schema (backend/db/schema/organizations.ts) has NO
 * seat_limit/member_limit column — displaying such a number would be a
 * fabrication, not a dashboard.
 *
 * "Seats" is always shown as "Unlimited" with a "Coming soon" chip, so
 * it's clear the org can grow freely today and a quota feature may
 * arrive later; never a fabricated ratio.
 */
export function TeamSummaryCards({
  result,
  hasMemberListApi,
  hasInviteApi,
  hasRoleChangeApi,
}: TeamSummaryCardsProps) {
  const rows = result.data ?? [];
  const error = result.error;

  if (error && !result.data) {
    return <ErrorNote message={error} onRetry={result.refetch} />;
  }

  const kpis: Kpi[] = [
    {
      label: "Total members",
      icon: Users,
      color: "var(--accent-blue)",
      value: result.isLoading ? null : rows.length,
    },
    {
      label: "Active",
      icon: CheckCircle2,
      color: "var(--accent-emerald)",
      value: result.isLoading
        ? null
        : rows.filter((r) => r.membershipStatus === "active").length,
    },
    {
      label: "Pending invites",
      icon: Mail,
      color: "var(--accent-amber)",
      value: result.isLoading ? null : rows.filter((r) => r.membershipStatus === "invited").length,
    },
    {
      label: "Inactive",
      icon: Clock,
      color: "var(--accent-rose)",
      value: result.isLoading
        ? null
        : rows.filter((r) => r.membershipStatus === "suspended" || r.membershipStatus === "removed" || r.userStatus !== "active")
            .length,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map((k) =>
          result.isLoading || k.value === null ? (
            <KpiCardSkeleton key={k.label} />
          ) : (
            <div
              key={k.label}
              className="group relative overflow-hidden rounded-3xl border border-[var(--border-subtle)] bg-white/[0.02] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:bg-white/[0.04]"
            >
              <div
                className="absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-25"
                style={{ background: k.color }}
              />
              <span
                className="flex h-8 w-8 items-center justify-center rounded-xl"
                style={{ background: `color-mix(in srgb, ${k.color} 16%, transparent)` }}
              >
                <k.icon className="h-4 w-4" style={{ color: k.color }} />
              </span>
              <p className="mt-3 text-xl font-semibold text-white">
                {k.format ? k.format(k.value) : k.value}
              </p>
              <p className="text-xs text-zinc-500">{k.label}</p>
            </div>
          )
        )}
      </div>

      {/* Capability honesty banner. Since 3 of 4 APIs the Team page
          would ideally use are not present, this is the single most
          important card on the page: tells the merchant what the
          backend can actually do vs what is still coming. */}
      <div className="rounded-3xl border border-[var(--border-subtle)] bg-white/[0.02] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.04]">
              <Wrench className="h-4 w-4 text-zinc-500" />
            </span>
            <div>
              <p className="text-sm font-medium text-zinc-200">Team management APIs</p>
              <p className="mt-1 max-w-2xl text-xs text-zinc-500">
                Today only <span className="font-mono text-zinc-300">GET /auth/me</span>{" "}
                returns the current user. Additional routes for listing all team members,
                sending invitations, changing roles, and removing members need to land in
                the backend before this page can show data beyond your own account.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
            <CapabilityChip label="View members" ok={hasMemberListApi} />
            <CapabilityChip label="Invite member" ok={hasInviteApi} />
            <CapabilityChip label="Change role" ok={hasRoleChangeApi} />
            <CapabilityChip label="Remove member" ok={false} />
          </div>
        </div>
      </div>
    </div>
  );
}

function CapabilityChip({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div
      className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-2 ${
        ok
          ? "border-[var(--accent-emerald)]/30 bg-[var(--accent-emerald)]/[0.06] text-[var(--accent-emerald)]"
          : "border-[var(--border-subtle)] bg-white/[0.02] text-zinc-500"
      }`}
    >
      {ok ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <Ban className="h-3.5 w-3.5" />
      )}
      <span className="font-medium">{label}</span>
      {!ok && (
        <>
          <ArrowRight className="mx-1 h-3 w-3 opacity-60" />
          <span className="text-[10px] uppercase tracking-wide opacity-75">Coming soon</span>
        </>
      )}
    </div>
  );
}

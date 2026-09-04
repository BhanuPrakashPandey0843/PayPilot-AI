"use client";

import { Users } from "lucide-react";

interface TeamHeroProps {
  organizationName: string;
  totalMembers: number;
  hasMemberApi: boolean;
}

/**
 * Page header section, following the exact glass-panel + drifting-glow
 * pattern of PaymentsHero / OrdersHero / RolesHero / ProductsHero.
 *
 * Unlike the Payments / Orders pages, no primary CTA like "Create
 * payment" or "Add product" makes sense here yet because the backend
 * has ZERO team-write routes registered (check backend/src/index.ts).
 * Instead we show an "Invite member" button that routes through an
 * honest modal: it explains exactly what backend endpoints are missing
 * so the merchant knows what work is still needed, rather than clicking
 * and watching a fake success toast.
 *
 * Summary stat (N members) is drawn from the ONLY row we can truthfully
 * render: the current user. When the member list API lands and returns
 * multiple rows, totalMembers updates automatically.
 */
export function TeamHero({ organizationName, totalMembers, hasMemberApi }: TeamHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-[var(--border-subtle)] p-6 sm:p-10">
      <div className="glass-panel absolute inset-0 -z-20" />
      <div className="bg-grid absolute inset-0 -z-10 opacity-60" />
      <div
        className="glow-blob animate-mesh-drift absolute -right-20 -top-20 -z-10 h-72 w-72 rounded-full"
        style={{ background: "var(--accent-emerald)" }}
      />
      <div
        className="glow-blob animate-mesh-drift absolute -bottom-28 left-1/4 -z-10 h-64 w-64 rounded-full"
        style={{ background: "var(--accent-violet)", animationDelay: "-6s" }}
      />

      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-white/[0.03] px-3 py-1 text-xs font-medium text-[var(--accent-blue)]">
            <Users className="h-3 w-3" /> Organization
          </p>
          <h1 className="mt-4 text-2xl font-semibold text-white sm:text-3xl">Team</h1>
          <p className="mt-2 max-w-lg text-sm text-zinc-400">
            Manage your PayPilot AI organization members and access across{" "}
            <span className="text-zinc-200">{organizationName}</span>.
          </p>
        </div>

        <div className="glass-panel flex shrink-0 gap-5 self-start rounded-2xl px-5 py-4 sm:self-auto">
          <div>
            <p className="text-xl font-semibold text-white">{totalMembers}</p>
            <p className="text-[11px] text-zinc-500">Team members</p>
          </div>
          <div className="w-px bg-[var(--border-subtle)]" />
          <div>
            <p className="text-xl font-semibold text-white">
              {hasMemberApi ? "ON" : "1 of 2"}
            </p>
            <p className="text-[11px] text-zinc-500">
              {hasMemberApi ? "APIs live" : "APIs active"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { ShieldCheck } from "lucide-react";
import { ALL_PERMISSIONS, ROLE_NAMES } from "@/lib/permissions";

interface RolesHeroProps {
  organizationName: string;
}

/** Static hero — unlike Audit's, there's no live number worth fetching
 * here (role/permission counts come straight from the client-side
 * mirror in lib/permissions.ts, which is already fully loaded, so
 * there's nothing to skeleton). */
export function RolesHero({ organizationName }: RolesHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-[var(--border-subtle)] p-6 sm:p-10">
      <div className="glass-panel absolute inset-0 -z-20" />
      <div className="bg-grid absolute inset-0 -z-10 opacity-60" />
      <div
        className="glow-blob animate-mesh-drift absolute -right-20 -top-20 -z-10 h-72 w-72 rounded-full"
        style={{ background: "var(--accent-blue)" }}
      />
      <div
        className="glow-blob animate-mesh-drift absolute -bottom-28 left-1/4 -z-10 h-64 w-64 rounded-full"
        style={{ background: "var(--accent-emerald)", animationDelay: "-6s" }}
      />

      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-white/[0.03] px-3 py-1 text-xs font-medium text-[var(--accent-emerald)]">
            <ShieldCheck className="h-3 w-3" /> RBAC
          </p>
          <h1 className="mt-4 text-2xl font-semibold text-white sm:text-3xl">Roles & Permissions</h1>
          <p className="mt-2 max-w-lg text-sm text-zinc-400">
            What each role can see and do inside <span className="text-zinc-200">{organizationName}</span>&apos;s
            workspace. Every route enforces these server-side — this page mirrors, not defines, that policy.
          </p>
        </div>

        <div className="glass-panel flex shrink-0 gap-5 self-start rounded-2xl px-5 py-4 sm:self-auto">
          <div>
            <p className="text-xl font-semibold text-white">{ROLE_NAMES.length}</p>
            <p className="text-[11px] text-zinc-500">Roles</p>
          </div>
          <div className="w-px bg-[var(--border-subtle)]" />
          <div>
            <p className="text-xl font-semibold text-white">{ALL_PERMISSIONS.length}</p>
            <p className="text-[11px] text-zinc-500">Permissions</p>
          </div>
        </div>
      </div>
    </section>
  );
}

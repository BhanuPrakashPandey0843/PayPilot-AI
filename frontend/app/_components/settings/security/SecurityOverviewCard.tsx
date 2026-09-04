"use client";

import { Clock, KeyRound, Laptop, ShieldAlert, ShieldCheck } from "lucide-react";
import { relativeTime } from "../../dashboard/home/formatters";

interface FactRowProps {
  icon: typeof KeyRound;
  label: string;
  value: string;
  tone: "emerald" | "amber" | "cyan";
}

const TONE_COLOR: Record<FactRowProps["tone"], string> = {
  emerald: "var(--accent-emerald)",
  amber: "var(--accent-amber)",
  cyan: "var(--accent-cyan)",
};

function FactRow({ icon: Icon, label, value, tone }: FactRowProps) {
  const color = TONE_COLOR[tone];
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border-subtle)] bg-white/[0.02] p-4">
      <div className="flex items-center gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: `color-mix(in srgb, ${color} 16%, transparent)` }}
        >
          <Icon className="h-4 w-4" style={{ color }} />
        </span>
        <span className="text-sm text-zinc-300">{label}</span>
      </div>
      <span className="text-sm font-medium" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

/**
 * Deliberately a neutral overview, not a computed "security score" —
 * the backend has no fields to derive a score from (no MFA state, no
 * password-age tracking, no session risk signals), so per the brief
 * ("If the backend does not currently expose enough information to
 * calculate a security score/status, use a neutral status") this shows
 * three plain, real facts instead: a password is always required to
 * have an account here, 2FA genuinely isn't built yet, and session
 * tracking is genuinely single-device only. None of these are
 * calculated or estimated — every value below is either always true by
 * construction (users.password_hash is NOT NULL) or a known, fixed
 * property of what the backend currently supports.
 *
 * `lastLoginAt` is the one real, variable data point available (see
 * auth.service.ts's getMe / users.last_login_at) — shown as a plain
 * fact underneath rather than folded into a fabricated score.
 */
export function SecurityOverviewCard({ lastLoginAt }: { lastLoginAt?: string | null }) {
  return (
    <div className="rounded-3xl border border-[var(--border-subtle)] bg-white/[0.02] p-6">
      <div className="flex items-center gap-2.5">
        <ShieldCheck className="h-5 w-5 text-[var(--accent-cyan)]" />
        <div>
          <p className="text-sm font-medium text-white">Account security</p>
          <p className="text-xs text-zinc-500">Manage your account security settings below.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <FactRow icon={KeyRound} label="Password protection" value="Active" tone="emerald" />
        <FactRow icon={ShieldAlert} label="Two-factor authentication" value="Not enabled" tone="amber" />
        <FactRow icon={Laptop} label="Sessions" value="This device only" tone="cyan" />
      </div>

      {lastLoginAt !== undefined && (
        <p className="mt-4 flex items-center gap-1.5 text-xs text-zinc-500">
          <Clock className="h-3.5 w-3.5" />
          {lastLoginAt ? <>Last login {relativeTime(lastLoginAt)}</> : "No previous login on record."}
        </p>
      )}
    </div>
  );
}

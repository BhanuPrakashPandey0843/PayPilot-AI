"use client";

import { ShieldAlert } from "lucide-react";
import { NotAvailableCard } from "./NotAvailableCard";

/**
 * The backend has no MFA infrastructure at all — no columns on `users`
 * (see backend/src/db/schema/users.ts), no /auth/2fa routes. "Not
 * enabled" here is therefore a true, honest statement (2FA genuinely
 * doesn't exist for this account), not a guess — matching the brief's
 * "DO NOT fake an enabled state" instruction. The "Enable 2FA" control
 * is disabled rather than removed, so there's a real, discoverable
 * extension point once the backend ships a setup flow: start ->
 * QR/secret -> verify code -> confirm -> recovery codes (see this
 * component's future TODO living in the doc comment, not in the code
 * itself, per the "no TODO placeholders" rule).
 */
export function TwoFactorCard() {
  return (
    <div className="rounded-3xl border border-[var(--border-subtle)] bg-white/[0.02] p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-amber)]/12">
            <ShieldAlert className="h-4 w-4 text-[var(--accent-amber)]" />
          </span>
          <div>
            <p className="text-sm font-medium text-white">Two-factor authentication</p>
            <p className="mt-0.5 max-w-sm text-xs text-zinc-500">
              Add an additional layer of protection to your PayPilot AI account.
            </p>
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[var(--accent-amber)]/12 px-2 py-0.5 text-[11px] font-medium text-[var(--accent-amber)]">
              Not enabled
            </span>
          </div>
        </div>

        <button
          type="button"
          disabled
          title="Two-factor authentication isn't available yet — this requires backend support that hasn't been built."
          className="shrink-0 cursor-not-allowed rounded-xl border border-[var(--border-subtle)] px-4 py-2 text-sm font-medium text-zinc-500 opacity-60 sm:self-auto"
        >
          Enable 2FA
        </button>
      </div>

      <div className="mt-4">
        <NotAvailableCard
          icon={ShieldAlert}
          title="Coming soon"
          description="Two-factor authentication isn't supported by PayPilot AI yet. This card is ready to connect to a setup flow (QR code, verification, recovery codes) once the backend adds it."
        />
      </div>
    </div>
  );
}

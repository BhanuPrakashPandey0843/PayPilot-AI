"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { ChangePasswordDialog } from "./ChangePasswordDialog";

/**
 * "Last changed" is deliberately not shown — users.updated_at
 * (backend/src/db/schema/users.ts) changes on ANY user-row update, not
 * specifically a password change, and there is no dedicated
 * password_changed_at column, so there is no real value to display
 * here. Per the brief's own rule ("Show: Last changed: [real value if
 * available]"), omitting the line is the honest choice — same pattern
 * as ProductsSummaryCards.tsx skipping a "catalog value" card rather
 * than inventing one.
 */
export function PasswordSecurityCard() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="rounded-3xl border border-[var(--border-subtle)] bg-white/[0.02] p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-cyan)]/12">
            <KeyRound className="h-4 w-4 text-[var(--accent-cyan)]" />
          </span>
          <div>
            <p className="text-sm font-medium text-white">Password</p>
            <p className="mt-0.5 max-w-sm text-xs text-zinc-500">
              Update your password to keep your account secure.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="shrink-0 rounded-xl border border-[var(--border-subtle)] px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:border-[var(--border-strong)] hover:text-white sm:self-auto"
        >
          Change password
        </button>
      </div>

      {dialogOpen && <ChangePasswordDialog onClose={() => setDialogOpen(false)} />}
    </div>
  );
}

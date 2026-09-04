"use client";

import { LogOut, X } from "lucide-react";

interface SignOutDialogProps {
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * Confirmation before a high-impact action, per the brief's Section 6.
 * "Sign out of all other sessions" isn't offered — see
 * ActiveSessionsCard's doc comment for why PayPilot AI's stateless-JWT
 * auth has no "other sessions" to sign out of — so this confirms the
 * one real action this backend supports: signing out this device.
 */
export function SignOutDialog({ onClose, onConfirm }: SignOutDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="glass-panel relative w-full max-w-md rounded-3xl border border-[var(--border-subtle)] bg-[var(--background-elevated)] p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-zinc-500 hover:bg-white/5 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-rose)]/12">
            <LogOut className="h-5 w-5 text-[var(--accent-rose)]" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Confirm</p>
            <h2 className="mt-0.5 text-lg font-semibold text-white">Sign out?</h2>
          </div>
        </div>

        <p className="mt-4 text-sm text-zinc-400">
          This will sign you out of PayPilot AI on this device. You&apos;ll need to log in again to continue.
        </p>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--border-subtle)] px-4 py-2 text-sm font-medium text-zinc-300 hover:border-[var(--border-strong)] hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent-rose)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

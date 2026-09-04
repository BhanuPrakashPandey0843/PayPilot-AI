"use client";

import { Info, Search, UserPlus, X } from "lucide-react";
import { useState } from "react";
import { ROLE_ORDER, ROLE_ACCENT, ROLE_ICON } from "./teamMeta";
import type { TeamRole } from "@/lib/api/team";
import { formatRoleLabel } from "@/lib/permissions";
import { ROLE_DESCRIPTIONS } from "./teamMeta";

interface TeamToolbarProps {
  hasInviteApi: boolean;
  hasSearchApi: boolean;
  /** Called when the merchant clicks "Invite member". The hook-level
   *  implementation will either call the real invite endpoint (once
   *  it exists) or open the "API not yet available" explanation. */
  onInviteClick: () => void;
  isInviteSubmitting: boolean;
}

interface InviteDialogProps {
  open: boolean;
  onClose: () => void;
  /** True when invite endpoint is actually registered on the backend. */
  hasApi: boolean;
  onSubmit: (input: { email: string; role: TeamRole }) => Promise<{
    ok: boolean;
    message: string;
  }>;
}

export function InviteMemberDialog({ open, onClose, hasApi, onSubmit }: InviteDialogProps) {
  if (!open) return null;
  return <InviteForm onClose={onClose} hasApi={hasApi} onSubmit={onSubmit} key={`invite-${open}`} />;
}

function InviteForm({
  onClose,
  hasApi,
  onSubmit,
}: Omit<InviteDialogProps, "open">) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("VIEWER");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validateEmail(value: string): string | null {
    if (!value) return "An email address is required.";
    // Match backend/auth.schemas.ts email requirement: z.string().email()
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    if (!ok) return "Please enter a valid email address.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const emailErr = validateEmail(email.trim());
    if (emailErr) {
      setError(emailErr);
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await onSubmit({ email: email.trim(), role });
      if (!res.ok) {
        setError(res.message);
      } else if (hasApi) {
        // Success on real backend: close the dialog. Caller invalidates
        // the team list query to show the newly invited row.
        onClose();
      } else {
        // Not available yet: keep dialog open so the merchant reads the
        // error notice (which explains what's missing) rather than the
        // dialog closing and leaving them wondering whether it worked.
        setError(res.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send invitation.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-member-title"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="glass-panel relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-3xl border border-[var(--border-subtle)] bg-[var(--background-elevated)] shadow-2xl">
        <div className="flex shrink-0 items-start justify-between border-b border-[var(--border-subtle)] p-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Add a teammate</p>
            <h2 id="invite-member-title" className="mt-1 text-lg font-semibold text-white">
              Invite member
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1 text-zinc-500 transition-colors hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-5 overflow-y-auto p-6">
          {!hasApi && (
            <div className="flex items-start gap-2 rounded-2xl border border-[var(--accent-amber)]/30 bg-[var(--accent-amber)]/[0.06] p-3 text-xs text-[var(--accent-amber)]" role="note">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>
                The invite member API is not available in this backend release. Submitting this form will confirm
                that — no invitation will actually be sent until the team management routes are registered.
              </span>
            </div>
          )}

          <div>
            <label htmlFor="invite-email" className="block text-xs font-medium text-zinc-300">
              Email address
            </label>
            <input
              id="invite-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@yourcompany.com"
              className="mt-1.5 w-full rounded-xl border border-[var(--border-subtle)] bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-[var(--border-strong)] focus:outline-none"
              required
            />
          </div>

          <div>
            <p className="block text-xs font-medium text-zinc-300">Role</p>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {ROLE_ORDER.map((r) => {
                const Icon = ROLE_ICON[r];
                const checked = role === r;
                return (
                  <label
                    key={r}
                    className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition-all ${
                      checked
                        ? "border-[var(--border-strong)] bg-white/[0.04]"
                        : "border-[var(--border-subtle)] bg-white/[0.01] hover:border-[var(--border-strong)]/60"
                    }`}
                    style={checked ? { borderColor: `color-mix(in srgb, ${ROLE_ACCENT[r]} 55%, var(--border-strong))` } : undefined}
                  >
                    <input
                      type="radio"
                      name="invite-role"
                      value={r}
                      checked={checked}
                      onChange={() => setRole(r)}
                      className="sr-only"
                    />
                    <span
                      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: `color-mix(in srgb, ${ROLE_ACCENT[r]} 18%, transparent)`, color: ROLE_ACCENT[r] }}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">{formatRoleLabel(r)}</p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500">
                        {ROLE_DESCRIPTIONS[r]}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-[var(--accent-rose)]/30 bg-[var(--accent-rose)]/[0.06] px-3 py-2.5 text-xs text-[var(--accent-rose)]" role="alert">
              {error}
            </div>
          )}
        </form>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[var(--border-subtle)] p-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl px-4 py-2 text-sm text-zinc-300 transition-colors hover:text-white disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit as unknown as React.MouseEventHandler}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-violet)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-40"
          >
            {isSubmitting ? "Sending…" : "Send invitation"}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Toolbar above the team table — follows the pattern of the orders
 * toolbar minus search/filters because those query params are not
 * supported on any backend endpoint yet.
 *
 * Always honest:
 *   - "Invite member" opens the InviteMemberDialog, which calls the real
 *     inviteMember() function in lib/api/team.ts. That function is wired
 *     to a NotAvailableError until a real /invitations or /users route
 *     exists; the dialog shows a clean message rather than failing
 *     silently.
 *   - Search input renders ONLY once TEAM_CAPABILITIES.listMembers flips
 *     to true. Otherwise clicking the search box would claim "search
 *     members" but only search the single-row client-side list, which is
 *     a misleading global-search illusion.
 */
export function TeamToolbar({
  hasInviteApi: _hasInviteApi,
  hasSearchApi,
  onInviteClick,
  isInviteSubmitting,
}: TeamToolbarProps) {
  void _hasInviteApi;
  const [search, setSearch] = useState("");
  return (
    <div className="glass-panel flex flex-col gap-3 rounded-2xl p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {hasSearchApi ? (
          <div className="flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-white/[0.03] px-3 py-2 sm:max-w-xs sm:flex-1">
            <Search className="h-4 w-4 text-zinc-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members (name, email)"
              className="w-full bg-transparent text-sm text-white placeholder:text-zinc-600 focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="rounded-lg p-0.5 text-zinc-500 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-start gap-2 text-xs text-zinc-500">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent-cyan)]" />
            <p>
              <span className="font-medium text-zinc-300">Member search and filtering</span> are
              coming soon once the dedicated team management API lands.
            </p>
          </div>
        )}

        <div className="flex items-center gap-2 sm:justify-end">
          <button
            type="button"
            onClick={onInviteClick}
            disabled={isInviteSubmitting}
            aria-label="Invite a new team member"
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-[var(--accent-violet)] px-4 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-40"
          >
            <UserPlus className="h-4 w-4" aria-hidden="true" /> Invite member
          </button>
        </div>
      </div>
    </div>
  );
}

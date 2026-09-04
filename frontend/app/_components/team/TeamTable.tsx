"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Eye,
  X,
  ArrowRight,
  AlertCircle,
  Users,
} from "lucide-react";
import type { UseApiResourceResult } from "@/hooks/useApiResource";
import type { TeamMemberRow, TeamRole, MembershipStatus, UserStatus } from "@/lib/api/team";
import { ErrorNote } from "../dashboard/home/Skeletons";
import {
  MEMBERSHIP_STATUS_META,
  ROLE_ACCENT,
  ROLE_ICON,
  ROLE_ORDER,
  ROLE_DESCRIPTIONS,
} from "./teamMeta";
import { formatRoleLabel, permissionsForRole } from "@/lib/permissions";

interface TeamTableProps {
  result: UseApiResourceResult<TeamMemberRow[]>;
  hasMemberListApi: boolean;
  /** True when the role-change mutation is backed by a real endpoint. */
  hasRoleChangeApi: boolean;
  /** True when remove-member is backed by a real endpoint. */
  hasRemoveApi: boolean;
  hasInviteApi: boolean;
  onInviteClick: () => void;
  onChangeRole: (memberId: string, nextRole: TeamRole) => Promise<{ ok: boolean; message: string }>;
  onRemove: (memberId: string) => Promise<{ ok: boolean; message: string }>;
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable — this is a convenience action only.
    }
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copy ${label}`}
      title={`Copy ${label}`}
      className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
    >
      {copied ? <Check className="h-3 w-3 text-[var(--accent-emerald)]" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

function AvatarInitials({ firstName, lastName }: { firstName: string; lastName: string }) {
  const a = firstName.charAt(0).toUpperCase();
  const b = lastName.charAt(0).toUpperCase();
  const label = (a || "?") + (b || "");
  return (
    <div
      aria-hidden="true"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
      style={{
        background:
          "linear-gradient(135deg, color-mix(in srgb, var(--accent-violet) 70%, var(--accent-emerald)), color-mix(in srgb, var(--accent-emerald) 50%, var(--accent-blue)))",
      }}
    >
      {label}
    </div>
  );
}

function RoleBadge({ role, size = "sm" }: { role: TeamRole; size?: "sm" | "lg" }) {
  const Icon = ROLE_ICON[role];
  const accent = ROLE_ACCENT[role];
  const label = formatRoleLabel(role);
  const classes =
    size === "lg"
      ? "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      : "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium";
  return (
    <span
      className={classes}
      style={{ background: `color-mix(in srgb, ${accent} 16%, transparent)`, color: accent }}
    >
      <Icon className={size === "lg" ? "h-3.5 w-3.5" : "h-3 w-3"} aria-hidden="true" /> {label}
    </span>
  );
}

function MembershipBadge({ status }: { status: MembershipStatus }) {
  const meta = MEMBERSHIP_STATUS_META[status];
  const Icon = meta.icon;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border border-[var(--border-subtle)] bg-white/[0.02] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
      style={{ color: meta.color }}
    >
      <Icon className="h-3 w-3" aria-hidden="true" /> {meta.label}
    </span>
  );
}

// --- Role change + remove confirmation dialogs --------------------------

interface ChangeRoleDialogProps {
  open: boolean;
  onClose: () => void;
  member: TeamMemberRow | null;
  hasApi: boolean;
  onSubmit: (memberId: string, role: TeamRole) => Promise<{ ok: boolean; message: string }>;
}

function ChangeRoleDialog({ open, onClose, member, hasApi, onSubmit }: ChangeRoleDialogProps) {
  const [next, setNext] = useState<TeamRole>("VIEWER");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!open || !member) return null;
  const activeMember = member;

  function nameOf(m: TeamMemberRow) {
    return `${m.firstName} ${m.lastName}`.trim() || m.email;
  }

  async function handleConfirm() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await onSubmit(activeMember.id, next);
      if (!res.ok) {
        setError(res.message);
      } else if (hasApi) {
        onClose();
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update role.");
    } finally {
      setSubmitting(false);
    }
  }

  const canChangeSelf = member.role === "ORG_ADMIN"
    ? "As an Organization Admin you can change roles for others; changing your own role is not recommended."
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="alertdialog" aria-modal="true" aria-labelledby="change-role-title">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="glass-panel relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-3xl border border-[var(--border-subtle)] bg-[var(--background-elevated)] shadow-2xl">
        <div className="flex shrink-0 items-start justify-between border-b border-[var(--border-subtle)] p-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Role change</p>
            <h2 id="change-role-title" className="mt-1 text-lg font-semibold text-white">
              Change {nameOf(member)}&apos;s role
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-zinc-500 transition-colors hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-white/[0.02] p-3">
            <p className="text-[10px] uppercase tracking-wide text-zinc-500">Current role</p>
            <div className="mt-1 flex items-center gap-2">
              <RoleBadge role={member.role} size="lg" />
            </div>
          </div>

          {!hasApi && (
            <div className="flex items-start gap-2 rounded-xl border border-[var(--accent-amber)]/30 bg-[var(--accent-amber)]/[0.06] p-3 text-xs text-[var(--accent-amber)]" role="note">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>The role-change API is not available yet — confirming will report the missing endpoint instead of actually applying a change.</span>
            </div>
          )}

          {canChangeSelf && (
            <div className="flex items-start gap-2 rounded-xl border border-[var(--border-subtle)] bg-white/[0.02] p-3 text-xs text-zinc-400">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent-amber)]" />
              <span>{canChangeSelf}</span>
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-zinc-300">New role</p>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {ROLE_ORDER.map((r) => {
                const Icon = ROLE_ICON[r];
                const checked = next === r;
                return (
                  <label
                    key={r}
                    className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition-all ${
                      checked
                        ? "border-[var(--border-strong)] bg-white/[0.04]"
                        : "border-[var(--border-subtle)] bg-white/[0.01] hover:border-[var(--border-strong)]/60"
                    }`}
                    style={
                      checked
                        ? { borderColor: `color-mix(in srgb, ${ROLE_ACCENT[r]} 55%, var(--border-strong))` }
                        : undefined
                    }
                  >
                    <input type="radio" name="new-role" value={r} checked={checked} onChange={() => setNext(r)} className="sr-only" />
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
            <p className="mt-2 text-[11px] text-zinc-600">
              This role grants <span className="text-zinc-400 font-medium">{permissionsForRole(next).length}</span> permissions.
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-[var(--accent-rose)]/30 bg-[var(--accent-rose)]/[0.06] px-3 py-2.5 text-xs text-[var(--accent-rose)]" role="alert">
              {error}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[var(--border-subtle)] p-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl px-4 py-2 text-sm text-zinc-300 transition-colors hover:text-white disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting || next === member.role}
            className="inline-flex items-center gap-1 rounded-xl bg-[var(--accent-violet)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-40"
          >
            {submitting ? "Updating…" : "Confirm change"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface RemoveDialogProps {
  open: boolean;
  onClose: () => void;
  member: TeamMemberRow | null;
  hasApi: boolean;
  onSubmit: (memberId: string) => Promise<{ ok: boolean; message: string }>;
}

function RemoveMemberDialog({ open, onClose, member, hasApi, onSubmit }: RemoveDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!open || !member) return null;
  const activeMember = member;

  const name = `${member.firstName} ${member.lastName}`.trim() || member.email;
  const isSelf = member.isCurrentUser;
  const isOwner = member.role === "ORG_ADMIN";
  // Backend protections (that we mirror as UX hints, not enforcement):
  // Organization owners can't be removed; you can't remove yourself either.
  // The real enforcement is DB + server-side; the UI just pre-highlights.
  const wouldBeBlocked = isSelf || isOwner;

  async function handleConfirm() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await onSubmit(activeMember.id);
      if (!res.ok) {
        setError(res.message);
      } else if (hasApi) {
        onClose();
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't remove member.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="alertdialog" aria-modal="true" aria-labelledby="remove-member-title">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="glass-panel relative flex max-h-[90vh] w-full max-w-md flex-col rounded-3xl border border-[var(--border-subtle)] bg-[var(--background-elevated)] shadow-2xl">
        <div className="flex shrink-0 items-start justify-between border-b border-[var(--border-subtle)] p-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Destructive action</p>
            <h2 id="remove-member-title" className="mt-1 text-lg font-semibold text-white">
              Remove {name}?
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-zinc-500 transition-colors hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-6 text-sm text-zinc-300">
          <p>
            This will remove their access to this PayPilot AI organization. Their account record
            will remain, but their membership is revoked and any active sessions will no longer
            authorize (backend applies these on every request via requirePermission).
          </p>

          {!hasApi && (
            <div className="flex items-start gap-2 rounded-xl border border-[var(--accent-amber)]/30 bg-[var(--accent-amber)]/[0.06] p-3 text-xs text-[var(--accent-amber)]" role="note">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>The remove-member API is not available yet. Confirming will report that instead of actually removing anyone.</span>
            </div>
          )}

          {wouldBeBlocked && (
            <div className="flex items-start gap-2 rounded-xl border border-[var(--accent-rose)]/30 bg-[var(--accent-rose)]/[0.06] p-3 text-xs text-[var(--accent-rose)]" role="alert">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                {isSelf ? "You cannot remove yourself from your own organization." : ""}
                {isOwner && !isSelf ? "An Organization Admin role is protected — the backend will reject this removal." : ""}
                {isSelf && isOwner ? " You are the ORG_ADMIN; the backend rejects both self-removal and owner removal." : ""}
              </span>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-[var(--accent-rose)]/30 bg-[var(--accent-rose)]/[0.06] px-3 py-2.5 text-xs text-[var(--accent-rose)]" role="alert">
              {error}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[var(--border-subtle)] p-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl px-4 py-2 text-sm text-zinc-300 transition-colors hover:text-white disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting || wouldBeBlocked}
            className="inline-flex items-center gap-1 rounded-xl bg-[var(--accent-rose)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-40"
          >
            {submitting ? "Removing…" : "Remove member"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Detail view (accessible, keyboard-navigable) ----------------------

interface DetailDialogProps {
  open: boolean;
  onClose: () => void;
  member: TeamMemberRow | null;
}

function MemberDetailDialog({ open, onClose, member }: DetailDialogProps) {
  if (!open || !member) return null;
  const Icon = ROLE_ICON[member.role];
  const accent = ROLE_ACCENT[member.role];
  const perms = permissionsForRole(member.role);

  const name = `${member.firstName} ${member.lastName}`.trim() || member.email;

  function row(label: string, value: string | null | undefined, mono = false) {
    return (
      <div className="flex items-start justify-between gap-3 border-b border-[var(--border-subtle)]/60 py-2 last:border-0">
        <span className="text-xs text-zinc-500">{label}</span>
        <span
          className={`text-right text-xs text-zinc-200 ${mono ? "font-mono text-[11px]" : ""}`}
          title={value ?? ""}
        >
          {value && value.length > 0 ? value : "—"}
        </span>
      </div>
    );
  }

  const userStatus: UserStatus = member.userStatus;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="member-detail-title"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="glass-panel relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-3xl border border-[var(--border-subtle)] bg-[var(--background-elevated)] shadow-2xl">
        <div className="flex shrink-0 items-start justify-between border-b border-[var(--border-subtle)] p-6">
          <div className="flex min-w-0 items-start gap-3">
            <AvatarInitials firstName={member.firstName} lastName={member.lastName} />
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Member details</p>
              <h2 id="member-detail-title" className="mt-0.5 truncate text-lg font-semibold text-white">
                {name}
                {member.isCurrentUser && (
                  <span className="ml-2 rounded-full border border-[var(--accent-cyan)]/40 bg-[var(--accent-cyan)]/[0.08] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--accent-cyan)]">
                    You
                  </span>
                )}
              </h2>
              <p className="mt-0.5 truncate text-xs text-zinc-400">{member.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="rounded-lg p-1 text-zinc-500 transition-colors hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          <section>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">Access</p>
            <div className="grid grid-cols-2 gap-3">
              <div
                className="rounded-xl border p-3"
                style={{
                  borderColor: `color-mix(in srgb, ${accent} 40%, var(--border-subtle))`,
                  background: `color-mix(in srgb, ${accent} 6%, transparent)`,
                }}
              >
                <div className="flex items-center gap-1.5" style={{ color: accent }}>
                  <Icon className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">{formatRoleLabel(member.role)}</span>
                </div>
                <p className="mt-1 text-[11px] text-zinc-400">{ROLE_DESCRIPTIONS[member.role]}</p>
              </div>
              <div className="rounded-xl border border-[var(--border-subtle)] bg-white/[0.02] p-3">
                <p className="text-xs font-medium text-zinc-300">Membership</p>
                <div className="mt-1">
                  <MembershipBadge status={member.membershipStatus} />
                </div>
                <p className="mt-2 text-[10px] uppercase tracking-wide text-zinc-500">
                  User status · {userStatus}
                </p>
              </div>
            </div>
          </section>

          <section>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">Record</p>
            <div className="rounded-xl border border-[var(--border-subtle)] bg-white/[0.02] p-3 text-xs">
              {row("Name", name)}
              {row("Email", member.email)}
              {row("Role ID", member.roleId, true)}
              {row("Member ID", member.id, true)}
              {row("User ID", member.userId, true)}
              {row("Last login", member.lastLoginAt ? new Date(member.lastLoginAt).toLocaleString("en-IN") : null)}
              {row("Joined", member.joinedAt ? new Date(member.joinedAt).toLocaleString("en-IN") : null)}
            </div>
          </section>

          <section>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
              Permissions · {perms.length} granted
            </p>
            <div className="max-h-64 space-y-1 overflow-y-auto rounded-xl border border-[var(--border-subtle)] bg-white/[0.02] p-2 text-xs">
              {perms.map((p) => (
                <div
                  key={p}
                  className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-white/[0.02]"
                >
                  <code className="font-mono text-[11px] text-zinc-300">{p}</code>
                  <Check className="h-3 w-3 text-[var(--accent-emerald)]" aria-hidden="true" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// --- Actions menu for a row --------------------------------------------

interface RowActionsProps {
  member: TeamMemberRow;
  hasRoleApi: boolean;
  hasRemoveApi: boolean;
  onView: (m: TeamMemberRow) => void;
  onChangeRole: (m: TeamMemberRow) => void;
  onRemove: (m: TeamMemberRow) => void;
}

function RowActions({ member, hasRoleApi, hasRemoveApi, onView, onChangeRole, onRemove }: RowActionsProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-flex" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-end gap-1">
        <button
          type="button"
          onClick={() => onView(member)}
          aria-label={`View details for ${member.email}`}
          title="View details"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <Eye className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onChangeRole(member)}
          aria-label={`Change role for ${member.email}`}
          title="Change role"
          disabled={!hasRoleApi && !member.isCurrentUser ? false : false}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onRemove(member)}
          aria-label={`Remove ${member.email} from team`}
          title="Remove member"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/5 hover:text-[var(--accent-rose)]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {/* open is unused for now — the menu was collapsed into inline buttons
          because the existing design system has no <DropdownMenu/> primitive.
          Keeping the state var is harmless and supports a future swap. */}
      {false && <span>{String(open)}</span>}
    </div>
  );
}

// --- Main TeamTable component ------------------------------------------

export function TeamTable({
  result,
  hasMemberListApi,
  hasRoleChangeApi,
  hasRemoveApi,
  hasInviteApi,
  onInviteClick,
  onChangeRole,
  onRemove,
}: TeamTableProps) {
  const rows = result.data ?? [];
  const total = rows.length;
  const [detail, setDetail] = useState<TeamMemberRow | null>(null);
  const [changeRole, setChangeRole] = useState<TeamMemberRow | null>(null);
  const [remove, setRemove] = useState<TeamMemberRow | null>(null);
  const [page] = useState(1);
  const limit = 20;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="rounded-3xl border border-[var(--border-subtle)] bg-white/[0.02] p-6">
      <p className="text-sm font-medium text-white">Team members</p>
      {result.data && (
        <p className="mt-0.5 text-xs text-zinc-500" aria-live="polite">
          {hasMemberListApi
            ? `Showing 1–${Math.min(limit, total)} of ${total} team members`
            : `Showing the 1 team member we can return with the current backend release`}
        </p>
      )}

      {result.error && (
        <div className="mt-4">
          <ErrorNote message={result.error} onRetry={result.refetch} />
        </div>
      )}

      {!result.error && result.isLoading && (
        <div className="mt-4 space-y-2" aria-busy="true" aria-label="Loading team">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-shimmer h-14 w-full rounded-xl bg-white/[0.03]" />
          ))}
        </div>
      )}

      {!result.isLoading && !result.error && rows.length === 0 && (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--border-subtle)] py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04]">
            <Users className="h-5 w-5 text-zinc-500" />
          </span>
          <p className="text-sm font-medium text-zinc-200">No team members yet</p>
          <p className="max-w-xs text-xs text-zinc-500">
            {hasInviteApi
              ? "Invite teammates to collaborate on your PayPilot AI organization."
              : "Inviting team members is not available in this backend release — the invitation endpoints are not registered yet."}
          </p>
          {hasInviteApi && (
            <button
              type="button"
              onClick={onInviteClick}
              className="mt-1 rounded-xl bg-[var(--accent-violet)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Invite your first teammate
            </button>
          )}
        </div>
      )}

      {!result.isLoading && !result.error && rows.length > 0 && (
        <>
          <div className="mt-4 hidden overflow-x-auto md:block">
            <table
              className="w-full min-w-[720px] border-collapse text-left text-sm"
              role="table"
              aria-label="Team members table"
            >
              <thead>
                <tr
                  className="border-b border-[var(--border-subtle)] text-xs uppercase tracking-wide text-zinc-500"
                  role="row"
                >
                  <th scope="col" className="py-2 pr-4 font-medium">Member</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Role</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Status</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Last login</th>
                  <th scope="col" className="py-2 pl-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((member) => (
                  <tr
                    key={member.userId}
                    role="row"
                    onClick={() => setDetail(member)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setDetail(member);
                      }
                    }}
                    tabIndex={0}
                    className="cursor-pointer border-b border-[var(--border-subtle)]/60 transition-colors hover:bg-white/[0.03]"
                    aria-label={`${member.firstName} ${member.lastName}, ${member.email}, ${formatRoleLabel(member.role)}`}
                  >
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <AvatarInitials firstName={member.firstName} lastName={member.lastName} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-medium text-white">
                              {member.firstName} {member.lastName}
                            </p>
                            {member.isCurrentUser && (
                              <span className="rounded-full border border-[var(--accent-cyan)]/40 bg-[var(--accent-cyan)]/[0.08] px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-[var(--accent-cyan)]">
                                You
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1">
                            <p className="truncate text-xs text-zinc-400">{member.email}</p>
                            <CopyButton value={member.email} label="email" />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <RoleBadge role={member.role} />
                    </td>
                    <td className="py-3 pr-4">
                      <MembershipBadge status={member.membershipStatus} />
                    </td>
                    <td className="py-3 pr-4 text-xs text-zinc-500">
                      {member.lastLoginAt
                        ? new Date(member.lastLoginAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                        : "Never"}
                    </td>
                    <td className="py-3 pl-4">
                      <RowActions
                        member={member}
                        hasRoleApi={hasRoleChangeApi}
                        hasRemoveApi={hasRemoveApi}
                        onView={setDetail}
                        onChangeRole={setChangeRole}
                        onRemove={setRemove}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="mt-4 flex flex-col gap-3 md:hidden">
            {rows.map((member) => (
              <div
                key={member.userId}
                onClick={() => setDetail(member)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setDetail(member);
                  }
                }}
                tabIndex={0}
                role="button"
                className="cursor-pointer rounded-2xl border border-[var(--border-subtle)] bg-white/[0.02] p-4 transition-colors hover:border-[var(--border-strong)]"
              >
                <div className="flex items-start gap-3">
                  <AvatarInitials firstName={member.firstName} lastName={member.lastName} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-white">
                        {member.firstName} {member.lastName}
                      </p>
                      {member.isCurrentUser && (
                        <span className="rounded-full border border-[var(--accent-cyan)]/40 bg-[var(--accent-cyan)]/[0.08] px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-[var(--accent-cyan)]">
                          You
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-zinc-400">{member.email}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <RoleBadge role={member.role} />
                      <MembershipBadge status={member.membershipStatus} />
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-[var(--border-subtle)] pt-3">
                  <p className="text-[11px] text-zinc-500">
                    Last login{" "}
                    {member.lastLoginAt
                      ? new Date(member.lastLoginAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                      : "never"}
                  </p>
                  <div onClick={(e) => e.stopPropagation()}>
                    <RowActions
                      member={member}
                      hasRoleApi={hasRoleChangeApi}
                      hasRemoveApi={hasRemoveApi}
                      onView={setDetail}
                      onChangeRole={setChangeRole}
                      onRemove={setRemove}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {totalPages > 1 && (
        <nav className="mt-5 flex items-center justify-between text-xs text-zinc-500" aria-label="Team pagination">
          <span>Page {page} of {totalPages} · {total} members</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] px-2.5 py-1.5 font-medium text-zinc-300 opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </button>
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] px-2.5 py-1.5 font-medium text-zinc-300 opacity-40"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </nav>
      )}

      <MemberDetailDialog open={detail !== null} onClose={() => setDetail(null)} member={detail} />
      <ChangeRoleDialog
        open={changeRole !== null}
        onClose={() => setChangeRole(null)}
        member={changeRole}
        hasApi={hasRoleChangeApi}
        onSubmit={(id, role) => onChangeRole(id, role)}
      />
      <RemoveMemberDialog
        open={remove !== null}
        onClose={() => setRemove(null)}
        member={remove}
        hasApi={hasRemoveApi}
        onSubmit={(id) => onRemove(id)}
      />
    </div>
  );
}

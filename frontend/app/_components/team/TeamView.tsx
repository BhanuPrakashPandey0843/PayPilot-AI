"use client";

import { useState } from "react";
import { useSession } from "@/hooks/useSession";
import { useTeam } from "@/hooks/useTeam";
import { roleHasPermission } from "@/lib/permissions";
import { TeamHero } from "./TeamHero";
import { TeamSummaryCards } from "./TeamSummaryCards";
import { TeamToolbar, InviteMemberDialog } from "./TeamToolbar";
import { TeamTable } from "./TeamTable";

/**
 * Team management page (/team).
 *
 * ---- Capability truth (backend index.ts route registration, as of now) ----
 *
 *   REAL, BACKED BY API:
 *     · View the currently-authenticated user record (GET /auth/me, shared
 *       with the dashboard auth check). Only one row can ever be rendered.
 *
 *   NOT IMPLEMENTED IN BACKEND (do not fake — explicitly reported):
 *     · GET /users (or /team / /members) — no organization member list route
 *     · POST /users or /invitations — no invite API
 *     · PATCH /users/:id/role or /members/:id/role — no role change API
 *     · DELETE /users/:id or /members/:id/remove — no remove API
 *     · Invitations schema at all — no DB table, no resend/revoke
 *
 * The page therefore:
 *   1. Shows the current user in a professional fintech-style table
 *      that is structurally ready for the backend list API — when the
 *      members endpoint lands, the ONLY change is flipping
 *      TEAM_CAPABILITIES.listMembers in lib/api/team.ts and ensuring the
 *      row list shape matches TeamMemberRow.
 *   2. Displays prominent "Coming soon" capability chips, labels, and
 *      inline notices so the merchant knows exactly what works and what
 *      isn't there yet — no dead clicks pretending to succeed.
 *   3. All forms (Invite, Change Role, Remove) submit through the real
 *      useTeam.actions wrappers which throw a NotAvailableError when the
 *      corresponding endpoint isn't registered; the dialogs catch this
 *      and surface a clear message rather than a fake "Success" toast.
 *
 * RBAC (phase 19):
 *   Permission "users.read" is required for this page to render members.
 *   WRITE actions additionally require users.create (invite) /
 *   users.update (role change). These gates are UX-only hints — the
 *   actual enforcement is server-side requirePermission(...), applied
 *   fresh on every request (backend/middleware/authorize.ts re-resolves
 *   membership + role_permissions from the DB, not the JWT).
 *
 * Multi-tenant isolation (phase 20):
 *   Data is implicitly org-scoped because the only source is GET
 *   /auth/me, which resolves the authenticated userId + orgId from the
 *   verified JWT. No organizationId query parameter or client-provided
 *   tenant identifier is accepted anywhere in this page.
 */
export function TeamView() {
  const { session, isLoading: sessionLoading } = useSession();
  const team = useTeam();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteSubmitting, setInviteSubmitting] = useState(false);

  const canRead = roleHasPermission(session?.role, "users.read");
  const canCreate = roleHasPermission(session?.role, "users.create");
  const canUpdate = roleHasPermission(session?.role, "users.update");

  async function handleInvite(input: { email: string; role: typeof team extends { actions: { invite: (i: infer I) => Promise<infer R> } } ? I extends { role: infer R2 } ? R2 : never : never }) {
    setInviteSubmitting(true);
    try {
      const res = await team.actions.invite(input as Parameters<(typeof team)["actions"]["invite"]>[0]);
      if (res.ok) {
        // Real endpoint: refresh list so the new invited row appears.
        // Since today there is no list endpoint, refetch is a no-op for
        // UI purposes — we run it anyway for future-compatibility.
        team.members.refetch();
        setInviteOpen(false);
      }
      return res as { ok: boolean; message: string };
    } finally {
      setInviteSubmitting(false);
    }
  }

  async function handleRoleChange(memberId: string, role: Parameters<(typeof team)["actions"]["changeRole"]>[1]) {
    const res = await team.actions.changeRole(memberId, role);
    if (res.ok) team.members.refetch();
    return res;
  }

  async function handleRemove(memberId: string) {
    const res = await team.actions.remove(memberId);
    if (res.ok) team.members.refetch();
    return res;
  }

  if (sessionLoading && !team.hasLoaded) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
        <div className="animate-shimmer h-64 w-full rounded-3xl bg-white/[0.03]" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-shimmer h-28 rounded-3xl bg-white/[0.03]" />
          ))}
        </div>
        <div className="animate-shimmer h-16 w-full rounded-2xl bg-white/[0.03]" />
        <div className="animate-shimmer h-96 w-full rounded-3xl bg-white/[0.03]" />
      </div>
    );
  }

  if (session && !canRead) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
        <p className="text-sm font-medium text-zinc-200">You don&apos;t have access to Team</p>
        <p className="max-w-xs text-xs text-zinc-500">
          Ask an Organization Admin to grant you the users.read permission.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <TeamHero
        organizationName={session?.organization.name ?? "your workspace"}
        totalMembers={team.members.data?.length ?? 0}
        hasMemberApi={team.capabilities.listMembers}
      />

      <TeamSummaryCards
        result={team.members}
        hasMemberListApi={team.capabilities.listMembers}
        hasInviteApi={team.capabilities.inviteMember && canCreate}
        hasRoleChangeApi={team.capabilities.changeRole && canUpdate}
      />

      <TeamToolbar
        hasInviteApi={team.capabilities.inviteMember && canCreate}
        hasSearchApi={team.capabilities.listMembers}
        onInviteClick={() => setInviteOpen(true)}
        isInviteSubmitting={inviteSubmitting}
      />

      <TeamTable
        result={team.members}
        hasMemberListApi={team.capabilities.listMembers}
        hasRoleChangeApi={team.capabilities.changeRole && canUpdate}
        hasRemoveApi={team.capabilities.removeMember && canUpdate}
        hasInviteApi={team.capabilities.inviteMember && canCreate}
        onInviteClick={() => setInviteOpen(true)}
        onChangeRole={handleRoleChange as Parameters<typeof TeamTable>[0]["onChangeRole"]}
        onRemove={handleRemove}
      />

      <InviteMemberDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        hasApi={team.capabilities.inviteMember && canCreate}
        onSubmit={handleInvite as Parameters<typeof InviteMemberDialog>[0]["onSubmit"]}
      />
    </div>
  );
}

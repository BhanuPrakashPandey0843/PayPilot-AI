"use client";

import { useCallback } from "react";
import { useApiResource, type UseApiResourceResult } from "./useApiResource";
import {
  getCurrentTeamMember,
  inviteMember,
  updateMemberRole,
  removeMember,
  resendInvitation,
  revokeInvitation,
  TEAM_CAPABILITIES,
  NotAvailableError,
  type CurrentUserResult,
  type TeamMemberRow,
  type TeamRole,
  type InviteMemberInput,
} from "@/lib/api/team";

/**
 * Data hook backing the /team page.
 *
 * Since NO /users or /team list endpoint exists in the backend today
 * (check backend/src/index.ts — no users/team/members/organizations
 * route module is registered; only auth.routes.ts), the only REAL data
 * we can fetch is the current user's own row via GET /auth/me
 * (lib/api/team.ts reuses lib/api/auth.ts's getMe, then projects it
 * into a single TeamMemberRow).
 *
 * Everything else — list size >1, invitations, pending counts — would
 * require fabricating rows. We never fabricate, so this hook:
 *   1. Always returns rows.length === 1 (the viewer) when data loads.
 *   2. Exposes a typed capability bitmap so the UI can render
 *      honest "coming soon" cards instead of forms that 404.
 *   3. Wraps each mutation with error→toast plumbing so even the
 *      "try to invite → it tells you the API isn't there" flow is a
 *      clean, confirmed, auditable user experience rather than a silent
 *      button dead-click.
 */
export interface TeamHookResult {
  members: UseApiResourceResult<TeamMemberRow[]>;
  me: CurrentUserResult | null;
  /** True only after at least one load attempt (success OR failure). */
  hasLoaded: boolean;
  capabilities: typeof TEAM_CAPABILITIES;
  actions: {
    invite: (input: InviteMemberInput) => Promise<{ ok: boolean; message: string }>;
    changeRole: (memberId: string, role: TeamRole) => Promise<{ ok: boolean; message: string }>;
    remove: (memberId: string) => Promise<{ ok: boolean; message: string }>;
    resendInvite: (id: string) => Promise<{ ok: boolean; message: string }>;
    revokeInvite: (id: string) => Promise<{ ok: boolean; message: string }>;
  };
}

function buildMemberRow(me: CurrentUserResult): TeamMemberRow {
  return {
    id: me._memberIdPlaceholder,
    userId: me.user.id,
    organizationId: me.organization.id,
    roleId: me._roleIdPlaceholder,
    email: me.user.email,
    firstName: me.user.firstName,
    lastName: me.user.lastName,
    userStatus: me.status ?? "active",
    membershipStatus: "active",
    role: me.role,
    lastLoginAt: me.lastLoginAt,
    // Use the org_member.created-at column if known; fallback to the
    // user's created-at would need another API call. For the self-row
    // getMe carries no joinedAt, so we show "—" instead of guessing.
    joinedAt: "",
    isCurrentUser: true,
  };
}

async function toAck(
  runner: () => Promise<{ message: string }>
): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await runner();
    return { ok: true, message: res.message };
  } catch (err) {
    if (err instanceof NotAvailableError) return { ok: false, message: err.message };
    return { ok: false, message: err instanceof Error ? err.message : "Action failed" };
  }
}

export function useTeam(): TeamHookResult {
  const meResource = useApiResource(() => getCurrentTeamMember(), ["team-me"]);

  const me = meResource.data ?? null;
  const rows = me ? [buildMemberRow(me)] : [];

  // Project UseApiResourceResult<CurrentUserResult> into
  // UseApiResourceResult<TeamMemberRow[]> while keeping the same
  // isLoading/isError/error states and preserving refetch (still calls
  // getCurrentTeamMember() — i.e. refreshes the viewer).
  const members: UseApiResourceResult<TeamMemberRow[]> = {
    data: meResource.isLoading ? null : rows,
    isLoading: meResource.isLoading,
    error: meResource.error ? (meResource.error ?? "Unable to load team information.") : null,
    refetch: meResource.refetch,
  };

  const actions = {
    invite: useCallback((input: InviteMemberInput) => toAck(() => inviteMember(input)), []),
    changeRole: useCallback(
      (memberId: string, role: TeamRole) => toAck(() => updateMemberRole(memberId, role)),
      []
    ),
    remove: useCallback((memberId: string) => toAck(() => removeMember(memberId)), []),
    resendInvite: useCallback((id: string) => toAck(() => resendInvitation(id)), []),
    revokeInvite: useCallback((id: string) => toAck(() => revokeInvitation(id)), []),
  };

  return {
    members,
    me,
    hasLoaded: !meResource.isLoading,
    capabilities: TEAM_CAPABILITIES,
    actions,
  };
}

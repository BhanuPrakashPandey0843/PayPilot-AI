/**
 * Typed API functions for the Team page (/team).
 *
 * IMPORTANT CAPABILITY INVENTORY (backend/src/index.ts route registration):
 * Only auth.routes.ts is registered under /api/v1/auth — there is NO
 * separate users/team/organizations management route module today. That
 * means the real backend as of this commit supports ONLY:
 *
 *  - POST /auth/register — creates a brand-new organization + first
 *    ORG_ADMIN user (not a team-invite into an existing org).
 *  - POST /auth/login
 *  - GET  /auth/me       — the currently-authenticated user + their
 *    organization + resolved role.
 *
 * The following are EXPLICITLY NOT available yet (frontend must NOT
 * fake them by adding dummy rows or claiming success):
 *  - GET /users / /team / /members — no organization member list endpoint
 *  - POST /users or POST /invitations — no invite flow
 *  - PATCH /users/:id/role — no in-product role change
 *  - DELETE /users/:id or POST /members/:id/remove — no remove member
 *  - No invitations DB schema at all (no invitation table to query or revoke).
 *
 * The permissions "users.read", "users.create", "users.update" exist in
 * lib/permissions.ts + the backend seed, but no route currently wires
 * them via requirePermission(). Those permissions are forward-looking
 * only; we hide their corresponding UI behind an "upcoming" notice so
 * there is no way to accidentally submit to a route that 404s.
 *
 * Exposed below are ONLY the real APIs: the current-user lookup (reused
 * from lib/api/auth.ts's getMe, normalized) plus typed placeholders for
 * the upcoming mutations so the component layer can render a coherent
 * "coming soon" banner instead of silently broken buttons.
 */
import { getMe as getCurrentUserFromAuth } from "./auth";
import type { AuthOrganization, AuthUser } from "./auth";

export type UserStatus = "invited" | "active" | "disabled";
export type MembershipStatus = "invited" | "active" | "suspended" | "removed";
export type TeamRole = "ORG_ADMIN" | "OPERATIONS" | "FINANCE" | "SUPPORT" | "VIEWER";

/**
 * A single team member row as the backend would return it from a future
 * GET /users list endpoint — exactly the join between users +
 * organization_members + roles tables (backend db/schema files for each),
 * mirroring the selectable columns those schemas actually define. No
 * invented columns (no "avatarUrl", no "invitedByName", no "lastActiveAt"
 * unless those actually exist on users.ts — they do not, so we don't
 * invent them here either).
 *
 * Today NO endpoint actually returns a list of these. The Team page uses
 * this shape anyway so that: (1) the table component is typed against
 * what the backend will emit once the endpoint ships, and (2) we can
 * construct exactly ONE row (the current user) from getMe() — because
 * that is the ONLY record we can truthfully render from real data right
 * now.
 */
export interface TeamMemberRow {
  /** organization_members.id (not the userId). */
  id: string;
  userId: string;
  organizationId: string;
  roleId: string;
  email: string;
  firstName: string;
  lastName: string;
  /** users.status enum — independent of membership status. */
  userStatus: UserStatus;
  /** organization_members.status enum. */
  membershipStatus: MembershipStatus;
  /** roles.name — one of ROLE_NAMES, not a role UUID. */
  role: TeamRole;
  /** users.last_login_at — may be null for invited users. */
  lastLoginAt: string | null;
  /** organization_members.created_at — the "joined" timestamp. */
  joinedAt: string;
  /** True if this row represents the viewer of the page. Flag comes from
   *  a client-side comparison of row.userId === session.user.id, not
   *  from the server — see buildCurrentUserRow(). */
  isCurrentUser: boolean;
}

export type CurrentUserResult = {
  user: AuthUser;
  organization: AuthOrganization;
  role: TeamRole;
  status: UserStatus | undefined;
  lastLoginAt: string | null;
  /** The session token only ever carries role NAME — not role ID, and
   *  not org_member ID. Those would have to come from a real list
   *  endpoint; the Team page substitutes a deterministic "N/A" UUID
   *  placeholder for actions-disabled UI purposes and explicitly never
   *  sends them to a mutation endpoint. */
  _roleIdPlaceholder: string;
  _memberIdPlaceholder: string;
};

/**
 * "Who is on this page right now" — the only record the backend can
 * reliably return for the team list today. Wraps GET /auth/me and
 * projects it into the TeamMemberRow shape using placeholders for the
 * IDs getMe() doesn't carry (org_member id, role id).
 *
 * NEVER return more rows from this function. There is no mechanism for
 * constructing additional team members from real data, so inventing
 * rows would mean fabricating users.
 */
export async function getCurrentTeamMember(): Promise<CurrentUserResult> {
  const me = await getCurrentUserFromAuth();
  return {
    user: me.user,
    organization: me.organization,
    role: me.role as TeamRole,
    status: me.status,
    lastLoginAt: me.lastLoginAt,
    _roleIdPlaceholder: "00000000-0000-0000-0000-000000000000",
    _memberIdPlaceholder: "00000000-0000-0000-0000-000000000000",
  };
}

// --- Capability bitmap the UI renders against. True means a backend
//     endpoint exists; false means "show the Coming Soon banner."
//     Flip these to true one-by-one as the corresponding backend routes
//     land (and implement the functions below at the same time).

export const TEAM_CAPABILITIES = {
  /** GET /users or equivalent — org-scoped member list. */
  listMembers: false,
  /** POST /users or /invitations — invite into existing org. */
  inviteMember: false,
  /** PATCH /users/:id/role or /members/:id/role. */
  changeRole: false,
  /** DELETE /users or /members/:id/remove. */
  removeMember: false,
  /** Separate invitations resource (none exists today). */
  listInvitations: false,
  /** Resend invitation email. */
  resendInvitation: false,
  /** Revoke pending invitation. */
  revokeInvitation: false,
};

// --- Upcoming-mutation stubs — typed signatures match the schemas
//     backend/auth.schemas.ts already implements for registerUser, so
//     once the real invite endpoint exists, the UI has nothing to
//     change but a TEAM_CAPABILITIES flag flip.
//
//     For now these functions ALWAYS throw a descriptive error — the
//     component layer catches and shows an "API not yet available"
//     message rather than pretending success or submitting to a 404.

export interface InviteMemberInput {
  email: string;
  role: TeamRole;
  firstName?: string;
  lastName?: string;
}

export async function inviteMember(_input: InviteMemberInput): Promise<{ message: string }> {
  throw new NotAvailableError(
    "Inviting team members via the PayPilot dashboard is not yet supported. " +
      "Team member endpoints (/users, /invitations) are not registered in the backend."
  );
}

export async function updateMemberRole(
  _memberId: string,
  _role: TeamRole
): Promise<{ message: string }> {
  throw new NotAvailableError(
    "Changing a team member's role is not yet supported from this dashboard. " +
      "The backend has no PATCH /users/:id/role endpoint."
  );
}

export async function removeMember(_memberId: string): Promise<{ message: string }> {
  throw new NotAvailableError(
    "Removing team members from this dashboard is not yet supported. " +
      "The backend has no DELETE /users/:id or /members/:id/remove endpoint."
  );
}

export async function resendInvitation(_invitationId: string): Promise<{ message: string }> {
  throw new NotAvailableError(
    "Resending invitations is not yet supported. No invitations endpoint exists today."
  );
}

export async function revokeInvitation(_invitationId: string): Promise<{ message: string }> {
  throw new NotAvailableError(
    "Revoking invitations is not yet supported. No invitations endpoint exists today."
  );
}

/**
 * Distinct error class for "route not implemented" conditions so the UI
 * can distinguish "upcoming capability" from a real network failure.
 * All of the mutation stubs above throw this.
 */
export class NotAvailableError extends Error {
  readonly code = "TEAM_API_NOT_AVAILABLE";
  constructor(message: string) {
    super(message);
    this.name = "NotAvailableError";
  }
}

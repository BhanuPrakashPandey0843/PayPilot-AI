"use client";

import { useApiResource } from "./useApiResource";
import type { UseApiResourceResult } from "./useApiResource";
import { getMe } from "@/lib/api/auth";
import { listAudit, type AuditEvent } from "@/lib/api/audit";

type MeDetails = Awaited<ReturnType<typeof getMe>>;

/** Fresh GET /auth/me — used instead of the cached useSession() value so
 * the Security page always reflects `status`/`lastLoginAt` as of the
 * moment it's opened, not whatever was cached at login time. Separate
 * hook (not a useSession change) since those two extra fields only
 * matter here. */
export function useCurrentUserDetails(): UseApiResourceResult<MeDetails> {
  return useApiResource(() => getMe(), []);
}

/**
 * Real login history for the current user only, via
 * GET /audit?resourceType=user&resourceId=<selfId>&action=USER_LOGIN_SUCCESS
 * (see utils/audit.ts's emitAudit call in auth.service.ts's loginUser —
 * the only USER_LOGIN_* event that actually sets target: { kind: "user",
 * id: user.id }; failed-login attempts don't carry a resourceId to filter
 * on, so they can't be attributed to a specific account this way and are
 * intentionally left out rather than guessed at). Scoped to `userId` so
 * this only ever shows events for the account viewing the page — the
 * backend's org-scoping on top of that means it can never leak another
 * organization's audit trail either.
 */
export function useLoginActivity(userId: string | undefined): UseApiResourceResult<AuditEvent[]> {
  return useApiResource(() => {
    if (!userId) return Promise.resolve([]);
    return listAudit({ resourceType: "user", resourceId: userId, action: "USER_LOGIN_SUCCESS", limit: 10 }).then(
      (res) => res.rows
    );
  }, [userId]);
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearSession, getStoredSession, getToken } from "@/lib/auth/session";
import { getMe } from "@/lib/api/auth";
import type { AuthOrganization, AuthUser } from "@/lib/api/auth";

interface SessionState {
  user: AuthUser;
  organization: AuthOrganization;
  role: string;
}

interface UseSessionResult {
  /** null while the initial check is running, or once redirect-to-login
   * has been triggered. */
  session: SessionState | null;
  /** True only for the brief window before the client-side auth check
   * (storage read + /auth/me revalidation) has resolved. Gate
   * dashboard chrome on this to avoid a flash of empty/unauthenticated
   * UI on first paint. */
  isLoading: boolean;
  logout: () => void;
}

/**
 * Client-side auth guard for the (dashboard) route group. This is the
 * "TODO: session guard" from app/(dashboard)/layout.tsx's original
 * comment — implemented here as a client hook rather than a server
 * component check because the session lives in localStorage/
 * sessionStorage (see lib/auth/session.ts), not a cookie Next's server
 * runtime can read.
 *
 * Flow: read whatever's cached in storage for an instant first paint,
 * then revalidate against GET /auth/me in the background (catches a
 * revoked/disabled account or a role change since last login). If
 * there's no token at all, or /auth/me rejects it, clear storage and
 * redirect to /login.
 */
export function useSession(): UseSessionResult {
  const router = useRouter();
  const [session, setSession] = useState<SessionState | null>(() => {
    const stored = getStoredSession();
    return stored ? { user: stored.user, organization: stored.organization, role: stored.role } : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      if (!getToken()) {
        clearSession();
        router.replace("/login");
        return;
      }

      try {
        const me = await getMe();
        if (cancelled) return;
        setSession(me);
      } catch {
        if (cancelled) return;
        clearSession();
        router.replace("/login");
        return;
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    check();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function logout() {
    clearSession();
    router.replace("/login");
  }

  return { session, isLoading, logout };
}

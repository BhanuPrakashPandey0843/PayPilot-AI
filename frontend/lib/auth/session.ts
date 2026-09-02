import type { AuthSession } from "@/lib/api/auth";

const TOKEN_KEY = "paypilot_token";
const SESSION_KEY = "paypilot_session";

type StoredSession = Omit<AuthSession, "token">;

/**
 * localStorage/sessionStorage-backed session storage. The dashboard route
 * group (app/(dashboard)/layout.tsx) has a TODO for a real server-side
 * session guard — this is the client-side half that exists today:
 * signup/login write here, and anything that calls the API as the
 * signed-in user reads the token back via getToken().
 *
 * `persist` is the Login page's "Remember me": true (the default — also
 * what signup always uses, since there's no checkbox there) writes to
 * localStorage so the session survives closing the browser; false writes
 * to sessionStorage instead, so it clears when the tab closes. Reads
 * check both storages, since a fresh page load can't otherwise know
 * which one a previous save used.
 */
export function saveSession(session: AuthSession, persist: boolean = true): void {
  if (typeof window === "undefined") return;
  clearSession();
  const store = persist ? window.localStorage : window.sessionStorage;
  store.setItem(TOKEN_KEY, session.token);
  const stored: StoredSession = {
    user: session.user,
    organization: session.organization,
    role: session.role,
  };
  store.setItem(SESSION_KEY, JSON.stringify(stored));
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY) ?? window.sessionStorage.getItem(TOKEN_KEY);
}

export function getStoredSession(): StoredSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SESSION_KEY) ?? window.sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

/** Cheap client-side check — a valid-shaped token in storage, nothing
 * more. Used to skip the login form entirely for an already-signed-in
 * visitor; the actual JWT verification always happens server-side. */
export function isAuthenticated(): boolean {
  return getToken() !== null;
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(SESSION_KEY);
  window.sessionStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(SESSION_KEY);
}

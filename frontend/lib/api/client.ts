/**
 * Thin fetch wrapper around the PayPilot AI backend's standard response
 * envelope — { success: true, data } | { success: false, error }. Every
 * API module (auth, and whatever follows it) should go through this
 * rather than calling fetch() directly, so error-shape handling only
 * lives in one place. See backend/src/utils/response.ts / errors.ts for
 * the server-side source of truth this mirrors.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:4000/api/v1";

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface SuccessEnvelope<T> {
  success: true;
  data: T;
}

interface FailEnvelope {
  success: false;
  error: { code: string; message: string; details?: unknown };
}

/**
 * Reads the stored session token (lib/auth/session.ts) and returns an
 * Authorization header when one exists. Harmless to attach on every
 * request, including the public /auth/login and /auth/register calls
 * that won't have a token yet (getToken() returns null pre-login, so
 * the header is simply omitted) — keeps this the one place that knows
 * how to authenticate a request instead of every call site re-reading
 * storage itself.
 */
function authHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  // Inlined (not imported from lib/auth/session.ts) to dodge a
  // client.ts <-> auth/session.ts <-> api/auth.ts import cycle. Keep
  // this key in sync with TOKEN_KEY in lib/auth/session.ts.
  const TOKEN_KEY = "paypilot_token";
  const token = window.localStorage.getItem(TOKEN_KEY) ?? window.sessionStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...authHeader(),
        ...init?.headers,
      },
    });
  } catch {
    // fetch() itself threw — offline, DNS failure, backend not running.
    // status 0 is the sentinel callers check for "couldn't even reach it".
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "Could not reach the PayPilot AI server. Make sure the backend is running and try again."
    );
  }

  let body: SuccessEnvelope<T> | FailEnvelope | undefined;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }

  if (!response.ok || !body || body.success === false) {
    const fail = body && body.success === false ? body : undefined;
    throw new ApiError(
      response.status,
      fail?.error.code ?? "UNKNOWN_ERROR",
      fail?.error.message ?? "Something went wrong. Please try again.",
      fail?.error.details
    );
  }

  return body.data;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, payload?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: payload !== undefined ? JSON.stringify(payload) : undefined,
    }),
};

import { apiClient } from "./client";

export interface RegisterInput {
  organizationName: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface AuthOrganization {
  id: string;
  name: string;
  slug: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
  organization: AuthOrganization;
  role: string;
}

interface RegisterResponse {
  user: AuthUser;
  organization: AuthOrganization;
  role: string;
}

/**
 * POST /auth/register creates the organization + ORG_ADMIN user but does
 * NOT return a token — only POST /auth/login signs one (see
 * backend/src/modules/auth/auth.service.ts: registerUser vs loginUser).
 * So a real "sign up" always needs a follow-up login call — that's what
 * registerAndSignIn does below. Callers that only need the account
 * created (no session) can call registerOrganization directly.
 */
export function registerOrganization(input: RegisterInput): Promise<RegisterResponse> {
  return apiClient.post<RegisterResponse>("/auth/register", input);
}

export function login(input: LoginInput): Promise<AuthSession> {
  return apiClient.post<AuthSession>("/auth/login", input);
}

export async function registerAndSignIn(input: RegisterInput): Promise<AuthSession> {
  await registerOrganization(input);
  return login({ email: input.email, password: input.password });
}

interface ForgotPasswordResponse {
  message: string;
}

/**
 * POST /auth/forgot-password — NOTE: this route does not exist in the
 * backend yet (only /auth/register, /auth/login, /auth/me are
 * registered in modules/auth/auth.routes.ts as of this writing). This
 * function is written against the contract the ForgotPasswordForm
 * expects once it's built: body { email }, response { message } sent
 * through the same { success, data } envelope as every other auth
 * route. Until that route ships, calling this will fail with a 404
 * from apiClient (surfaced as a normal ApiError, not swallowed) — see
 * ForgotPasswordForm's error handling for how that's shown to the user.
 *
 * When implementing the backend route, follow auth.service.ts's
 * loginUser() pattern: look up the user, and — regardless of whether
 * the email exists — return the same generic { message } and only
 * actually create a reset token + send an email if it does. Never let
 * the response shape or timing reveal whether an account exists.
 */
export function requestPasswordReset(email: string): Promise<ForgotPasswordResponse> {
  return apiClient.post<ForgotPasswordResponse>("/auth/forgot-password", { email });
}

export interface MeResponse {
  user: AuthUser;
  organization: AuthOrganization;
  // IMPORTANT: unlike login/register (role: string), GET /auth/me
  // returns role as the full { id, name } row (see auth.service.ts's
  // getMe — covered by backend test (B5b), which asserts
  // `body.data.role.name`) — or undefined if the membership lookup
  // came back empty. Do not assume this matches AuthSession.role's
  // shape; normalize with the `.name` extraction in getMe() below
  // rather than fixing it up at every call site.
  role: { id: string; name: string } | undefined;
}

/**
 * GET /auth/me — re-verifies the stored token against the live user
 * status (see backend authenticate.ts) rather than trusting whatever
 * was cached in storage at login time. Used by useSession() to catch a
 * disabled account or a role change without waiting for the token to
 * expire.
 *
 * Normalizes the raw response's `role: { id, name }` down to a plain
 * role-name string, matching AuthSession.role from login/register —
 * see the MeResponse doc comment for why that normalization has to
 * happen here rather than being assumed away.
 */
export async function getMe(): Promise<{ user: AuthUser; organization: AuthOrganization; role: string }> {
  const raw = await apiClient.get<MeResponse>("/auth/me");
  return { user: raw.user, organization: raw.organization, role: raw.role?.name ?? "" };
}

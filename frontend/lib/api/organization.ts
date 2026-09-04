/**
 * Typed API for the Organization Settings page (/settings/organization).
 * Backed by the new GET/PATCH /organizations/me routes
 * (backend/src/modules/organizations/) - added because the org's own
 * `organizations` table already had real `currency`/`timezone` columns
 * (organizations.ts) that no route exposed yet; GET /auth/me's getMe()
 * has been extended to select them too (see lib/api/auth.ts's
 * AuthOrganization), but this page uses the dedicated /organizations/me
 * endpoint directly rather than reusing the auth session cache, so a
 * save here is reflected immediately without waiting on a session
 * refresh.
 */
import { apiClient } from "./client";

export type OrganizationStatus = "active" | "suspended" | "inactive";

export interface OrganizationSettings {
  id: string;
  name: string;
  slug: string;
  status: OrganizationStatus;
  currency: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateOrganizationInput {
  name?: string;
  currency?: string;
  timezone?: string;
}

export function getOrganization(): Promise<OrganizationSettings> {
  return apiClient.get<OrganizationSettings>("/organizations/me");
}

export function updateOrganization(input: UpdateOrganizationInput): Promise<OrganizationSettings> {
  return apiClient.patch<OrganizationSettings>("/organizations/me", input);
}

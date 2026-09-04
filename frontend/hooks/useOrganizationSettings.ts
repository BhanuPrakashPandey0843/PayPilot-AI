"use client";

import { useApiResource } from "./useApiResource";
import type { UseApiResourceResult } from "./useApiResource";
import { getOrganization, type OrganizationSettings } from "@/lib/api/organization";

/**
 * GET /organizations/me for the Organization Settings page
 * (/settings/organization) — real backend endpoint (see
 * backend/src/modules/organizations/), added because the organizations
 * table already had real currency/timezone columns that no route
 * exposed. Same useApiResource pattern as useSecuritySettings's
 * useCurrentUserDetails.
 */
export function useOrganizationSettings(): UseApiResourceResult<OrganizationSettings> {
  return useApiResource(() => getOrganization(), []);
}

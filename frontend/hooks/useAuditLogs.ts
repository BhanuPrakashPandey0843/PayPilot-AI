"use client";

import { useApiResource } from "./useApiResource";
import type { UseApiResourceResult } from "./useApiResource";
import { listAudit, countAudit, type AuditListFilters, type AuditListResult } from "@/lib/api/audit";

/** Main filtered/paginated list backing the Audit Table + page-level
 * Timeline section. */
export function useAuditList(filters: AuditListFilters): UseApiResourceResult<AuditListResult> {
  return useApiResource(
    () => listAudit(filters),
    [filters.page, filters.limit, filters.resourceType, filters.resourceId, filters.action]
  );
}

/**
 * Exact count for one action/resourceType, via a limit:1 request's
 * meta.total. Used by the summary cards — real numbers, not estimates,
 * just each scoped to a single filter since the backend only supports
 * one dimension (resourceType OR action) per request, not both being
 * summed across values.
 */
export function useAuditCount(filters: Omit<AuditListFilters, "page" | "limit">): UseApiResourceResult<number> {
  return useApiResource(() => countAudit(filters), [filters.resourceType, filters.resourceId, filters.action]);
}

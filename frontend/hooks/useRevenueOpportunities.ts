"use client";

import { useApiResource } from "./useApiResource";
import type { UseApiResourceResult } from "./useApiResource";
import {
  listOpportunities,
  type OpportunityListResult,
  type OpportunityType,
  type OpportunityStatus,
} from "@/lib/api/dashboard";

export interface OpportunityListFilters {
  type?: OpportunityType;
  status?: OpportunityStatus;
  page: number;
  limit: number;
  sort: "score" | "createdAt" | "estimatedRevenueImpact";
}

/** Main filtered/paginated list backing the Revenue Opportunities page,
 * via GET /revenue/opportunities. */
export function useOpportunityList(filters: OpportunityListFilters): UseApiResourceResult<OpportunityListResult> {
  return useApiResource(
    () => listOpportunities(filters),
    [filters.type, filters.status, filters.page, filters.limit, filters.sort]
  );
}

/**
 * Exact count for one status, via a limit:1 request's meta.total — same
 * "count via getPaginated's meta" pattern as useAuditLogs.ts's
 * useAuditCount and useDashboardHome.ts's useOpportunityCount. Kept
 * local to this page (rather than importing the dashboard-home one)
 * since it needs to cover the full OpportunityStatus set, not just
 * OPEN/EXECUTED.
 */
export function useOpportunityStatusCount(status: OpportunityStatus): UseApiResourceResult<number> {
  return useApiResource(() => listOpportunities({ status, limit: 1 }).then((r) => r.meta.total), [status]);
}

/**
 * Typed API functions for the Audit Logs page (/audit-logs).
 *
 * Backed by the one real audit endpoint this project has —
 * GET /api/v1/audit (backend/src/modules/audit/audit.routes.ts) — which
 * supports pagination plus three exact-match filters: resourceType,
 * resourceId, action. There is no server-side date-range or actorType
 * filter and no separate stats/aggregate endpoint, so summary counts on
 * this page are built out of the same list endpoint (see
 * hooks/useAuditLogs.ts) rather than invented.
 */
import { apiClient } from "./client";
import type { PaginatedMeta } from "./dashboard";

export type AuditActorType = "USER" | "AI_AGENT" | "SYSTEM";

/** Mirrors AuditTarget["kind"] in backend/src/utils/audit.ts. */
export type AuditResourceType =
  | "user"
  | "organization"
  | "membership"
  | "role"
  | "permission"
  | "product"
  | "customer"
  | "order"
  | "payment"
  | "payment_attempt"
  | "checkout"
  | "webhook_event"
  | "ai_action"
  | "revenue_opportunity"
  | "analytics";

export interface AuditEvent {
  id: string;
  organizationId: string;
  actorType: AuditActorType;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  reason: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface AuditListResult {
  rows: AuditEvent[];
  meta: PaginatedMeta;
}

export interface AuditListFilters {
  page?: number;
  limit?: number;
  resourceType?: string;
  resourceId?: string;
  action?: string;
}

export function listAudit(opts: AuditListFilters = {}): Promise<AuditListResult> {
  const { page = 1, limit = 20, resourceType, resourceId, action } = opts;
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (resourceType) params.set("resourceType", resourceType);
  if (resourceId) params.set("resourceId", resourceId);
  if (action) params.set("action", action);

  return apiClient
    .getPaginated<AuditEvent[]>(`/audit?${params.toString()}`)
    .then((res) => ({
      rows: res.data,
      meta: res.meta ?? { page, limit, total: res.data.length, totalPages: 1 },
    }));
}

/**
 * Exact count for one filter combination, via meta.total on a
 * limit:1 request — cheap way to get a real number for a summary card
 * without a dedicated stats endpoint. Never returns the rows.
 */
export function countAudit(filters: Omit<AuditListFilters, "page" | "limit"> = {}): Promise<number> {
  return listAudit({ ...filters, page: 1, limit: 1 }).then((res) => res.meta.total);
}

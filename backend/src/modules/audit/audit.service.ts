import { buildPaginationMeta } from "../../utils/response.js";
import { listAuditLogsForOrg, type AuditFilters, type AuditPagination } from "./audit.repository.js";

export async function listAuditForOrg(organizationId: string, filters: AuditFilters, pagination: AuditPagination) {
  const { rows, total } = await listAuditLogsForOrg(organizationId, filters, pagination);
  return { rows, meta: buildPaginationMeta(pagination, total) };
}

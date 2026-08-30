import { and, count, desc, eq } from "drizzle-orm";
import { db, type Executor } from "../../db/index.js";
import { auditLogs, type AuditLog } from "../../db/schema/audit_logs.js";

export interface AuditFilters {
  resourceType?: string;
  resourceId?: string;
  action?: string;
}

export interface AuditPagination {
  page: number;
  limit: number;
}

export async function listAuditLogsForOrg(
  organizationId: string,
  filters: AuditFilters,
  pagination: AuditPagination,
  executor: Executor = db
): Promise<{ rows: AuditLog[]; total: number }> {
  const conditions = [eq(auditLogs.organizationId, organizationId)];
  if (filters.resourceType) conditions.push(eq(auditLogs.resourceType, filters.resourceType));
  if (filters.resourceId) conditions.push(eq(auditLogs.resourceId, filters.resourceId));
  if (filters.action) conditions.push(eq(auditLogs.action, filters.action));
  const where = and(...conditions);

  const offset = (pagination.page - 1) * pagination.limit;
  const [rows, [{ total }]] = await Promise.all([
    executor.select().from(auditLogs).where(where).orderBy(desc(auditLogs.createdAt)).limit(pagination.limit).offset(offset),
    executor.select({ total: count() }).from(auditLogs).where(where),
  ]);

  return { rows, total };
}

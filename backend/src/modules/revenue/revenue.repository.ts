import { and, eq, inArray, desc, asc, count } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  revenueOpportunities,
  type NewRevenueOpportunity,
  type RevenueOpportunity,
  type RevenueOpportunityStatus,
  type RevenueOpportunityType,
  type RevenueOpportunitySeverity,
} from "../../db/schema/revenue_opportunities.js";
import { customers } from "../../db/schema/customers.js";
import { products } from "../../db/schema/products.js";

/**
 * Persists (or refreshes) one detected opportunity for an organization.
 *
 * Uses the (organizationId, dedupeKey) unique index as the upsert target
 * — re-running detection for the SAME underlying pattern updates the
 * existing row with fresh evidence/score instead of creating a duplicate
 * open opportunity every run (see revenue_opportunities.ts schema doc).
 *
 * Deliberately does NOT touch `status`, `approvedBy`, `approvedAt`, or
 * `rejectedReason` on conflict — a merchant's approval/rejection decision
 * on an opportunity must never be silently reverted just because the
 * detection engine ran again with fresh numbers.
 */
export async function upsertOpportunity(
  organizationId: string,
  values: Omit<NewRevenueOpportunity, "organizationId" | "id" | "createdAt" | "updatedAt" | "status">
): Promise<RevenueOpportunity> {
  const [row] = await db
    .insert(revenueOpportunities)
    .values({ ...values, organizationId })
    .onConflictDoUpdate({
      target: [revenueOpportunities.organizationId, revenueOpportunities.dedupeKey],
      set: {
        title: values.title,
        description: values.description,
        severity: values.severity,
        score: values.score,
        confidence: values.confidence,
        estimatedRevenueImpact: values.estimatedRevenueImpact,
        currency: values.currency,
        evidence: values.evidence,
        recommendedAction: values.recommendedAction,
        updatedAt: new Date(),
      },
    })
    .returning();
  return row;
}

export interface OpportunityFilters {
  type?: RevenueOpportunityType;
  status?: RevenueOpportunityStatus;
  severity?: RevenueOpportunitySeverity;
}

export interface Pagination {
  page: number;
  limit: number;
}

export async function listOpportunitiesForOrg(
  organizationId: string,
  filters: OpportunityFilters,
  pagination: Pagination,
  sorting: { sort: "score" | "createdAt" | "estimatedRevenueImpact"; order: "asc" | "desc" }
): Promise<{ rows: RevenueOpportunity[]; total: number }> {
  const conditions = [eq(revenueOpportunities.organizationId, organizationId)];
  if (filters.type) conditions.push(eq(revenueOpportunities.type, filters.type));
  if (filters.status) conditions.push(eq(revenueOpportunities.status, filters.status));
  if (filters.severity) conditions.push(eq(revenueOpportunities.severity, filters.severity));
  const where = and(...conditions);

  const sortColMap = {
    score: revenueOpportunities.score,
    createdAt: revenueOpportunities.createdAt,
    estimatedRevenueImpact: revenueOpportunities.estimatedRevenueImpact,
  } as const;
  const orderFn = sorting.order === "asc" ? asc : desc;
  const offset = (pagination.page - 1) * pagination.limit;

  const [rows, [{ total }]] = await Promise.all([
    db
      .select()
      .from(revenueOpportunities)
      .where(where)
      .orderBy(orderFn(sortColMap[sorting.sort]))
      .limit(pagination.limit)
      .offset(offset),
    db.select({ total: count() }).from(revenueOpportunities).where(where),
  ]);

  return { rows, total: Number(total) };
}

export async function getOpportunityByIdScoped(
  organizationId: string,
  id: string
): Promise<RevenueOpportunity | undefined> {
  const [row] = await db
    .select()
    .from(revenueOpportunities)
    .where(and(eq(revenueOpportunities.id, id), eq(revenueOpportunities.organizationId, organizationId)))
    .limit(1);
  return row;
}

export async function updateOpportunityStatus(
  organizationId: string,
  id: string,
  values: {
    status: RevenueOpportunityStatus;
    approvedBy?: string | null;
    approvedAt?: Date | null;
    rejectedReason?: string | null;
  }
): Promise<RevenueOpportunity | undefined> {
  const [row] = await db
    .update(revenueOpportunities)
    .set({ ...values, updatedAt: new Date() })
    .where(and(eq(revenueOpportunities.id, id), eq(revenueOpportunities.organizationId, organizationId)))
    .returning();
  return row;
}

/**
 * Milestone 6 Phase 7/8/12 — compare-and-swap status transition for the
 * EXECUTE flow (APPROVED -> EXECUTING -> EXECUTED|FAILED). Requiring the
 * row to STILL be in `fromStatus` at UPDATE time is what makes execution
 * idempotent under concurrency (Rule 14): two overlapping
 * POST .../execute requests for the same opportunity can never both win
 * the APPROVED -> EXECUTING transition, so the action body
 * (revenue.execution.ts) can never run twice for one approval. Returns
 * `undefined` if the row wasn't in `fromStatus` — callers must re-fetch
 * to see what actually happened rather than assuming their own read was
 * still current.
 */
export async function casTransitionOpportunityExecution(
  organizationId: string,
  id: string,
  fromStatus: RevenueOpportunityStatus,
  values: {
    status: RevenueOpportunityStatus;
    executedBy?: string | null;
    executedAt?: Date | null;
    executionResult?: Record<string, unknown> | null;
    executionFailureReason?: string | null;
  }
): Promise<RevenueOpportunity | undefined> {
  const [row] = await db
    .update(revenueOpportunities)
    .set({ ...values, updatedAt: new Date() })
    .where(
      and(
        eq(revenueOpportunities.id, id),
        eq(revenueOpportunities.organizationId, organizationId),
        eq(revenueOpportunities.status, fromStatus)
      )
    )
    .returning();
  return row;
}

/** Small lookup helpers so the engine never has to guess names for its evidence. */
export async function getCustomerNamesByIds(
  organizationId: string,
  ids: string[]
): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();
  const rows = await db
    .select({ id: customers.id, name: customers.name })
    .from(customers)
    .where(and(eq(customers.organizationId, organizationId), inArray(customers.id, ids)));
  return new Map(rows.map((r) => [r.id, r.name]));
}

export async function getProductPricesByIds(
  organizationId: string,
  ids: string[]
): Promise<Map<string, { name: string; price: number; category: string | null }>> {
  if (ids.length === 0) return new Map();
  const rows = await db
    .select({ id: products.id, name: products.name, price: products.price, category: products.category })
    .from(products)
    .where(and(eq(products.organizationId, organizationId), inArray(products.id, ids)));
  return new Map(rows.map((r) => [r.id, { name: r.name, price: r.price, category: r.category }]));
}

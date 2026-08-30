import { z } from "zod";
import { paginationQuerySchema, paginationQueryJsonSchema } from "../../utils/pagination.js";

export const OPPORTUNITY_TYPES = ["CROSS_SELL", "UPSELL", "PAYMENT_RECOVERY", "ABANDONED_CHECKOUT", "REVENUE_DROP"] as const;
export const OPPORTUNITY_STATUSES = ["OPEN", "APPROVED", "REJECTED", "EXECUTING", "EXECUTED", "FAILED", "EXPIRED"] as const;
export const OPPORTUNITY_SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

export const listOpportunitiesQuerySchema = paginationQuerySchema.extend({
  type: z.enum(OPPORTUNITY_TYPES).optional(),
  status: z.enum(OPPORTUNITY_STATUSES).optional(),
  severity: z.enum(OPPORTUNITY_SEVERITIES).optional(),
  sort: z.enum(["score", "createdAt", "estimatedRevenueImpact"]).default("score"),
  order: z.enum(["asc", "desc"]).default("desc"),
});
export type ListOpportunitiesQuery = z.infer<typeof listOpportunitiesQuerySchema>;

export const listOpportunitiesQueryJsonSchema = {
  type: "object",
  properties: {
    ...paginationQueryJsonSchema.properties,
    type: { type: "string", enum: OPPORTUNITY_TYPES },
    status: { type: "string", enum: OPPORTUNITY_STATUSES },
    severity: { type: "string", enum: OPPORTUNITY_SEVERITIES },
    sort: { type: "string", enum: ["score", "createdAt", "estimatedRevenueImpact"] },
    order: { type: "string", enum: ["asc", "desc"] },
  },
} as const;

export const opportunityIdParamsSchema = z.object({ id: z.string().uuid("id must be a valid UUID") });
export const opportunityIdParamsJsonSchema = {
  type: "object",
  properties: { id: { type: "string", description: "UUID" } },
} as const;

export const rejectOpportunityBodySchema = z.object({
  reason: z.string().trim().min(1).max(2000).optional(),
});
export type RejectOpportunityBody = z.infer<typeof rejectOpportunityBodySchema>;
export const rejectOpportunityBodyJsonSchema = {
  type: "object",
  properties: { reason: { type: "string", description: "Optional reason shown in the audit trail." } },
} as const;

export const opportunityResponseJsonSchema = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    data: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
        organizationId: { type: "string", format: "uuid" },
        type: { type: "string", enum: OPPORTUNITY_TYPES },
        dedupeKey: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        status: { type: "string", enum: OPPORTUNITY_STATUSES },
        severity: { type: "string", enum: OPPORTUNITY_SEVERITIES },
        score: { type: "integer" },
        confidence: { type: "integer" },
        estimatedRevenueImpact: { type: "integer", description: "Integer minor units" },
        currency: { type: "string" },
        evidence: { type: "object" },
        recommendedAction: { type: ["object", "null"] },
        approvedBy: { type: ["string", "null"] },
        approvedAt: { type: ["string", "null"] },
        rejectedReason: { type: ["string", "null"] },
        executedBy: { type: ["string", "null"] },
        executedAt: { type: ["string", "null"] },
        executionResult: { type: ["object", "null"], description: "Structured, real outcome of executing recommendedAction — never fabricated." },
        executionFailureReason: { type: ["string", "null"] },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" },
      },
    },
  },
} as const;

export const opportunityListResponseJsonSchema = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    data: { type: "array", items: opportunityResponseJsonSchema.properties.data },
    meta: {
      type: "object",
      properties: { page: { type: "integer" }, limit: { type: "integer" }, total: { type: "integer" }, totalPages: { type: "integer" } },
    },
  },
} as const;

export const detectResponseJsonSchema = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    data: {
      type: "object",
      properties: {
        detected: { type: "integer" },
        opportunities: { type: "array", items: opportunityResponseJsonSchema.properties.data },
      },
    },
  },
} as const;

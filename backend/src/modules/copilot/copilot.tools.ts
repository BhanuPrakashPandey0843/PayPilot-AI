/**
 * Milestone 6 Phase 7 — bounded AI tool layer.
 *
 * Every tool here:
 *   - takes organizationId as an explicit first argument, supplied ONLY
 *     by copilot.service.ts from the authenticated request context —
 *     never from AI-model output or tool `input` (Phase 10: never trust
 *     organizationId from AI output/tool arguments).
 *   - validates its `input` with Zod before touching any service.
 *   - is read-only. There is no tool here that mutates data — approving
 *     or rejecting a revenue opportunity stays behind its own
 *     human-driven REST endpoint (revenue.routes.ts), never a tool call.
 *   - calls existing, already org-scoped services — never the database
 *     directly (same rule commerce-agent/tools.service.ts follows).
 */
import { z } from "zod";
import { Errors } from "../../utils/errors.js";
import { dateRangeQuerySchema, type DateRangeQuery } from "../analytics/analytics.schemas.js";
import { getOverview, getRevenueTrend, getProductAnalyticsResult, getPaymentAnalytics } from "../analytics/analytics.service.js";
import { listOpportunities } from "../revenue/revenue.service.js";
import { getOpportunityByIdScoped } from "../revenue/revenue.repository.js";
import { getAgentRecommendations } from "../agent/agent.service.js";
import type { AIToolSpec } from "../ai/provider.types.js";

const rangeArgShape = {
  range: z.enum(["today", "7d", "30d", "90d"]).default("30d"),
};
const rangeArgSchema = z.object(rangeArgShape);
const rangeArgJsonSchema = {
  type: "object",
  properties: { range: { type: "string", enum: ["today", "7d", "30d", "90d"], description: "Time window. Default 30d." } },
} as const;

function toDateRangeQuery(range: "today" | "7d" | "30d" | "90d"): DateRangeQuery {
  return dateRangeQuerySchema.parse({ range });
}

export interface CopilotTool {
  spec: AIToolSpec;
  execute: (organizationId: string, rawInput: unknown) => Promise<unknown>;
}

const tools: Record<string, CopilotTool> = {
  getRevenueOverview: {
    spec: {
      name: "getRevenueOverview",
      description: "Backend-calculated revenue/order/payment KPI overview for a time window: total revenue, order count, payment success rate, average order value, revenue growth vs. previous period, top product, revenue at risk.",
      input_schema: rangeArgJsonSchema,
    },
    execute: async (organizationId, rawInput) => {
      const { range } = rangeArgSchema.parse(rawInput ?? {});
      return getOverview(organizationId, toDateRangeQuery(range));
    },
  },

  getRevenueTrend: {
    spec: {
      name: "getRevenueTrend",
      description: "Revenue trend for a time window: current vs. previous equal-length period, percentage change, and a daily series.",
      input_schema: rangeArgJsonSchema,
    },
    execute: async (organizationId, rawInput) => {
      const { range } = rangeArgSchema.parse(rawInput ?? {});
      return getRevenueTrend(organizationId, toDateRangeQuery(range));
    },
  },

  getProductPerformance: {
    spec: {
      name: "getProductPerformance",
      description: "Per-product performance for a time window: revenue, units sold, order count, average selling price. Sorted by revenue, highest first.",
      input_schema: {
        type: "object",
        properties: {
          range: { type: "string", enum: ["today", "7d", "30d", "90d"], description: "Time window. Default 30d." },
          limit: { type: "integer", minimum: 1, maximum: 20, description: "Max products to return. Default 10." },
        },
      },
    },
    execute: async (organizationId, rawInput) => {
      const { range, limit } = z
        .object({ range: z.enum(["today", "7d", "30d", "90d"]).default("30d"), limit: z.number().int().min(1).max(20).default(10) })
        .parse(rawInput ?? {});
      const query = { ...toDateRangeQuery(range), page: 1, limit, sort: "revenue" as const, order: "desc" as const };
      return getProductAnalyticsResult(organizationId, query);
    },
  },

  getPaymentPerformance: {
    spec: {
      name: "getPaymentPerformance",
      description: "Payment success/failure/pending breakdown for a time window, failure reasons, and repeat-failure-customer recovery signal.",
      input_schema: rangeArgJsonSchema,
    },
    execute: async (organizationId, rawInput) => {
      const { range } = rangeArgSchema.parse(rawInput ?? {});
      return getPaymentAnalytics(organizationId, toDateRangeQuery(range));
    },
  },

  getRevenueOpportunities: {
    spec: {
      name: "getRevenueOpportunities",
      description: "List deterministically detected revenue opportunities (CROSS_SELL, UPSELL, PAYMENT_RECOVERY, ABANDONED_CHECKOUT, REVENUE_DROP), highest score first. Each has a score, confidence, estimated revenue impact, and evidence.",
      input_schema: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["CROSS_SELL", "UPSELL", "PAYMENT_RECOVERY", "ABANDONED_CHECKOUT", "REVENUE_DROP"] },
          status: { type: "string", enum: ["OPEN", "APPROVED", "REJECTED", "EXECUTING", "EXECUTED", "FAILED", "EXPIRED"], description: "Default OPEN." },
          limit: { type: "integer", minimum: 1, maximum: 20, description: "Default 10." },
        },
      },
    },
    execute: async (organizationId, rawInput) => {
      const parsed = z
        .object({
          type: z.enum(["CROSS_SELL", "UPSELL", "PAYMENT_RECOVERY", "ABANDONED_CHECKOUT", "REVENUE_DROP"]).optional(),
          status: z.enum(["OPEN", "APPROVED", "REJECTED", "EXECUTING", "EXECUTED", "FAILED", "EXPIRED"]).default("OPEN"),
          limit: z.number().int().min(1).max(20).default(10),
        })
        .parse(rawInput ?? {});
      const { rows } = await listOpportunities(
        organizationId,
        { type: parsed.type, status: parsed.status },
        { page: 1, limit: parsed.limit },
        { sort: "score", order: "desc" }
      );
      return { opportunities: rows };
    },
  },

  getOpportunityDetails: {
    spec: {
      name: "getOpportunityDetails",
      description: "Full detail (including evidence) for a single revenue opportunity by ID.",
      input_schema: { type: "object", properties: { id: { type: "string", description: "Opportunity UUID" } }, required: ["id"] },
    },
    execute: async (organizationId, rawInput) => {
      const { id } = z.object({ id: z.string().uuid() }).parse(rawInput);
      const row = await getOpportunityByIdScoped(organizationId, id);
      if (!row) throw Errors.notFound("Revenue opportunity not found");
      return row;
    },
  },

  getProductRecommendations: {
    spec: {
      name: "getProductRecommendations",
      description: "Deterministic, explainable upsell/cross-sell recommendations for a given product ID (same logic used by the commerce agent's catalog).",
      input_schema: { type: "object", properties: { productId: { type: "string", description: "Product UUID" } }, required: ["productId"] },
    },
    execute: async (organizationId, rawInput) => {
      const { productId } = z.object({ productId: z.string().uuid() }).parse(rawInput);
      return getAgentRecommendations(organizationId, productId);
    },
  },
};

export function listToolSpecs(): AIToolSpec[] {
  return Object.values(tools).map((t) => t.spec);
}

export function getTool(name: string): CopilotTool | undefined {
  return tools[name];
}

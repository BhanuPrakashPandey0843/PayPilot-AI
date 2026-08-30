/**
 * Milestone 6 — Revenue Analytics API.
 *
 * Thin routes only: auth -> RBAC -> Zod validation -> analytics.service.
 * Every query is scoped to `request.authUser.organizationId`, which is
 * derived server-side from the verified JWT — organizationId is never
 * accepted from the client (query/body/params), per the tenant-isolation
 * rule that applies everywhere else in this codebase.
 */
import type { FastifyInstance } from "fastify";
import { requirePermission } from "../../middleware/authorize.js";
import { Errors } from "../../utils/errors.js";
import { ok } from "../../utils/response.js";
import { parseOrThrow } from "../../utils/validate.js";
import { emitAudit } from "../../utils/audit.js";
import {
  dateRangeQuerySchema,
  dateRangeQueryJsonSchema,
  productAnalyticsQuerySchema,
  productAnalyticsQueryJsonSchema,
  type DateRangeQuery,
  type ProductAnalyticsQuery,
} from "./analytics.schemas.js";
import {
  getOverview,
  getRevenueTrend,
  getProductAnalyticsResult,
  getPaymentAnalytics,
} from "./analytics.service.js";

const envelope = (dataSchema: object) =>
  ({
    type: "object",
    properties: { success: { type: "boolean" }, data: dataSchema },
  }) as const;

const periodSchema = {
  type: "object",
  properties: { from: { type: "string", format: "date-time" }, to: { type: "string", format: "date-time" } },
} as const;

const overviewResponseJsonSchema = envelope({
  type: "object",
  properties: {
    period: periodSchema,
    totalRevenueMinor: { type: "integer" },
    currency: { type: "string" },
    orderCount: { type: "integer" },
    successfulPayments: { type: "integer" },
    failedPayments: { type: "integer" },
    pendingPayments: { type: "integer" },
    paymentSuccessRatePercent: { type: ["number", "null"] },
    averageOrderValueMinor: { type: ["integer", "null"] },
    conversionRatePercent: { type: ["number", "null"] },
    conversionRateNote: { type: "string" },
    revenueGrowthPercent: { type: ["number", "null"] },
    topProduct: { type: ["object", "null"] },
    revenueAtRiskMinor: { type: "integer" },
    revenueAtRiskOrderCount: { type: "integer" },
  },
});

const revenueTrendResponseJsonSchema = envelope({
  type: "object",
  properties: {
    period: periodSchema,
    current: { type: "object", properties: { revenueMinor: { type: "integer" }, orders: { type: "integer" } } },
    previous: { type: "object", properties: { revenueMinor: { type: "integer" }, orders: { type: "integer" } } },
    change: {
      type: "object",
      properties: { revenuePercent: { type: ["number", "null"] }, ordersPercent: { type: ["number", "null"] } },
    },
    series: {
      type: "array",
      items: {
        type: "object",
        properties: {
          bucket: { type: "string" },
          revenueMinor: { type: "integer" },
          orderCount: { type: "integer" },
        },
      },
    },
  },
});

const productAnalyticsResponseJsonSchema = envelope({
  type: "object",
  properties: {
    period: periodSchema,
    products: {
      type: "array",
      items: {
        type: "object",
        properties: {
          productId: { type: ["string", "null"] },
          productName: { type: "string" },
          revenueMinor: { type: "integer" },
          unitsSold: { type: "integer" },
          orderCount: { type: "integer" },
          averageSellingPriceMinor: { type: "integer" },
          isActive: { type: "boolean" },
        },
      },
    },
    meta: {
      type: "object",
      properties: { page: { type: "integer" }, limit: { type: "integer" }, total: { type: "integer" }, totalPages: { type: "integer" } },
    },
  },
});

const paymentAnalyticsResponseJsonSchema = envelope({
  type: "object",
  properties: {
    period: periodSchema,
    successCount: { type: "integer" },
    failureCount: { type: "integer" },
    pendingCount: { type: "integer" },
    paymentSuccessRatePercent: { type: ["number", "null"] },
    failedPaymentValueMinor: { type: "integer" },
    failuresByCode: {
      type: "array",
      items: {
        type: "object",
        properties: {
          failureCode: { type: ["string", "null"] },
          count: { type: "integer" },
          valueMinor: { type: "integer" },
        },
      },
    },
    recoveryOpportunitySignal: {
      type: "object",
      properties: {
        repeatFailureCustomerCount: { type: "integer" },
        totalRecoverableValueMinor: { type: "integer" },
      },
    },
  },
});

export async function analyticsRoutes(app: FastifyInstance) {
  // --- OVERVIEW ---
  app.get(
    "/overview",
    {
      onRequest: [app.authenticate],
      preHandler: [requirePermission("analytics.read")],
      schema: {
        tags: ["Analytics"],
        summary: "Merchant revenue/order/payment KPI overview for a date range",
        description:
          "Total revenue, order counts, payment success rate, average order value, revenue growth vs. the " +
          "previous equal-length period, top product, and revenue at risk (value of stale pending/abandoned " +
          "orders). Every figure is computed server-side from captured payments/orders — nothing here is " +
          "estimated or AI-generated. A metric that cannot be reliably computed (e.g. no previous-period data) " +
          "is returned as null rather than fabricated.",
        security: [{ bearerAuth: [] }],
        querystring: dateRangeQueryJsonSchema,
        response: { 200: overviewResponseJsonSchema },
      },
    },
    async (request, reply) => {
      const authUser = request.authUser;
      if (!authUser) throw Errors.unauthorized();

      const query = parseOrThrow<DateRangeQuery>(dateRangeQuerySchema, request.query);
      const result = await getOverview(authUser.organizationId, query);

      emitAudit({
        type: "ANALYTICS_REQUESTED",
        actor: { userId: authUser.userId, organizationId: authUser.organizationId, roleId: authUser.roleId, role: authUser.role },
        target: { kind: "analytics", extras: { endpoint: "overview", range: query.range } },
        context: { route: "/api/v1/analytics/overview" },
      });

      reply.send(ok(result));
    }
  );

  // --- REVENUE TREND ---
  app.get(
    "/revenue",
    {
      onRequest: [app.authenticate],
      preHandler: [requirePermission("analytics.read")],
      schema: {
        tags: ["Analytics"],
        summary: "Revenue trend: current vs. previous period, plus a daily series for charts",
        security: [{ bearerAuth: [] }],
        querystring: dateRangeQueryJsonSchema,
        response: { 200: revenueTrendResponseJsonSchema },
      },
    },
    async (request, reply) => {
      const authUser = request.authUser;
      if (!authUser) throw Errors.unauthorized();

      const query = parseOrThrow<DateRangeQuery>(dateRangeQuerySchema, request.query);
      const result = await getRevenueTrend(authUser.organizationId, query);

      emitAudit({
        type: "ANALYTICS_REQUESTED",
        actor: { userId: authUser.userId, organizationId: authUser.organizationId, roleId: authUser.roleId, role: authUser.role },
        target: { kind: "analytics", extras: { endpoint: "revenue", range: query.range } },
        context: { route: "/api/v1/analytics/revenue" },
      });

      reply.send(ok(result));
    }
  );

  // --- PRODUCT ANALYTICS ---
  app.get(
    "/products",
    {
      onRequest: [app.authenticate],
      preHandler: [requirePermission("analytics.read")],
      schema: {
        tags: ["Analytics"],
        summary: "Per-product revenue, units sold, order count, and average selling price (paginated)",
        security: [{ bearerAuth: [] }],
        querystring: productAnalyticsQueryJsonSchema,
        response: { 200: productAnalyticsResponseJsonSchema },
      },
    },
    async (request, reply) => {
      const authUser = request.authUser;
      if (!authUser) throw Errors.unauthorized();

      const query = parseOrThrow<ProductAnalyticsQuery>(productAnalyticsQuerySchema, request.query);
      const result = await getProductAnalyticsResult(authUser.organizationId, query);

      emitAudit({
        type: "ANALYTICS_REQUESTED",
        actor: { userId: authUser.userId, organizationId: authUser.organizationId, roleId: authUser.roleId, role: authUser.role },
        target: { kind: "analytics", extras: { endpoint: "products", range: query.range } },
        context: { route: "/api/v1/analytics/products" },
      });

      reply.send(ok(result.products, result.meta));
    }
  );

  // --- PAYMENT ANALYTICS ---
  app.get(
    "/payments",
    {
      onRequest: [app.authenticate],
      preHandler: [requirePermission("analytics.read")],
      schema: {
        tags: ["Analytics"],
        summary: "Payment success/failure/pending breakdown, failure reasons, and recovery signal",
        description:
          "Never exposes provider secrets, signatures, or raw gateway metadata — only aggregated counts and " +
          "values, plus a repeat-failure-customer signal that feeds the PAYMENT_RECOVERY opportunity type.",
        security: [{ bearerAuth: [] }],
        querystring: dateRangeQueryJsonSchema,
        response: { 200: paymentAnalyticsResponseJsonSchema },
      },
    },
    async (request, reply) => {
      const authUser = request.authUser;
      if (!authUser) throw Errors.unauthorized();

      const query = parseOrThrow<DateRangeQuery>(dateRangeQuerySchema, request.query);
      const result = await getPaymentAnalytics(authUser.organizationId, query);

      emitAudit({
        type: "ANALYTICS_REQUESTED",
        actor: { userId: authUser.userId, organizationId: authUser.organizationId, roleId: authUser.roleId, role: authUser.role },
        target: { kind: "analytics", extras: { endpoint: "payments", range: query.range } },
        context: { route: "/api/v1/analytics/payments" },
      });

      reply.send(ok(result));
    }
  );
}

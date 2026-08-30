/**
 * Milestone 6 — Revenue Opportunity API.
 *
 * Approval flow (Phase 8): OPEN -> (approve|reject) is the only state
 * transition exposed here — see revenue.service.ts for why actual
 * execution of the recommended action is intentionally not wired to a
 * live money-moving operation yet.
 */
import type { FastifyInstance } from "fastify";
import { requirePermission } from "../../middleware/authorize.js";
import { Errors } from "../../utils/errors.js";
import { ok } from "../../utils/response.js";
import { parseOrThrow } from "../../utils/validate.js";
import {
  listOpportunitiesQuerySchema,
  listOpportunitiesQueryJsonSchema,
  opportunityIdParamsSchema,
  opportunityIdParamsJsonSchema,
  rejectOpportunityBodySchema,
  rejectOpportunityBodyJsonSchema,
  opportunityResponseJsonSchema,
  opportunityListResponseJsonSchema,
  detectResponseJsonSchema,
  type ListOpportunitiesQuery,
  type RejectOpportunityBody,
} from "./revenue.schemas.js";
import {
  runDetectionForOrg,
  listOpportunities,
  getOpportunity,
  approveOpportunity,
  rejectOpportunity,
  executeOpportunity,
} from "./revenue.service.js";

export async function revenueRoutes(app: FastifyInstance) {
  // --- ON-DEMAND DETECTION ---
  // No scheduler exists in this codebase; this lets a merchant (or the
  // demo) trigger detection manually. Safe to call repeatedly (upsert).
  app.post(
    "/detect",
    {
      onRequest: [app.authenticate],
      preHandler: [requirePermission("analytics.read")],
      schema: {
        tags: ["Revenue Opportunities"],
        summary: "Run the deterministic opportunity-detection engine now, for the current organization",
        description:
          "Detects CROSS_SELL, UPSELL, PAYMENT_RECOVERY, ABANDONED_CHECKOUT, and REVENUE_DROP opportunities " +
          "from real order/payment data and upserts them. Re-running is always safe — the same underlying " +
          "pattern updates its existing row (fresh evidence/score) instead of duplicating.",
        security: [{ bearerAuth: [] }],
        response: { 200: detectResponseJsonSchema },
      },
    },
    async (request, reply) => {
      const authUser = request.authUser;
      if (!authUser) throw Errors.unauthorized();

      const opportunities = await runDetectionForOrg(authUser.organizationId);
      reply.send(ok({ detected: opportunities.length, opportunities }));
    }
  );

  // --- LIST ---
  app.get(
    "/opportunities",
    {
      onRequest: [app.authenticate],
      preHandler: [requirePermission("analytics.read")],
      schema: {
        tags: ["Revenue Opportunities"],
        summary: "List revenue opportunities for the current organization (paginated, filterable)",
        security: [{ bearerAuth: [] }],
        querystring: listOpportunitiesQueryJsonSchema,
        response: { 200: opportunityListResponseJsonSchema },
      },
    },
    async (request, reply) => {
      const authUser = request.authUser;
      if (!authUser) throw Errors.unauthorized();

      const query = parseOrThrow<ListOpportunitiesQuery>(listOpportunitiesQuerySchema, request.query);
      const { type, status, severity, page, limit, sort, order } = query;
      const { rows, total } = await listOpportunities(
        authUser.organizationId,
        { type, status, severity },
        { page, limit },
        { sort, order }
      );
      reply.send(ok(rows, { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }));
    }
  );

  // --- GET BY ID ---
  app.get<{ Params: { id: string } }>(
    "/opportunities/:id",
    {
      onRequest: [app.authenticate],
      preHandler: [requirePermission("analytics.read")],
      schema: {
        tags: ["Revenue Opportunities"],
        summary: "Get a single revenue opportunity, including full evidence",
        security: [{ bearerAuth: [] }],
        params: opportunityIdParamsJsonSchema,
        response: { 200: opportunityResponseJsonSchema },
      },
    },
    async (request, reply) => {
      const authUser = request.authUser;
      if (!authUser) throw Errors.unauthorized();

      const { id } = parseOrThrow(opportunityIdParamsSchema, request.params);
      const row = await getOpportunity(authUser.organizationId, id, {
        userId: authUser.userId,
        roleId: authUser.roleId,
        role: authUser.role,
      });
      reply.send(ok(row));
    }
  );

  // --- APPROVE ---
  app.post<{ Params: { id: string } }>(
    "/opportunities/:id/approve",
    {
      onRequest: [app.authenticate],
      preHandler: [requirePermission("ai.execute")],
      schema: {
        tags: ["Revenue Opportunities"],
        summary: "Approve an OPEN revenue opportunity",
        description:
          "Transitions status OPEN -> APPROVED. Requires ai.execute (the same permission that gates every " +
          "other money-adjacent action in this system), not just analytics.read. Does not itself execute the " +
          "recommended action — see the API docs / README for the current scope of what 'approve' does.",
        security: [{ bearerAuth: [] }],
        params: opportunityIdParamsJsonSchema,
        response: { 200: opportunityResponseJsonSchema },
      },
    },
    async (request, reply) => {
      const authUser = request.authUser;
      if (!authUser) throw Errors.unauthorized();

      const { id } = parseOrThrow(opportunityIdParamsSchema, request.params);
      const row = await approveOpportunity(authUser.organizationId, id, {
        userId: authUser.userId,
        roleId: authUser.roleId,
        role: authUser.role,
      });
      reply.send(ok(row));
    }
  );

  // --- EXECUTE ---
  // Phase 7/8/9: runs the deterministic policy engine, then (if ALLOWED)
  // actually prepares the opportunity's recommendedAction against real
  // backend data (see revenue.execution.ts). Only reachable from
  // APPROVED — the AI never calls this, only an authenticated human via
  // this route (ai.execute, same permission tier as checkout).
  app.post<{ Params: { id: string } }>(
    "/opportunities/:id/execute",
    {
      onRequest: [app.authenticate],
      preHandler: [requirePermission("ai.execute")],
      schema: {
        tags: ["Revenue Opportunities"],
        summary: "Execute an APPROVED revenue opportunity's recommended action",
        description:
          "Transitions APPROVED -> EXECUTING -> EXECUTED|FAILED. Runs the deterministic policy engine first " +
          "(status/expiry/action-type/amount-limit checks, see action-policy.service.ts) — a BLOCKED result is a " +
          "422 with the specific failing checks, no state changes made. On ALLOWED, only opportunity types with a " +
          "real backend execution path (PAYMENT_RECOVERY, ABANDONED_CHECKOUT) can actually run — execution prepares " +
          "a fresh Razorpay payment attempt/link (it cannot charge the buyer without their own authorization step, " +
          "which is how every payment gateway works); CROSS_SELL/UPSELL/REVENUE_DROP opportunities have no automated " +
          "action and are BLOCKED with a clear reason instead of a fabricated result. Idempotent: an opportunity that " +
          "is already EXECUTING/EXECUTED/FAILED returns 409, never re-runs the action. Requires ai.execute.",
        security: [{ bearerAuth: [] }],
        params: opportunityIdParamsJsonSchema,
        response: { 200: opportunityResponseJsonSchema },
      },
    },
    async (request, reply) => {
      const authUser = request.authUser;
      if (!authUser) throw Errors.unauthorized();

      const { id } = parseOrThrow(opportunityIdParamsSchema, request.params);
      const row = await executeOpportunity(authUser.organizationId, id, {
        userId: authUser.userId,
        roleId: authUser.roleId,
        role: authUser.role,
      });
      reply.send(ok(row));
    }
  );

  // --- REJECT ---
  app.post<{ Params: { id: string } }>(
    "/opportunities/:id/reject",
    {
      onRequest: [app.authenticate],
      preHandler: [requirePermission("ai.execute")],
      schema: {
        tags: ["Revenue Opportunities"],
        summary: "Reject an OPEN revenue opportunity",
        security: [{ bearerAuth: [] }],
        params: opportunityIdParamsJsonSchema,
        body: rejectOpportunityBodyJsonSchema,
        response: { 200: opportunityResponseJsonSchema },
      },
    },
    async (request, reply) => {
      const authUser = request.authUser;
      if (!authUser) throw Errors.unauthorized();

      const { id } = parseOrThrow(opportunityIdParamsSchema, request.params);
      const body = parseOrThrow<RejectOpportunityBody>(rejectOpportunityBodySchema, request.body ?? {});
      const row = await rejectOpportunity(authUser.organizationId, id, body.reason, {
        userId: authUser.userId,
        roleId: authUser.roleId,
        role: authUser.role,
      });
      reply.send(ok(row));
    }
  );
}

import type { FastifyInstance } from "fastify";
import { requirePermission } from "../../middleware/authorize.js";
import { getPaymentByIdScoped, listPaymentsForOrg } from "./payment.repository.js";
import {
  paymentIdParamsSchema,
  paymentIdParamsJsonSchema,
  paymentHistoryQuerySchema,
  paymentHistoryQueryJsonSchema,
  paymentResponseJsonSchema,
  type PaymentIdParams,
  type PaymentHistoryQuery,
} from "./payment.schemas.js";
import { parseOrThrow } from "../../utils/validate.js";
import { ok, buildPaginationMeta } from "../../utils/response.js";
import { Errors } from "../../utils/errors.js";

const paymentListResponseJsonSchema = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    data: { type: "array", items: paymentResponseJsonSchema },
    meta: {
      type: "object",
      properties: {
        page: { type: "integer" },
        limit: { type: "integer" },
        total: { type: "integer" },
        totalPages: { type: "integer" },
      },
    },
  },
} as const;

/**
 * Read-only payment record endpoints (Phases 19–20). Never exposes
 * provider secrets, RBAC internals, or unnecessary DB metadata — only the
 * fields a merchant/finance operator actually needs. Every query is
 * organization-scoped at the repository layer; a cross-tenant id 404s
 * rather than leaking existence.
 */
export async function paymentRoutes(app: FastifyInstance) {
  // --- GET /payments/history ---  (registered before /:id — see note below)
  app.get(
    "/history",
    {
      onRequest: [app.authenticate],
      preHandler: [requirePermission("payments.read")],
      schema: {
        tags: ["Payments"],
        summary: "List captured payments for the current organization (paginated)",
        security: [{ bearerAuth: [] }],
        querystring: paymentHistoryQueryJsonSchema,
        response: { 200: paymentListResponseJsonSchema },
      },
    },
    async (request, reply) => {
      const authUser = request.authUser;
      if (!authUser) throw Errors.unauthorized();

      const { page, limit } = parseOrThrow<PaymentHistoryQuery>(paymentHistoryQuerySchema, request.query);
      const { rows, total } = await listPaymentsForOrg(authUser.organizationId, { page, limit });
      reply.send(ok(rows, buildPaginationMeta({ page, limit }, total)));
    }
  );

  // --- GET /payments/:id ---
  app.get<{ Params: { id: string } }>(
    "/:id",
    {
      onRequest: [app.authenticate],
      preHandler: [requirePermission("payments.read")],
      schema: {
        tags: ["Payments"],
        summary: "Get a single payment by ID within the current organization",
        security: [{ bearerAuth: [] }],
        params: paymentIdParamsJsonSchema,
        response: { 200: { type: "object", properties: { success: { type: "boolean" }, data: paymentResponseJsonSchema } } },
      },
    },
    async (request, reply) => {
      const authUser = request.authUser;
      if (!authUser) throw Errors.unauthorized();

      const { id } = parseOrThrow<PaymentIdParams>(paymentIdParamsSchema, request.params);
      const payment = await getPaymentByIdScoped(authUser.organizationId, id);
      if (!payment) throw Errors.notFound("Payment not found");
      reply.send(ok(payment));
    }
  );
}

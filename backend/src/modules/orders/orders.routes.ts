/**
 * Order Management read API (backs the merchant /orders admin page).
 *
 * This module previously had a service/repository/types layer only —
 * used internally by checkout.service.ts / payment.service.ts to create
 * and transition orders — but no HTTP routes of its own (see
 * frontend/lib/api/dashboard.ts's doc comment, written before this file
 * existed, for the gap this closes). Read-only: nothing here writes to
 * an order. Every query is organization-scoped exactly like every other
 * module (products, customers, payments).
 */
import type { FastifyInstance } from "fastify";
import { requirePermission } from "../../middleware/authorize.js";
import { getOrderDetailForOrg, listOrdersForOrg, getOrdersSummaryForOrg } from "./orders.service.js";
import {
  listOrdersQuerySchema,
  listOrdersQueryJsonSchema,
  orderIdParamsSchema,
  orderIdParamsJsonSchema,
  orderListResponseJsonSchema,
  orderSummaryResponseJsonSchema,
  orderDetailResponseJsonSchema,
  type ListOrdersQuery,
  type OrderIdParams,
} from "./orders.schemas.js";
import { parseOrThrow } from "../../utils/validate.js";
import { ok } from "../../utils/response.js";
import { Errors } from "../../utils/errors.js";

/** `dateFrom`/`dateTo` query strings -> Date, same "date-only means
 * inclusive end-of-day" treatment as analytics.service.ts's resolveDateRange. */
function parseDateFrom(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function parseDateTo(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  if (value.length <= 10) d.setUTCHours(23, 59, 59, 999);
  return d;
}

export async function ordersRoutes(app: FastifyInstance) {
  // --- SUMMARY --- (registered before "/:id" so "summary" is never
  // captured as an :id param — same ordering rule as payment.routes.ts's
  // /history.)
  app.get(
    "/summary",
    {
      onRequest: [app.authenticate],
      preHandler: [requirePermission("orders.read")],
      schema: {
        tags: ["Orders"],
        summary: "Real per-status order counts + total captured revenue for the current organization",
        description:
          "Exact counts (not estimates) grouped by order status, plus the sum of totalAmount across orders " +
          "with status='paid'. Backs the /orders page's summary cards. No date range — this is an all-time " +
          "snapshot; use /analytics/overview for a date-ranged revenue figure.",
        security: [{ bearerAuth: [] }],
        response: { 200: orderSummaryResponseJsonSchema },
      },
    },
    async (request, reply) => {
      const authUser = request.authUser;
      if (!authUser) throw Errors.unauthorized();

      const summary = await getOrdersSummaryForOrg(authUser.organizationId);
      reply.send(ok(summary));
    }
  );

  // --- LIST ---
  app.get(
    "",
    {
      onRequest: [app.authenticate],
      preHandler: [requirePermission("orders.read")],
      schema: {
        tags: ["Orders"],
        summary: "List orders for the current organization (paginated, searchable, filterable, sortable)",
        description:
          "Search matches the order number or the customer's name/email. Each row includes the joined " +
          "customer summary and the latest payment_attempt (payment status is distinct from order status — " +
          "see orders.types.ts / payment.constants.ts for the two separate state machines).",
        security: [{ bearerAuth: [] }],
        querystring: listOrdersQueryJsonSchema,
        response: { 200: orderListResponseJsonSchema },
      },
    },
    async (request, reply) => {
      const authUser = request.authUser;
      if (!authUser) throw Errors.unauthorized();

      const query = parseOrThrow<ListOrdersQuery>(listOrdersQuerySchema, request.query);
      const { search, status, customerId, dateFrom, dateTo, minAmount, maxAmount, page, limit, sort, order } = query;

      const result = await listOrdersForOrg(
        authUser.organizationId,
        {
          search,
          status,
          customerId,
          dateFrom: parseDateFrom(dateFrom),
          dateTo: parseDateTo(dateTo),
          minAmount,
          maxAmount,
        },
        { page, limit },
        { sort, order }
      );
      reply.send(ok(result.rows, result.meta));
    }
  );

  // --- GET BY ID (full detail: order + items + customer + payment attempts + captured payment) ---
  app.get<{ Params: { id: string } }>(
    "/:id",
    {
      onRequest: [app.authenticate],
      preHandler: [requirePermission("orders.read")],
      schema: {
        tags: ["Orders"],
        summary: "Get full order detail within the current organization",
        description:
          "Order + line items + customer + the complete payment attempt history (retries included) + the " +
          "captured payment record if one exists. For the order's audit trail (status transitions with " +
          "reasons/timestamps), see GET /audit?resourceType=order&resourceId=<id>.",
        security: [{ bearerAuth: [] }],
        params: orderIdParamsJsonSchema,
        response: { 200: orderDetailResponseJsonSchema },
      },
    },
    async (request, reply) => {
      const authUser = request.authUser;
      if (!authUser) throw Errors.unauthorized();

      const { id } = parseOrThrow<OrderIdParams>(orderIdParamsSchema, request.params);
      const detail = await getOrderDetailForOrg(authUser.organizationId, id);
      reply.send(ok(detail));
    }
  );
}

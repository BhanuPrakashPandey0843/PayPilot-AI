import { z } from "zod";
import { paginationQuerySchema } from "../../utils/pagination.js";
import { orderStatusEnum } from "../../db/schema/orders.js";

export const ORDER_STATUS_VALUES = orderStatusEnum.enumValues;
export const ORDER_SORT_FIELDS = ["createdAt", "updatedAt", "totalAmount", "orderNumber"] as const;

/**
 * Query schema for GET /orders. Mirrors products.schemas.ts's
 * listProductsQuerySchema conventions exactly (coerced numbers, csv-free
 * single-value enums, sensible defaults) — this module previously had no
 * routes/schemas file at all, so there's no prior convention of its own
 * to preserve, just this codebase's shared one.
 */
export const listOrdersQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().min(1).max(255).optional(),
  status: z.enum(ORDER_STATUS_VALUES).optional(),
  customerId: z.string().uuid().optional(),
  // Plain date-ish strings (e.g. "2026-08-01" or a full ISO timestamp) —
  // parsed to Date at the service boundary, same pattern as
  // analytics.schemas.ts's custom range handling.
  dateFrom: z.string().trim().min(1).max(40).optional(),
  dateTo: z.string().trim().min(1).max(40).optional(),
  minAmount: z.coerce.number().int().min(0).optional(),
  maxAmount: z.coerce.number().int().min(0).optional(),
  sort: z.enum(ORDER_SORT_FIELDS).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;

export const orderIdParamsSchema = z.object({
  id: z.string().uuid("id must be a valid UUID"),
});
export type OrderIdParams = z.infer<typeof orderIdParamsSchema>;

// --- JSON Schema mirrors for Swagger docs only ---
//
// Intentionally UNCONSTRAINED (no `format`/`enum`/`minimum`) for the same
// reason as products.schemas.ts: Fastify's AJV validates schema.querystring
// BEFORE the handler runs, so any constraint here would short-circuit
// with AJV's own 400 instead of reaching parseOrThrow()/Zod's 422.
export const listOrdersQueryJsonSchema = {
  type: "object",
  properties: {
    page: { type: "integer", default: 1 },
    limit: { type: "integer", default: 20 },
    search: { type: "string", description: "Matches order number or the customer's name/email" },
    status: { type: "string", description: `One of: ${ORDER_STATUS_VALUES.join(", ")}` },
    customerId: { type: "string", description: "UUID" },
    dateFrom: { type: "string", description: "ISO date/timestamp, inclusive lower bound on createdAt" },
    dateTo: { type: "string", description: "ISO date/timestamp, inclusive upper bound on createdAt" },
    minAmount: { type: "integer", description: "Integer minor units (e.g. paise)" },
    maxAmount: { type: "integer", description: "Integer minor units (e.g. paise)" },
    sort: { type: "string", description: `One of: ${ORDER_SORT_FIELDS.join(", ")}. Default createdAt.` },
    order: { type: "string", description: "One of: asc, desc. Default desc." },
  },
} as const;

export const orderIdParamsJsonSchema = {
  type: "object",
  properties: { id: { type: "string", description: "UUID" } },
} as const;

export const paymentAttemptResponseJsonSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    orderId: { type: "string", format: "uuid" },
    provider: { type: "string" },
    providerOrderId: { type: ["string", "null"] },
    providerPaymentId: { type: ["string", "null"] },
    amount: { type: "integer", description: "Integer minor units" },
    currency: { type: "string" },
    status: { type: "string", enum: ["created", "pending", "authorized", "captured", "failed", "cancelled"] },
    failureCode: { type: ["string", "null"] },
    failureMessage: { type: ["string", "null"] },
    attemptNumber: { type: "integer" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
} as const;

export const orderItemResponseJsonSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    orderId: { type: "string", format: "uuid" },
    productId: { type: ["string", "null"] },
    productName: { type: "string" },
    quantity: { type: "integer" },
    unitAmount: { type: "integer", description: "Integer minor units" },
    totalAmount: { type: "integer", description: "Integer minor units" },
    createdAt: { type: "string", format: "date-time" },
  },
} as const;

export const customerSummaryJsonSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    name: { type: "string" },
    email: { type: ["string", "null"] },
    phone: { type: ["string", "null"] },
  },
} as const;

const orderResponseFields = {
  id: { type: "string", format: "uuid" },
  organizationId: { type: "string", format: "uuid" },
  customerId: { type: "string", format: "uuid" },
  orderNumber: { type: "string" },
  status: { type: "string", enum: ORDER_STATUS_VALUES },
  currency: { type: "string" },
  subtotalAmount: { type: "integer" },
  discountAmount: { type: "integer" },
  taxAmount: { type: "integer" },
  totalAmount: { type: "integer" },
  createdAt: { type: "string", format: "date-time" },
  updatedAt: { type: "string", format: "date-time" },
} as const;

export const orderListResponseJsonSchema = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    data: {
      type: "array",
      items: {
        type: "object",
        properties: {
          ...orderResponseFields,
          customer: { anyOf: [customerSummaryJsonSchema, { type: "null" }] },
          latestPaymentAttempt: { anyOf: [paymentAttemptResponseJsonSchema, { type: "null" }] },
        },
      },
    },
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

export const orderSummaryResponseJsonSchema = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    data: {
      type: "object",
      properties: {
        totalOrders: { type: "integer" },
        pendingOrders: { type: "integer" },
        paidOrders: { type: "integer" },
        partiallyPaidOrders: { type: "integer" },
        failedOrders: { type: "integer" },
        cancelledOrders: { type: "integer" },
        refundedOrders: { type: "integer" },
        totalRevenueMinor: { type: "integer" },
        currency: { type: "string" },
      },
    },
  },
} as const;

export const orderDetailResponseJsonSchema = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    data: {
      type: "object",
      properties: {
        order: { type: "object", properties: orderResponseFields },
        items: { type: "array", items: orderItemResponseJsonSchema },
        customer: customerSummaryJsonSchema,
        attempts: { type: "array", items: paymentAttemptResponseJsonSchema },
        payment: {
          anyOf: [
            {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                orderId: { type: "string", format: "uuid" },
                provider: { type: "string" },
                providerPaymentId: { type: "string" },
                amount: { type: "integer" },
                currency: { type: "string" },
                status: { type: "string", enum: ["captured", "partially_refunded", "refunded", "failed"] },
                capturedAt: { type: ["string", "null"], format: "date-time" },
                createdAt: { type: "string", format: "date-time" },
                updatedAt: { type: "string", format: "date-time" },
              },
            },
            { type: "null" },
          ],
        },
      },
    },
  },
} as const;

import { z } from "zod";
import { paginationQuerySchema, paginationQueryJsonSchema } from "../../utils/pagination.js";

export const paymentIdParamsSchema = z.object({ id: z.string().uuid() });
export type PaymentIdParams = z.infer<typeof paymentIdParamsSchema>;
export const paymentIdParamsJsonSchema = {
  type: "object",
  properties: { id: { type: "string", description: "UUID" } },
} as const;

export const paymentHistoryQuerySchema = paginationQuerySchema;
export type PaymentHistoryQuery = z.infer<typeof paymentHistoryQuerySchema>;
export const paymentHistoryQueryJsonSchema = paginationQueryJsonSchema;

export const paymentResponseJsonSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    orderId: { type: "string", format: "uuid" },
    provider: { type: "string" },
    providerPaymentId: { type: "string" },
    amount: { type: "integer", description: "Integer minor units (paise for INR)" },
    currency: { type: "string" },
    status: { type: "string", enum: ["captured", "partially_refunded", "refunded", "failed"] },
    capturedAt: { type: "string", format: "date-time" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
} as const;

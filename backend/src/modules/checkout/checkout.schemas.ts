import { z } from "zod";

export const createCheckoutOrderBodySchema = z.object({
  sessionId: z.string().min(1, "sessionId is required"),
  // Required: the checkout must be tied to a real customer record in
  // this org (never inferred from the authenticated staff/AI-operator
  // user — that user is the one *driving* the checkout, not necessarily
  // the buyer). Ownership is verified server-side (Rule: never trust
  // organizationId from the body — we verify the customer belongs to
  // THIS org, we don't trust a bare id).
  customerId: z.string().uuid("customerId must be a valid UUID"),
  // Optional — if the client doesn't send one, the server derives a
  // deterministic key from sessionId + cart contents (see
  // utils/idempotency.ts). Sending one is recommended for network-retry
  // safety on the frontend's "Pay now" button.
  idempotencyKey: z.string().min(8).max(128).optional(),
});
export type CreateCheckoutOrderBody = z.infer<typeof createCheckoutOrderBodySchema>;

// --- JSON Schema mirrors for Swagger docs only ---
//
// IMPORTANT: intentionally UNCONSTRAINED on request schemas (no `format`,
// `minLength`, `required`) — see products.schemas.ts / customers.schemas.ts
// for the full rationale: AJV validates schema.body BEFORE the handler
// runs, so any constraint here would short-circuit with AJV's own 400
// instead of reaching parseOrThrow()/Zod's consistent 422.
export const createCheckoutOrderBodyJsonSchema = {
  type: "object",
  properties: {
    sessionId: { type: "string" },
    customerId: { type: "string", description: "UUID of a customer in this organization" },
    idempotencyKey: { type: "string", description: "Optional client-supplied idempotency key" },
  },
} as const;

export const checkoutOrderResponseJsonSchema = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    data: {
      type: "object",
      properties: {
        orderId: { type: "string", format: "uuid" },
        razorpayOrderId: { type: "string" },
        amount: { type: "integer", description: "Integer minor units (paise for INR)" },
        currency: { type: "string" },
        keyId: { type: "string", description: "Razorpay public key id — safe to expose to the frontend" },
        status: { type: "string", enum: ["pending", "paid", "partially_paid", "cancelled", "failed", "refunded"] },
        idempotent: { type: "boolean", description: "True if this response replayed an existing in-flight checkout rather than creating a new one" },
      },
    },
  },
} as const;

export const verifyPaymentBodySchema = z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});
export type VerifyPaymentBody = z.infer<typeof verifyPaymentBodySchema>;

export const verifyPaymentBodyJsonSchema = {
  type: "object",
  properties: {
    razorpayOrderId: { type: "string" },
    razorpayPaymentId: { type: "string" },
    razorpaySignature: { type: "string" },
  },
} as const;

export const verifyPaymentResponseJsonSchema = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    data: {
      type: "object",
      properties: {
        orderId: { type: "string", format: "uuid" },
        status: { type: "string" },
        paymentId: { type: "string", format: "uuid" },
      },
    },
  },
} as const;

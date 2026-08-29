import { z } from "zod";
import { MAX_MESSAGE_LENGTH, MAX_COMPARE_PRODUCTS } from "./constants.js";

/**
 * A session identifier is client-generated (e.g. "session_123") and
 * scoped to an organization by memory.service.ts's key — it is
 * deliberately NOT required to be a UUID.
 */
const sessionIdSchema = z.string().trim().min(1).max(128);
const productIdSchema = z.string().uuid("productId must be a valid UUID");

// --- POST /commerce/chat ---
export const chatBodySchema = z.object({
  sessionId: sessionIdSchema,
  message: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH),
  // Optional explicit disambiguation — bypasses the free-text product
  // name matching heuristic in commerce.service.ts. Never required.
  productId: productIdSchema.optional(),
  productIds: z.array(productIdSchema).max(MAX_COMPARE_PRODUCTS).optional(),
  quantity: z.number().int().min(1).max(999).optional(),
});
export type ChatBody = z.infer<typeof chatBodySchema>;

export const chatBodyJsonSchema = {
  type: "object",
  properties: {
    sessionId: { type: "string", description: "Client-generated conversation session id, e.g. \"session_123\"" },
    message: { type: "string", description: "Free-text buyer message" },
    productId: { type: "string", description: "UUID — optional explicit product for DETAILS/ADD_TO_CART" },
    productIds: { type: "array", items: { type: "string" }, description: "UUIDs — optional explicit ids for PRODUCT_COMPARE" },
    quantity: { type: "integer", description: "Optional explicit quantity for ADD_TO_CART" },
  },
} as const;

// --- GET/DELETE /commerce/session ---
export const sessionQuerySchema = z.object({
  sessionId: sessionIdSchema,
});
export type SessionQuery = z.infer<typeof sessionQuerySchema>;

export const sessionQueryJsonSchema = {
  type: "object",
  properties: {
    sessionId: { type: "string" },
  },
} as const;

// --- POST /commerce/order-preview ---
// By default the preview is built from the session's stored cart. `items`
// lets a caller preview a hypothetical cart without first replaying
// add-to-cart turns through /chat — it is never persisted to the session.
export const orderPreviewBodySchema = z.object({
  sessionId: sessionIdSchema,
  items: z
    .array(
      z.object({
        productId: productIdSchema,
        quantity: z.number().int().min(1).max(999),
      })
    )
    .max(50)
    .optional(),
  budget: z.number().int().min(0).optional(),
});
export type OrderPreviewBody = z.infer<typeof orderPreviewBodySchema>;

export const orderPreviewBodyJsonSchema = {
  type: "object",
  properties: {
    sessionId: { type: "string" },
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          productId: { type: "string", description: "UUID" },
          quantity: { type: "integer" },
        },
      },
      description: "Optional — overrides the session cart for this preview only",
    },
    budget: { type: "integer", description: "Optional buyer budget, integer minor units (paise)" },
  },
} as const;

// --- GET /commerce/compare ---
export const compareQuerySchema = z.object({
  productIds: z
    .string()
    .trim()
    .min(1)
    .max(1000)
    .transform((value) => value.split(",").map((s) => s.trim()).filter(Boolean))
    .refine((arr) => arr.length >= 2 && arr.length <= MAX_COMPARE_PRODUCTS, {
      message: `productIds must contain between 2 and ${MAX_COMPARE_PRODUCTS} comma-separated UUIDs`,
    })
    .refine((arr) => arr.every((id) => productIdSchema.safeParse(id).success), {
      message: "Each productId must be a valid UUID",
    }),
});
export type CompareQuery = z.infer<typeof compareQuerySchema>;

export const compareQueryJsonSchema = {
  type: "object",
  properties: {
    productIds: {
      type: "string",
      description: `Comma-separated UUIDs, 2–${MAX_COMPARE_PRODUCTS} products, e.g. ?productIds=<id1>,<id2>`,
    },
  },
} as const;

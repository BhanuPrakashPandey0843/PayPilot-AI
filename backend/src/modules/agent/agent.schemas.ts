import { z } from "zod";
import {
  listProductsQuerySchema,
  listProductsQueryJsonSchema,
  PRODUCT_SORT_FIELDS,
} from "../products/products.schemas.js";

/**
 * GET /api/v1/agent/catalog — same filter/sort/pagination surface as the
 * merchant-facing product list (products.schemas.ts is the single source
 * of truth for those constraints; we don't redefine them here).
 */
export const agentCatalogQuerySchema = listProductsQuerySchema;
export type AgentCatalogQuery = z.infer<typeof agentCatalogQuerySchema>;
export const agentCatalogQueryJsonSchema = listProductsQueryJsonSchema;

const agentTagSchema = z.string().trim().min(1).max(64);

/**
 * POST /api/v1/agent/catalog/search body.
 *
 * This is the "AgentSearchIntent" contract from the milestone spec: a
 * structured, deterministic filter set. `query` is free text used the
 * same way `search` is on the merchant list endpoint (name/description/
 * category ILIKE) — there is NO LLM parsing it. When an AI model is wired
 * up later, its job is to translate a natural-language request into this
 * same `filters` shape before calling this endpoint; this route/service
 * never changes.
 */
export const agentSearchBodySchema = z.object({
  query: z.string().trim().max(500).optional(),
  filters: z
    .object({
      category: z.string().trim().min(1).max(128).optional(),
      minPrice: z.number().int().min(0).optional(),
      maxPrice: z.number().int().min(0).optional(),
      tags: z.array(agentTagSchema).max(20).optional(),
      available: z.boolean().optional(),
      sort: z.enum(PRODUCT_SORT_FIELDS).optional(),
      order: z.enum(["asc", "desc"]).optional(),
    })
    .strict()
    .default({}),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});
export type AgentSearchBody = z.infer<typeof agentSearchBodySchema>;

// Unconstrained JSON-schema mirror for Swagger only — see products.schemas.ts
// for why this is deliberately loose (Zod stays the single source of truth
// for validation; AJV would otherwise short-circuit with its own 400/error
// shape before parseOrThrow()/Zod ever runs).
export const agentSearchBodyJsonSchema = {
  type: "object",
  properties: {
    query: { type: "string", description: "Free-text buyer intent, e.g. \"running shoes under 5000\"" },
    filters: {
      type: "object",
      properties: {
        category: { type: "string" },
        minPrice: { type: "integer", description: "Integer minor units, e.g. paise" },
        maxPrice: { type: "integer", description: "Integer minor units, e.g. paise" },
        tags: { type: "array", items: { type: "string" } },
        available: { type: "boolean" },
        sort: { type: "string", enum: ["createdAt", "price", "name"] },
        order: { type: "string", enum: ["asc", "desc"] },
      },
    },
    page: { type: "integer", default: 1 },
    limit: { type: "integer", default: 20 },
  },
} as const;

export const agentProductIdParamsSchema = z.object({
  productId: z.string().uuid("productId must be a valid UUID"),
});
export type AgentProductIdParams = z.infer<typeof agentProductIdParamsSchema>;

export const agentProductIdParamsJsonSchema = {
  type: "object",
  properties: { productId: { type: "string", description: "UUID" } },
} as const;

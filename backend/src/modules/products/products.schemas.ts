import { z } from "zod";
import { paginationQuerySchema } from "../../utils/pagination.js";

const tagSchema = z.string().trim().min(1).max(64);

export const createProductBodySchema = z.object({
  name: z.string().trim().min(1).max(255),
  // Optional — auto-derived from name when omitted. Must be URL-safe.
  slug: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be lowercase, alphanumeric, and hyphen-separated")
    .optional(),
  description: z.string().trim().max(10_000).optional(),
  category: z.string().trim().max(128).optional(),
  tags: z.array(tagSchema).max(20).default([]),
  // Integer minor units only (e.g. paise for INR) — never a float.
  price: z.number().int().min(0),
  currency: z.string().trim().length(3).toUpperCase().default("INR"),
  inventoryQuantity: z.number().int().min(0).default(0),
  imageUrl: z.string().trim().url().max(2048).optional(),
  isActive: z.boolean().default(true),
});
export type CreateProductBody = z.infer<typeof createProductBodySchema>;

export const updateProductBodySchema = createProductBodySchema.partial();
export type UpdateProductBody = z.infer<typeof updateProductBodySchema>;

/** Comma-separated query param -> string[] (e.g. ?tags=running,lightweight). */
function csvToArray(value: string | undefined): string[] | undefined {
  if (!value) return undefined;
  const arr = value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return arr.length > 0 ? arr : undefined;
}

export const PRODUCT_SORT_FIELDS = ["createdAt", "price", "name"] as const;

export const listProductsQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().min(1).max(255).optional(),
  category: z.string().trim().min(1).max(128).optional(),
  isActive: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  available: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  tags: z.string().trim().max(500).optional().transform(csvToArray),
  sort: z.enum(PRODUCT_SORT_FIELDS).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;

export const productIdParamsSchema = z.object({
  id: z.string().uuid("id must be a valid UUID"),
});

// --- JSON Schema mirrors for Swagger docs only ---
//
// IMPORTANT: intentionally UNCONSTRAINED (no `format`, `minLength`,
// `maximum`/`minimum`, or `required`). Fastify validates `schema.body`
// (and `schema.params`/`schema.querystring`) with its own AJV instance
// BEFORE the handler runs, so any constraint declared here would be
// enforced by AJV first and short-circuit with AJV's default 400 —
// never reaching parseOrThrow()/Zod. Keeping these `type`-only means
// Zod remains the single source of truth for validation, always
// returning a consistent 422 with field-level details.
export const createProductBodyJsonSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    slug: { type: "string" },
    description: { type: "string" },
    category: { type: "string" },
    tags: { type: "array", items: { type: "string" }, description: "Up to 20 tags, e.g. [\"running\", \"lightweight\"]" },
    price: { type: "integer", description: "Integer minor units, e.g. paise" },
    currency: { type: "string", default: "INR" },
    inventoryQuantity: { type: "integer", default: 0 },
    imageUrl: { type: "string" },
    isActive: { type: "boolean", default: true },
  },
} as const;

export const updateProductBodyJsonSchema = {
  type: "object",
  properties: createProductBodyJsonSchema.properties,
} as const;

export const listProductsQueryJsonSchema = {
  type: "object",
  properties: {
    page: { type: "integer", default: 1 },
    limit: { type: "integer", default: 20 },
    search: { type: "string" },
    category: { type: "string" },
    isActive: { type: "string", description: "'true' or 'false'" },
    minPrice: { type: "integer", description: "Integer minor units, e.g. paise" },
    maxPrice: { type: "integer", description: "Integer minor units, e.g. paise" },
    available: { type: "string", description: "'true' or 'false' — true = inventoryQuantity > 0" },
    tags: { type: "string", description: "Comma-separated tags, ALL must match, e.g. running,lightweight" },
    sort: { type: "string", description: "One of: createdAt, price, name. Default createdAt." },
    order: { type: "string", description: "One of: asc, desc. Default desc." },
  },
} as const;

export const productIdParamsJsonSchema = {
  type: "object",
  properties: { id: { type: "string", description: "UUID" } },
} as const;

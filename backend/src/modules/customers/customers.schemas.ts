import { z } from "zod";
import { paginationQuerySchema } from "../../utils/pagination.js";

export const createCustomerBodySchema = z.object({
  externalCustomerId: z.string().trim().min(1).max(255).optional(),
  name: z.string().trim().min(1).max(255),
  email: z.string().trim().toLowerCase().email().max(320).optional().or(z.literal("")),
  phone: z.string().trim().max(32).optional().or(z.literal("")),
  status: z.enum(["active", "inactive", "blocked"]).default("active"),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type CreateCustomerBody = z.infer<typeof createCustomerBodySchema>;

export const updateCustomerBodySchema = createCustomerBodySchema.partial();
export type UpdateCustomerBody = z.infer<typeof updateCustomerBodySchema>;

export const listCustomersQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().min(1).max(255).optional(),
  status: z.enum(["active", "inactive", "blocked"]).optional(),
});
export type ListCustomersQuery = z.infer<typeof listCustomersQuerySchema>;

export const customerIdParamsSchema = z.object({
  id: z.string().uuid("id must be a valid UUID"),
});

// --- JSON Schema mirrors for Swagger docs only ---
//
// IMPORTANT: intentionally UNCONSTRAINED (no `format`, `minLength`,
// `maxLength`, or `required`). Fastify validates `schema.body` (and
// `schema.params`/`schema.querystring`) with its own AJV instance
// BEFORE the handler runs, so any constraint declared here would be
// enforced by AJV first and short-circuit with AJV's default 400 —
// never reaching parseOrThrow()/Zod. Keeping these `type`-only means
// Zod remains the single source of truth for validation, always
// returning a consistent 422 with field-level details.
export const createCustomerBodyJsonSchema = {
  type: "object",
  properties: {
    externalCustomerId: { type: "string" },
    name: { type: "string" },
    email: { type: "string", description: "A valid email address." },
    phone: { type: "string" },
    status: {
      type: "string",
      enum: ["active", "inactive", "blocked"],
      default: "active",
    },
    metadata: { type: "object" },
  },
} as const;

export const updateCustomerBodyJsonSchema = {
  type: "object",
  properties: createCustomerBodyJsonSchema.properties,
} as const;

export const listCustomersQueryJsonSchema = {
  type: "object",
  properties: {
    page: { type: "integer", default: 1 },
    limit: { type: "integer", default: 20 },
    search: { type: "string" },
    status: { type: "string", enum: ["active", "inactive", "blocked"] },
  },
} as const;

export const customerIdParamsJsonSchema = {
  type: "object",
  properties: { id: { type: "string", description: "UUID" } },
} as const;

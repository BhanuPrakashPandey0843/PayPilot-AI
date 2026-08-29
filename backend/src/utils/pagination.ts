import { z } from "zod";

/**
 * Shared query-string schema for paginated list endpoints. Coerces
 * string query params to numbers and clamps to sane bounds so a bad
 * ?limit=100000 can't be used to pull an entire table in one request.
 */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const paginationQueryJsonSchema = {
  type: "object",
  properties: {
    page: { type: "integer", minimum: 1, default: 1 },
    limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
  },
} as const;

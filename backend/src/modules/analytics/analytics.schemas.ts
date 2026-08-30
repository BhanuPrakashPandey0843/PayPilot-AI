import { z } from "zod";

/**
 * Shared date-range querystring for every analytics endpoint.
 *
 *   ?range=today | 7d | 30d | 90d                (preset)
 *   ?range=custom&from=2026-08-01&to=2026-08-29  (explicit, inclusive)
 *
 * Defaults to `30d` when `range` is omitted. Validation happens here
 * (Zod, per project convention) — analytics.service.ts is only
 * responsible for turning a validated value into a concrete { from, to }
 * Date pair, never for re-validating input shape.
 */
const dateRangeRawShape = {
  range: z.enum(["today", "7d", "30d", "90d", "custom"]).default("30d"),
  from: z.string().optional(),
  to: z.string().optional(),
};

/** Applied identically to every schema that embeds the date-range fields. */
function withDateRangeRefinements<T extends { range: string; from?: string; to?: string }>(
  schema: z.ZodType<T>
) {
  return schema
    .refine((v) => (v.range === "custom" ? Boolean(v.from && v.to) : true), {
      message: "`from` and `to` are required when range=custom",
      path: ["from"],
    })
    .refine(
      (v) => {
        if (v.range !== "custom" || !v.from || !v.to) return true;
        const fromMs = Date.parse(v.from);
        const toMs = Date.parse(v.to);
        return Number.isFinite(fromMs) && Number.isFinite(toMs) && fromMs <= toMs;
      },
      { message: "`from` must be a valid date on or before `to`", path: ["to"] }
    )
    .refine(
      (v) => {
        if (v.range !== "custom" || !v.to) return true;
        const toMs = Date.parse(v.to);
        return Number.isFinite(toMs) && toMs <= Date.now() + 24 * 60 * 60 * 1000;
      },
      { message: "`to` cannot be in the future", path: ["to"] }
    );
}

export const dateRangeQuerySchema = withDateRangeRefinements(z.object(dateRangeRawShape));
export type DateRangeQuery = z.infer<typeof dateRangeQuerySchema>;

export const dateRangeQueryJsonSchema = {
  type: "object",
  properties: {
    range: { type: "string", enum: ["today", "7d", "30d", "90d", "custom"] },
    from: { type: "string", description: "Required when range=custom. ISO date, e.g. 2026-08-01." },
    to: { type: "string", description: "Required when range=custom. ISO date, e.g. 2026-08-29." },
  },
} as const;

export const productAnalyticsQuerySchema = withDateRangeRefinements(
  z.object({
    ...dateRangeRawShape,
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    sort: z.enum(["revenue", "unitsSold", "orderCount"]).default("revenue"),
    order: z.enum(["asc", "desc"]).default("desc"),
  })
);
export type ProductAnalyticsQuery = z.infer<typeof productAnalyticsQuerySchema>;

export const productAnalyticsQueryJsonSchema = {
  type: "object",
  properties: {
    ...dateRangeQueryJsonSchema.properties,
    page: { type: "integer", minimum: 1 },
    limit: { type: "integer", minimum: 1, maximum: 100 },
    sort: { type: "string", enum: ["revenue", "unitsSold", "orderCount"] },
    order: { type: "string", enum: ["asc", "desc"] },
  },
} as const;

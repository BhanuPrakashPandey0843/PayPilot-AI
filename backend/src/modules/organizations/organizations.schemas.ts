import { z } from "zod";

/**
 * Every field optional (a partial update — PATCH semantics), but at
 * least one must be present, matching the pattern the rest of this
 * codebase uses for partial updates (see customers.schemas.ts's
 * updateCustomerBodySchema). Constraints mirror the actual column
 * definitions in db/schema/organizations.ts exactly:
 *   name      varchar(255) not null
 *   currency  varchar(3)  not null   -- ISO 4217, e.g. "INR", "USD"
 *   timezone  varchar(64) not null   -- IANA name, e.g. "Asia/Kolkata"
 */
export const updateOrganizationBodySchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    currency: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{3}$/, "currency must be a 3-letter ISO 4217 code, e.g. INR or USD")
      .optional(),
    timezone: z
      .string()
      .trim()
      .min(1)
      .max(64)
      .refine((tz) => {
        // Validate against the runtime's real IANA timezone database
        // rather than a hand-maintained list — Intl.supportedValuesOf
        // is available in Node 18+ (this project targets a modern
        // Node runtime per its TypeScript/tooling versions).
        try {
          Intl.DateTimeFormat(undefined, { timeZone: tz });
          return true;
        } catch {
          return false;
        }
      }, "timezone must be a valid IANA timezone name, e.g. Asia/Kolkata")
      .optional(),
  })
  .refine((body) => Object.keys(body).length > 0, {
    message: "At least one of name, currency, or timezone must be provided",
  });
export type UpdateOrganizationBody = z.infer<typeof updateOrganizationBodySchema>;

// --- JSON Schema mirror for Swagger only — deliberately unconstrained,
// see the identical comment in customers.schemas.ts for why (Zod stays
// the single source of validation truth; AJV would otherwise
// short-circuit with its own less-informative 400).
export const updateOrganizationBodyJsonSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    currency: { type: "string", description: "3-letter ISO 4217 code, e.g. INR, USD" },
    timezone: { type: "string", description: "IANA timezone name, e.g. Asia/Kolkata" },
  },
} as const;

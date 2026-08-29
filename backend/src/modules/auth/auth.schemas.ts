import { z } from "zod";

const STRONG_PASSWORD_MIN = 8;
const STRONG_PASSWORD_MAX = 128;

const strongPasswordMessage =
  "Password must be 8–128 characters and contain at least one letter and one digit";

export const registerBodySchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email format"),
  password: z
    .string()
    .min(STRONG_PASSWORD_MIN, strongPasswordMessage)
    .max(STRONG_PASSWORD_MAX, strongPasswordMessage)
    .regex(/[A-Za-z]/, strongPasswordMessage)
    .regex(/[0-9]/, strongPasswordMessage),
  firstName: z.string().trim().min(1, "First name is required").max(120),
  lastName: z.string().trim().min(1, "Last name is required").max(120),
  organizationName: z
    .string()
    .trim()
    .min(1, "Organization name is required")
    .max(255),
});
export type RegisterBody = z.infer<typeof registerBodySchema>;

export const loginBodySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1, "Password is required"),
});
export type LoginBody = z.infer<typeof loginBodySchema>;

// Plain JSON Schema mirrors of the above, for Swagger documentation only.
//
// IMPORTANT: these are intentionally UNCONSTRAINED (no `format`, `minLength`,
// `maxLength`, or `required`). Fastify runs `schema.body` through its own
// AJV validator BEFORE the route handler executes — so any constraint
// declared here would be enforced by AJV first and short-circuit with
// AJV's default 400 response, never reaching parseOrThrow()/Zod at all.
// Keeping these schemas to `type`-only means AJV only checks shape, and
// Zod (via parseOrThrow) remains the single source of truth for actual
// validation — always returning a consistent 422 with field-level details.
export const registerBodyJsonSchema = {
  type: "object",
  properties: {
    email: { type: "string", description: "A valid email address." },
    password: {
      type: "string",
      description: "8–128 characters. Must contain at least one letter and one digit.",
    },
    firstName: { type: "string" },
    lastName: { type: "string" },
    organizationName: { type: "string" },
  },
} as const;

export const loginBodyJsonSchema = {
  type: "object",
  properties: {
    email: { type: "string", description: "A valid email address." },
    password: { type: "string" },
  },
} as const;

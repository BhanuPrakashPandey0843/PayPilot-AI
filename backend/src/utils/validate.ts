import type { ZodType } from "zod";
import { Errors } from "./errors.js";

/**
 * Parses `input` against a Zod schema and throws a consistent
 * 422 UNPROCESSABLE_ENTITY AppError (with field-level details) on
 * failure, instead of letting a raw ZodError escape to the client.
 */
export function parseOrThrow<T>(schema: ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw Errors.unprocessable("Validation failed", result.error.flatten());
  }
  return result.data;
}

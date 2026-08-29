/**
 * Narrow helper for translating raw `postgres` driver errors into our
 * AppError shape. Postgres error code 23505 is unique_violation.
 */
export function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "23505";
}

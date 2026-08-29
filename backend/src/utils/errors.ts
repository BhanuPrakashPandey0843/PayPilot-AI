/**
 * Shared application error type. Route handlers/services throw these;
 * the global error handler (see src/index.ts) turns them into the
 * standard { success: false, error: { code, message } } response shape
 * with the right HTTP status code. Anything that isn't an AppError is
 * treated as an unexpected 500 and never leaks its details to the client.
 */
export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const Errors = {
  badRequest: (message: string, details?: unknown) =>
    new AppError(400, "BAD_REQUEST", message, details),
  unauthorized: (message = "Authentication required") =>
    new AppError(401, "UNAUTHORIZED", message),
  forbidden: (message = "You do not have permission to perform this action") =>
    new AppError(403, "FORBIDDEN", message),
  notFound: (message = "Resource not found") => new AppError(404, "RESOURCE_NOT_FOUND", message),
  conflict: (message: string, details?: unknown) =>
    new AppError(409, "CONFLICT", message, details),
  unprocessable: (message: string, details?: unknown) =>
    new AppError(422, "UNPROCESSABLE_ENTITY", message, details),
  internal: (message = "Something went wrong") => new AppError(500, "INTERNAL_ERROR", message),
};

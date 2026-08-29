/**
 * Standard API response envelope used by every route in the app.
 *
 * Success: { success: true, data, meta? }
 * Error:   { success: false, error: { code, message, details? } }
 */
export function ok<T, M extends object = never>(
  data: T,
  meta?: M
) {
  return meta
    ? ({ success: true as const, data, meta } as { success: true; data: T; meta: M })
    : ({ success: true as const, data } as { success: true; data: T });
}

export function fail(code: string, message: string, details?: unknown) {
  return {
    success: false as const,
    error: details ? { code, message, details } : { code, message },
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function buildPaginationMeta(params: PaginationParams, total: number): PaginationMeta {
  return {
    page: params.page,
    limit: params.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / params.limit)),
  };
}

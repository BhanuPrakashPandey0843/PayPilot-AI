"use client";

import { useApiResource } from "./useApiResource";
import type { UseApiResourceResult } from "./useApiResource";
import { listProducts, countProducts, type ProductListFilters, type ProductListResult } from "@/lib/api/products";

/** Main filtered/paginated list backing the Products table, via
 * GET /products. Same shape as useAuditLogs.ts's useAuditList. */
export function useProductList(filters: ProductListFilters): UseApiResourceResult<ProductListResult> {
  return useApiResource(
    () => listProducts(filters),
    [
      filters.page,
      filters.limit,
      filters.search,
      filters.category,
      filters.isActive,
      filters.minPrice,
      filters.maxPrice,
      filters.available,
      filters.tags?.join(","),
      filters.sort,
      filters.order,
    ]
  );
}

/**
 * Exact count for one filter combination, via a limit:1 request's
 * meta.total — same pattern as useAuditLogs.ts's useAuditCount and
 * useRevenueOpportunities.ts's useOpportunityStatusCount. Used by the
 * summary cards (Total / Active / Inactive / Out of stock) — real
 * numbers only, never estimated.
 */
export function useProductCount(
  filters: Omit<ProductListFilters, "page" | "limit"> = {}
): UseApiResourceResult<number> {
  return useApiResource(() => countProducts(filters), [filters.isActive, filters.available, filters.search]);
}

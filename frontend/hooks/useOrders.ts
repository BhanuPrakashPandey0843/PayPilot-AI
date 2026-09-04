"use client";

import { useApiResource } from "./useApiResource";
import type { UseApiResourceResult } from "./useApiResource";
import {
  listOrders,
  getOrdersSummary,
  type OrderListFilters,
  type OrderListResult,
  type OrdersSummary,
} from "@/lib/api/orders";

/** Main filtered/paginated list backing the Orders table, via
 * GET /orders. Same structural pattern as useProducts.ts's useProductList. */
export function useOrderList(filters: OrderListFilters): UseApiResourceResult<OrderListResult> {
  return useApiResource(
    () => listOrders(filters),
    [
      filters.page,
      filters.limit,
      filters.search,
      filters.status,
      filters.customerId,
      filters.dateFrom,
      filters.dateTo,
      filters.minAmount,
      filters.maxAmount,
      filters.sort,
      filters.order,
    ]
  );
}

/** Real per-status counts + real revenue sum, via GET /orders/summary —
 * one request, no client-side estimation. Backs the summary cards. */
export function useOrdersSummary(): UseApiResourceResult<OrdersSummary> {
  return useApiResource(() => getOrdersSummary(), []);
}

"use client";

import { useApiResource } from "./useApiResource";
import type { UseApiResourceResult } from "./useApiResource";
import {
  listCustomers,
  countCustomers,
  type CustomerListFilters,
  type CustomerListResult,
  type CustomerStatus,
} from "@/lib/api/customers";

/** Main filtered/paginated list backing the Customers table, via
 * GET /customers. Same structural pattern as useOrders.ts's useOrderList
 * / useProducts.ts's useProductList. */
export function useCustomerList(filters: CustomerListFilters): UseApiResourceResult<CustomerListResult> {
  return useApiResource(
    () => listCustomers(filters),
    [filters.page, filters.limit, filters.search, filters.status]
  );
}

/** Exact count for one status filter, via meta.total on a limit:1
 * request — backs the summary cards. Same pattern as useProducts.ts's
 * useProductCount; there is no dedicated stats endpoint on this module
 * to pull an aggregate from instead. */
export function useCustomerCount(status?: CustomerStatus): UseApiResourceResult<number> {
  return useApiResource(() => countCustomers(status ? { status } : {}), [status]);
}

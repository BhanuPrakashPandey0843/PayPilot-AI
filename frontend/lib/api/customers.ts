/**
 * Typed API functions for the Customer Management page (/customers).
 *
 * Mirrors backend/src/modules/customers exactly — see customers.routes.ts,
 * customers.schemas.ts, and db/schema/customers.ts for the server-side
 * source of truth this file has to respect:
 *
 *  - There is no DELETE /customers/:id route on this backend (compare
 *    products.routes.ts, which has one) — so no deleteCustomer() export
 *    here, and no delete UI anywhere in the customers module. There is
 *    also no "customers.delete" permission in lib/permissions.ts.
 *  - listCustomersQuerySchema only accepts `search` and `status` — there
 *    is no `sort` param (customers.repository.ts's listCustomers always
 *    orders by name asc) and no date-range filter. Building a sort/date
 *    UI on top of this endpoint would silently do nothing, so the
 *    toolbar built on this file only exposes search + status.
 *  - There is no per-customer or org-wide revenue/summary aggregate
 *    endpoint on this module (contrast orders.ts's getOrdersSummary) —
 *    summary cards are built from meta.total on scoped list requests,
 *    same "count via getPaginated's meta" pattern as lib/api/products.ts's
 *    countProducts, and a customer's order history / spend comes from
 *    GET /orders?customerId=... (lib/api/orders.ts) rather than a
 *    duplicated aggregate here.
 */
import { apiClient } from "./client";
import type { PaginatedMeta } from "./dashboard";

export type CustomerStatus = "active" | "inactive" | "blocked";

export interface Customer {
  id: string;
  organizationId: string;
  externalCustomerId: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  status: CustomerStatus;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerListResult {
  rows: Customer[];
  meta: PaginatedMeta;
}

export interface CustomerListFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: CustomerStatus;
}

function buildListParams(filters: CustomerListFilters): URLSearchParams {
  const { page = 1, limit = 20, search, status } = filters;
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.set("search", search);
  if (status) params.set("status", status);
  return params;
}

export function listCustomers(filters: CustomerListFilters = {}): Promise<CustomerListResult> {
  const params = buildListParams(filters);
  return apiClient.getPaginated<Customer[]>(`/customers?${params.toString()}`).then((res) => ({
    rows: res.data,
    meta: res.meta ?? {
      page: filters.page ?? 1,
      limit: filters.limit ?? 20,
      total: res.data.length,
      totalPages: 1,
    },
  }));
}

/** Exact count for one filter combination, via meta.total on a limit:1
 * request — same pattern as lib/api/products.ts's countProducts. Never
 * returns the rows. */
export function countCustomers(filters: Omit<CustomerListFilters, "page" | "limit"> = {}): Promise<number> {
  return listCustomers({ ...filters, page: 1, limit: 1 }).then((res) => res.meta.total);
}

export function getCustomer(id: string): Promise<Customer> {
  return apiClient.get<Customer>(`/customers/${id}`);
}

/** Body shape for POST /customers — mirrors createCustomerBodySchema
 * exactly (customers.schemas.ts). `status` always sent (backend default
 * is "active" but the form makes the choice explicit). */
export interface CustomerInput {
  externalCustomerId?: string;
  name: string;
  email?: string;
  phone?: string;
  status: CustomerStatus;
}

export function createCustomer(body: CustomerInput): Promise<Customer> {
  return apiClient.post<Customer>("/customers", body);
}

/** PATCH /customers/:id accepts a partial of the same shape
 * (updateCustomerBodySchema = createCustomerBodySchema.partial()). */
export function updateCustomer(id: string, body: Partial<CustomerInput>): Promise<Customer> {
  return apiClient.patch<Customer>(`/customers/${id}`, body);
}

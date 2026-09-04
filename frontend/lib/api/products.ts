/**
 * Typed API functions for the Products / Catalog page (/products).
 *
 * Mirrors backend/src/modules/products exactly:
 *  - GET    /products       (list, paginated, search/category/isActive/
 *                             minPrice/maxPrice/available/tags/sort/order)
 *  - GET    /products/:id
 *  - POST   /products        (catalog.create)
 *  - PATCH  /products/:id    (catalog.update)
 *  - DELETE /products/:id    (catalog.delete)
 *
 * Money is always an integer in minor units (paise for INR — see
 * products.schemas.ts's "Integer minor units" doc comment). Never
 * divide/multiply on this side except through formatMoney() /
 * majorToMinor() / minorToMajor() below.
 *
 * There is no dedicated "categories" list endpoint and no catalog-value
 * aggregate endpoint — summary/filter UI built on top of this module
 * must derive from real list/count calls (meta.total via a limit:1
 * request, same pattern as lib/api/audit.ts's countAudit), never invent
 * numbers the backend can't back up.
 */
import { apiClient } from "./client";
import type { PaginatedMeta } from "./dashboard";

export interface Product {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  tags: string[];
  /** Integer minor units, e.g. paise for INR. */
  price: number;
  currency: string;
  inventoryQuantity: number;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListResult {
  rows: Product[];
  meta: PaginatedMeta;
}

export type ProductSortField = "createdAt" | "price" | "name";
export type ProductSortOrder = "asc" | "desc";

export interface ProductListFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  isActive?: boolean;
  /** Integer minor units. */
  minPrice?: number;
  /** Integer minor units. */
  maxPrice?: number;
  /** true = inventoryQuantity > 0, false = inventoryQuantity === 0. */
  available?: boolean;
  /** Product must have ALL of these tags (AND semantics, server-side). */
  tags?: string[];
  sort?: ProductSortField;
  order?: ProductSortOrder;
}

function buildListParams(opts: ProductListFilters): URLSearchParams {
  const { page = 1, limit = 20, search, category, isActive, minPrice, maxPrice, available, tags, sort, order } =
    opts;
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.set("search", search);
  if (category) params.set("category", category);
  if (isActive !== undefined) params.set("isActive", String(isActive));
  if (minPrice !== undefined) params.set("minPrice", String(minPrice));
  if (maxPrice !== undefined) params.set("maxPrice", String(maxPrice));
  if (available !== undefined) params.set("available", String(available));
  if (tags && tags.length > 0) params.set("tags", tags.join(","));
  if (sort) params.set("sort", sort);
  if (order) params.set("order", order);
  return params;
}

export function listProducts(opts: ProductListFilters = {}): Promise<ProductListResult> {
  const params = buildListParams(opts);
  return apiClient
    .getPaginated<Product[]>(`/products?${params.toString()}`)
    .then((res) => ({
      rows: res.data,
      meta: res.meta ?? {
        page: opts.page ?? 1,
        limit: opts.limit ?? 20,
        total: res.data.length,
        totalPages: 1,
      },
    }));
}

/**
 * Exact count for one filter combination, via meta.total on a limit:1
 * request — same "count via getPaginated's meta" pattern as
 * lib/api/audit.ts's countAudit and lib/api/dashboard.ts's
 * getProductCatalogCount. Never returns the rows.
 */
export function countProducts(filters: Omit<ProductListFilters, "page" | "limit"> = {}): Promise<number> {
  return listProducts({ ...filters, page: 1, limit: 1 }).then((res) => res.meta.total);
}

export function getProduct(id: string): Promise<Product> {
  return apiClient.get<Product>(`/products/${id}`);
}

/** Matches createProductBodySchema (products.schemas.ts) field-for-field. */
export interface ProductInput {
  name: string;
  /** Optional — auto-derived (slugified) from name on the backend when omitted. */
  slug?: string;
  description?: string;
  category?: string;
  tags: string[];
  /** Integer minor units, e.g. paise for INR. */
  price: number;
  currency: string;
  inventoryQuantity: number;
  imageUrl?: string;
  isActive: boolean;
}

export function createProduct(body: ProductInput): Promise<Product> {
  return apiClient.post<Product>("/products", body);
}

/** updateProductBodySchema is createProductBodySchema.partial() — every field optional. */
export function updateProduct(id: string, body: Partial<ProductInput>): Promise<Product> {
  return apiClient.patch<Product>(`/products/${id}`, body);
}

export function deleteProduct(id: string): Promise<{ id: string }> {
  return apiClient.delete<{ id: string }>(`/products/${id}`);
}

// --- Money helpers -----------------------------------------------------
// The backend stores price as an integer in minor units. The form lets a
// merchant type a normal decimal amount (e.g. 499.00) and converts here,
// in exactly one place, so the conversion never drifts between the list,
// the form, and the details view.

export function majorToMinor(major: number): number {
  return Math.round(major * 100);
}

export function minorToMajor(minor: number): number {
  return minor / 100;
}

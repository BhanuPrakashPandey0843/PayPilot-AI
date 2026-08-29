import { and, asc, count, desc, eq, gte, lte, ilike, or, sql, type SQL } from "drizzle-orm";
import { db, type Executor } from "../../db/index.js";
import { products } from "../../db/schema/products.js";
import type { NewProduct } from "../../db/schema/products.js";

export interface ProductFilters {
  search?: string;
  category?: string;
  isActive?: boolean;
  minPrice?: number;
  maxPrice?: number;
  /** true = inventoryQuantity > 0, false = inventoryQuantity === 0 */
  available?: boolean;
  /** Product must have ALL of these tags (AND semantics via array containment). */
  tags?: string[];
}

export type ProductSortField = "createdAt" | "price" | "name";
export type ProductSortDirection = "asc" | "desc";

export interface Pagination {
  page: number;
  limit: number;
}

export interface Sorting {
  sort?: ProductSortField;
  order?: ProductSortDirection;
}

function buildWhere(organizationId: string, filters: ProductFilters) {
  const conditions = [eq(products.organizationId, organizationId)];

  if (filters.category) {
    conditions.push(eq(products.category, filters.category));
  }
  if (filters.isActive !== undefined) {
    conditions.push(eq(products.isActive, filters.isActive));
  }
  if (filters.minPrice !== undefined) {
    conditions.push(gte(products.price, filters.minPrice));
  }
  if (filters.maxPrice !== undefined) {
    conditions.push(lte(products.price, filters.maxPrice));
  }
  if (filters.available !== undefined) {
    conditions.push(
      filters.available ? sql`${products.inventoryQuantity} > 0` : eq(products.inventoryQuantity, 0)
    );
  }
  if (filters.tags && filters.tags.length > 0) {
    // Array containment: products.tags @> ARRAY[...] — index-backed via
    // the GIN index on products.tags.
    conditions.push(sql`${products.tags} @> ${filters.tags}::text[]`);
  }
  if (filters.search) {
    const term = `%${filters.search}%`;
    const searchCondition = or(
      ilike(products.name, term),
      ilike(products.description, term),
      ilike(products.category, term)
    );
    if (searchCondition) conditions.push(searchCondition);
  }

  return and(...conditions);
}

const SORT_COLUMNS = {
  createdAt: products.createdAt,
  price: products.price,
  name: products.name,
} as const;

function buildOrderBy(sorting: Sorting): SQL {
  const column = SORT_COLUMNS[sorting.sort ?? "createdAt"];
  return sorting.order === "asc" ? asc(column) : desc(column);
}

export async function listProducts(
  organizationId: string,
  filters: ProductFilters,
  pagination: Pagination,
  sorting: Sorting = {}
) {
  const where = buildWhere(organizationId, filters);
  const offset = (pagination.page - 1) * pagination.limit;

  const [rows, [{ total }]] = await Promise.all([
    db
      .select()
      .from(products)
      .where(where)
      .orderBy(buildOrderBy(sorting))
      .limit(pagination.limit)
      .offset(offset),
    db.select({ total: count() }).from(products).where(where),
  ]);

  return { rows, total };
}

export async function getProductByIdScoped(organizationId: string, id: string) {
  const [row] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, id), eq(products.organizationId, organizationId)))
    .limit(1);
  return row;
}

export async function insertProduct(values: NewProduct) {
  const [row] = await db.insert(products).values(values).returning();
  return row;
}

export async function updateProductScoped(
  organizationId: string,
  id: string,
  values: Partial<NewProduct>
) {
  const [row] = await db
    .update(products)
    .set({ ...values, updatedAt: new Date() })
    .where(and(eq(products.id, id), eq(products.organizationId, organizationId)))
    .returning();
  return row;
}

export async function deleteProductScoped(organizationId: string, id: string) {
  const [row] = await db
    .delete(products)
    .where(and(eq(products.id, id), eq(products.organizationId, organizationId)))
    .returning({ id: products.id });
  return row;
}

/**
 * Products in the same category as `excludeId`, active + in stock,
 * cheapest first. Used for both "related products" (RELATED) and as the
 * candidate pool for recommendations (UPSELL/CROSS_SELL are derived from
 * this in the service layer).
 */
export async function getSameCategoryScoped(
  organizationId: string,
  category: string | null,
  excludeId: string,
  limit: number
) {
  if (!category) return [];
  return db
    .select()
    .from(products)
    .where(
      and(
        eq(products.organizationId, organizationId),
        eq(products.category, category),
        eq(products.isActive, true),
        sql`${products.inventoryQuantity} > 0`,
        sql`${products.id} != ${excludeId}`
      )
    )
    .orderBy(asc(products.price))
    .limit(limit);
}

/**
 * Atomically reserves inventory for a checkout (Milestone 5, Phase 14).
 * The `inventory_quantity >= quantity` guard is IN the UPDATE's WHERE
 * clause, not a separate SELECT-then-UPDATE, so this is race-safe under
 * concurrent buyers without needing an explicit row lock: Postgres only
 * ever applies the update to a row that still has enough stock at the
 * instant the statement runs. Returns the updated row, or `undefined` if
 * the product doesn't exist, belongs to another org, is inactive, or
 * doesn't have enough stock — callers must treat `undefined` as "reservation
 * failed" and roll back the whole checkout transaction.
 */
export async function decrementInventoryScoped(
  executor: Executor,
  organizationId: string,
  productId: string,
  quantity: number
) {
  const [row] = await executor
    .update(products)
    .set({ inventoryQuantity: sql`${products.inventoryQuantity} - ${quantity}`, updatedAt: new Date() })
    .where(
      and(
        eq(products.id, productId),
        eq(products.organizationId, organizationId),
        eq(products.isActive, true),
        sql`${products.inventoryQuantity} >= ${quantity}`
      )
    )
    .returning();
  return row;
}

/**
 * Restores previously-reserved inventory (Phase 14) — called when a
 * reserved order's payment ultimately fails/is cancelled with no further
 * retry in flight, or is explicitly cancelled. Does NOT check isActive:
 * a product deactivated after the reservation was taken should still get
 * its stock back.
 */
export async function incrementInventoryScoped(
  executor: Executor,
  organizationId: string,
  productId: string,
  quantity: number
) {
  const [row] = await executor
    .update(products)
    .set({ inventoryQuantity: sql`${products.inventoryQuantity} + ${quantity}`, updatedAt: new Date() })
    .where(and(eq(products.id, productId), eq(products.organizationId, organizationId)))
    .returning();
  return row;
}

/**
 * Active, in-stock products (in this org) sharing at least one tag with
 * `tags`, excluding `excludeId`. Used as the CROSS_SELL candidate pool.
 */
export async function getSharedTagScoped(
  organizationId: string,
  tags: string[],
  excludeId: string,
  limit: number
) {
  if (!tags || tags.length === 0) return [];
  return db
    .select()
    .from(products)
    .where(
      and(
        eq(products.organizationId, organizationId),
        eq(products.isActive, true),
        sql`${products.inventoryQuantity} > 0`,
        sql`${products.id} != ${excludeId}`,
        sql`${products.tags} && ${tags}::text[]` // overlap (shares >=1 tag)
      )
    )
    .orderBy(asc(products.price))
    .limit(limit);
}

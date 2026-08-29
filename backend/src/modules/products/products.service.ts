import { randomUUID } from "node:crypto";
import { Errors } from "../../utils/errors.js";
import { buildPaginationMeta } from "../../utils/response.js";
import { isUniqueViolation } from "../../utils/pg-error.js";
import type { Executor } from "../../db/index.js";
import {
  listProducts,
  getProductByIdScoped,
  insertProduct,
  updateProductScoped,
  deleteProductScoped,
  getSameCategoryScoped,
  getSharedTagScoped,
  decrementInventoryScoped,
  incrementInventoryScoped,
  type ProductFilters,
  type Pagination,
  type Sorting,
} from "./products.repository.js";
import type { CreateProductBody, UpdateProductBody } from "./products.schemas.js";
import type { Product } from "../../db/schema/products.js";

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return base || `product-${randomUUID().slice(0, 8)}`;
}

/**
 * Core catalog search. This is the ONE place list/search logic lives —
 * both the merchant list endpoint (products.routes.ts) and the AI-agent
 * search endpoint (agent.routes.ts) call this same function, so there is
 * no duplicated business logic between the human and AI-facing APIs (per
 * the Milestone 3 "agent tool contract" requirement). It has no
 * dependency on Fastify/HTTP.
 */
export async function searchProductsForOrg(
  organizationId: string,
  filters: ProductFilters,
  pagination: Pagination,
  sorting: Sorting = {}
) {
  const { rows, total } = await listProducts(organizationId, filters, pagination, sorting);
  return { rows, meta: buildPaginationMeta(pagination, total) };
}

// Back-compat alias — the merchant routes originally called this name.
export const listProductsForOrg = searchProductsForOrg;

export async function getProductForOrg(organizationId: string, id: string) {
  const product = await getProductByIdScoped(organizationId, id);
  if (!product) {
    throw Errors.notFound("Product not found");
  }
  return product;
}

export async function createProductForOrg(organizationId: string, body: CreateProductBody) {
  const slug = body.slug ?? slugify(body.name);

  try {
    return await insertProduct({
      organizationId,
      name: body.name,
      slug,
      description: body.description,
      category: body.category,
      tags: body.tags,
      price: body.price,
      currency: body.currency,
      inventoryQuantity: body.inventoryQuantity,
      imageUrl: body.imageUrl,
      isActive: body.isActive,
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw Errors.conflict("A product with this slug already exists in this organization");
    }
    throw err;
  }
}

export async function updateProductForOrg(
  organizationId: string,
  id: string,
  body: UpdateProductBody
) {
  // Confirm it exists (and belongs to this org) before attempting the
  // update, so a missing/foreign product is a clean 404 rather than a
  // silent no-op update.
  await getProductForOrg(organizationId, id);

  try {
    const updated = await updateProductScoped(organizationId, id, body);
    if (!updated) {
      throw Errors.notFound("Product not found");
    }
    return updated;
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw Errors.conflict("A product with this slug already exists in this organization");
    }
    throw err;
  }
}

export async function deleteProductForOrg(organizationId: string, id: string) {
  const deleted = await deleteProductScoped(organizationId, id);
  if (!deleted) {
    throw Errors.notFound("Product not found");
  }
  return deleted;
}

// ---------------------------------------------------------------------
// Inventory reservation (Milestone 5 checkout, Phase 14). Thin wrappers
// that turn "reservation failed" into a typed AppError so checkout.service
// doesn't need to know about repository-level undefined-vs-row signaling.
// ---------------------------------------------------------------------

/**
 * Atomically reserves `quantity` units of `productId` for this org.
 * Throws Errors.conflict() — not notFound — even when the underlying
 * cause is "product doesn't exist": by the time checkout reaches this
 * step the policy engine has already confirmed the product exists and is
 * active, so a failure here almost always means another buyer won the
 * race for the last units between the policy check and this reservation.
 */
export async function reserveInventoryForOrg(
  executor: Executor,
  organizationId: string,
  productId: string,
  quantity: number,
  productNameForError: string
) {
  const updated = await decrementInventoryScoped(executor, organizationId, productId, quantity);
  if (!updated) {
    throw Errors.conflict(
      `Not enough stock for "${productNameForError}" — it may have just sold out. Please refresh your cart and try again.`,
      { productId, requestedQuantity: quantity }
    );
  }
  return updated;
}

/** Restores previously-reserved inventory. Never throws — callers use this in failure-recovery paths that must not themselves fail. */
export async function restoreInventoryForOrg(
  executor: Executor,
  organizationId: string,
  productId: string,
  quantity: number
) {
  try {
    await incrementInventoryScoped(executor, organizationId, productId, quantity);
  } catch {
    // Best-effort — a failure to restore inventory must not mask the
    // original payment-failure error path that triggered this call.
  }
}

// ---------------------------------------------------------------------
// Related products + deterministic recommendations (Milestone 3).
// Shared by both the merchant-facing and agent-facing routes.
// ---------------------------------------------------------------------

const RELATED_LIMIT = 6;
const RECOMMENDATION_LIMIT_PER_TYPE = 3;

/**
 * A product is only ever eligible to appear as "related" or as a
 * recommendation if it's active AND in stock in the SAME organization as
 * the base product — enforced entirely in the repository layer
 * (getSameCategoryScoped / getSharedTagScoped), never by trusting a
 * client-supplied organizationId.
 */
export async function getRelatedProductsForOrg(
  organizationId: string,
  productId: string
): Promise<Product[]> {
  const base = await getProductForOrg(organizationId, productId);
  const byCategory = await getSameCategoryScoped(
    organizationId,
    base.category,
    base.id,
    RELATED_LIMIT
  );
  if (byCategory.length >= RELATED_LIMIT) return byCategory;

  // Top up with tag-overlap matches not already included.
  const byTag = await getSharedTagScoped(
    organizationId,
    base.tags,
    base.id,
    RELATED_LIMIT - byCategory.length
  );
  const seen = new Set(byCategory.map((p) => p.id));
  return [...byCategory, ...byTag.filter((p) => !seen.has(p.id))];
}

export type RecommendationType = "UPSELL" | "CROSS_SELL";

export interface Recommendation {
  product: Product;
  type: RecommendationType;
  reason: string;
}

/**
 * Deterministic, rule-based recommendations — no LLM/ML involved (per
 * spec: this is the *foundation* a future AI agent reasons over, not the
 * agent itself). Rules:
 *   UPSELL     = same category, strictly higher price than the base
 *                product, cheapest of those first (smallest reasonable
 *                step up).
 *   CROSS_SELL = shares at least one tag with the base product but is in
 *                a DIFFERENT category (an accessory, not a competing
 *                product).
 * Every recommended product is a real, active, in-stock, same-organization
 * catalog row — nothing is invented and no price is altered.
 */
export async function getRecommendationsForOrg(
  organizationId: string,
  productId: string
): Promise<{ baseProduct: Product; recommendations: Recommendation[] }> {
  const base = await getProductForOrg(organizationId, productId);

  const sameCategory = await getSameCategoryScoped(
    organizationId,
    base.category,
    base.id,
    RECOMMENDATION_LIMIT_PER_TYPE * 3 // over-fetch, then filter by price below
  );
  const upsell: Recommendation[] = sameCategory
    .filter((p) => p.price > base.price)
    .slice(0, RECOMMENDATION_LIMIT_PER_TYPE)
    .map((product) => ({
      product,
      type: "UPSELL" as const,
      reason: `Higher-priced product in the same category (${base.category ?? "uncategorized"})`,
    }));

  const crossSell: Recommendation[] = (
    await getSharedTagScoped(organizationId, base.tags, base.id, RECOMMENDATION_LIMIT_PER_TYPE * 3)
  )
    .filter((p) => p.category !== base.category)
    .slice(0, RECOMMENDATION_LIMIT_PER_TYPE)
    .map((product) => ({
      product,
      type: "CROSS_SELL" as const,
      reason: `Related accessory sharing tags with ${base.name}`,
    }));

  return { baseProduct: base, recommendations: [...upsell, ...crossSell] };
}

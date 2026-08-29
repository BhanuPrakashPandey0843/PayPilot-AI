import {
  searchProductsForOrg,
  getRecommendationsForOrg,
  type RecommendationType,
} from "../products/products.service.js";
import type { ProductFilters, Pagination, Sorting } from "../products/products.repository.js";
import type { Product } from "../../db/schema/products.js";
import type { AgentSearchBody } from "./agent.schemas.js";

/**
 * Machine-readable representation of a product for AI-agent consumption.
 * Deliberately narrower than the raw `products` row — no organizationId,
 * no metadata, no timestamps, nothing that isn't needed for commerce
 * discovery (see Objective 4 in the milestone spec).
 */
export interface AgentCatalogProduct {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  tags: string[];
  price: { amount: number; currency: string; unit: "minor" };
  availability: { available: boolean; inventoryQuantity: number };
  imageUrl: string | null;
}

export function toAgentProduct(p: Product): AgentCatalogProduct {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    category: p.category,
    tags: p.tags,
    price: { amount: p.price, currency: p.currency, unit: "minor" },
    availability: {
      available: p.isActive && p.inventoryQuantity > 0,
      inventoryQuantity: p.inventoryQuantity,
    },
    imageUrl: p.imageUrl,
  };
}

/**
 * GET /api/v1/agent/catalog — the merchant's sellable catalog, agent-shaped.
 * Reuses the exact same organization-scoped repository query the merchant
 * list endpoint uses (searchProductsForOrg) — no duplicated DB logic.
 */
export async function getAgentCatalog(
  organizationId: string,
  filters: ProductFilters,
  pagination: Pagination,
  sorting: Sorting = {}
) {
  const { rows, meta } = await searchProductsForOrg(organizationId, filters, pagination, sorting);
  return { products: rows.map(toAgentProduct), meta };
}

/**
 * POST /api/v1/agent/catalog/search — translates a structured
 * AgentSearchIntent into the same ProductFilters the merchant catalog
 * uses. `available` defaults to true here (unlike the merchant list
 * endpoint) because a buying agent should only ever be shown products it
 * can actually purchase, unless it explicitly asks otherwise.
 */
export async function agentSearch(organizationId: string, body: AgentSearchBody) {
  const filters: ProductFilters = {
    search: body.query,
    category: body.filters.category,
    minPrice: body.filters.minPrice,
    maxPrice: body.filters.maxPrice,
    tags: body.filters.tags,
    available: body.filters.available ?? true,
    // Agent-facing search only ever surfaces products a buyer could
    // actually check out — never inactive/delisted ones.
    isActive: true,
  };
  const sorting: Sorting = { sort: body.filters.sort, order: body.filters.order };
  return getAgentCatalog(organizationId, filters, { page: body.page, limit: body.limit }, sorting);
}

export interface AgentRecommendation {
  product: AgentCatalogProduct;
  type: RecommendationType;
  score: number;
  reasons: string[];
}

// Deterministic score bands per recommendation type — not a black box:
// every score traces back to the same rule that produced the reason
// string (see products.service.ts:getRecommendationsForOrg). UPSELL is
// scored slightly higher because it's a same-category, direct-comparison
// match; CROSS_SELL is an adjacent-category accessory match.
const SCORE_BY_TYPE: Record<RecommendationType, number> = {
  UPSELL: 0.8,
  CROSS_SELL: 0.65,
};

/**
 * GET /api/v1/agent/catalog/:productId/recommendations — explainable,
 * rule-based upsell/cross-sell foundation. Reuses
 * getRecommendationsForOrg (already organization + active + in-stock
 * scoped at the repository layer) rather than re-deriving recommendation
 * logic here.
 */
export async function getAgentRecommendations(organizationId: string, productId: string) {
  const { baseProduct, recommendations } = await getRecommendationsForOrg(organizationId, productId);

  const shaped: AgentRecommendation[] = recommendations.map((r) => ({
    product: toAgentProduct(r.product),
    type: r.type,
    score: SCORE_BY_TYPE[r.type],
    reasons: [r.reason],
  }));

  return { product: toAgentProduct(baseProduct), recommendations: shaped };
}

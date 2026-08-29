/**
 * Conversation orchestrator (Phase 1 + Phase 6). Ties intent extraction,
 * tools, policy, order-preview, and memory together into one structured
 * response. This is the ONLY place that decides which tool a given
 * intent calls — commerce.routes.ts has no branching logic of its own.
 *
 * Product references from free text ("add the socks") are resolved
 * against the session's `recentSearchProductIds` by a small deterministic
 * word-overlap match (see `resolveProductIdFromMessage`). Callers can
 * always bypass that heuristic entirely by passing explicit `productId`/
 * `productIds` — this is the seam a real LLM intent-extraction layer
 * plugs into later without changing anything below this file.
 */
import { deterministicIntentExtractor } from "./intent.service.js";
import {
  searchProductsTool,
  getProductDetailsTool,
  compareProductsTool,
  recommendationsTool,
} from "./tools.service.js";
import {
  loadOrCreateSession,
  addToCart,
  removeFromCart,
  recordTurn,
  persist,
} from "./conversation.service.js";
import { buildOrderPreview } from "./order-preview.service.js";
import { getProductForOrg } from "../products/products.service.js";
import { MAX_COMPARE_PRODUCTS } from "./constants.js";
import type { CommerceResponse, ConversationSession } from "./types.js";

export interface ChatOptions {
  productId?: string;
  productIds?: string[];
  quantity?: number;
}

async function resolveProductIdFromMessage(
  organizationId: string,
  message: string,
  candidateIds: string[]
): Promise<string | null> {
  if (candidateIds.length === 0) return null;
  const lower = message.toLowerCase();
  for (const id of candidateIds) {
    try {
      const product = await getProductForOrg(organizationId, id);
      const nameWords = product.name.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
      if (nameWords.some((w) => lower.includes(w))) return id;
    } catch {
      // Candidate no longer accessible (deleted/cross-tenant) — skip it.
    }
  }
  return null;
}

async function resolveCompareIdsFromMessage(
  organizationId: string,
  message: string,
  candidateIds: string[]
): Promise<string[]> {
  const lower = message.toLowerCase();
  const matched: string[] = [];
  for (const id of candidateIds) {
    if (matched.length >= MAX_COMPARE_PRODUCTS) break;
    try {
      const product = await getProductForOrg(organizationId, id);
      const nameWords = product.name.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
      if (nameWords.some((w) => lower.includes(w))) matched.push(id);
    } catch {
      // skip inaccessible candidate
    }
  }
  return matched;
}

export async function handleChatMessage(
  organizationId: string,
  userId: string,
  sessionId: string,
  message: string,
  options: ChatOptions = {}
): Promise<CommerceResponse> {
  const session = await loadOrCreateSession(organizationId, userId, sessionId);
  const { intent, filters } = deterministicIntentExtractor.extract(message);

  let response: CommerceResponse;

  switch (intent) {
    case "PRODUCT_SEARCH": {
      const products = await searchProductsTool(organizationId, filters);
      recordTurn(session, message, intent, filters, products.map((p) => p.id));
      response = {
        message:
          products.length > 0
            ? `I found ${products.length} product${products.length === 1 ? "" : "s"} matching your request.`
            : "I couldn't find any products matching that — try loosening a filter (price, category, or tags).",
        intent,
        products,
        recommendations: [],
        nextAction: products.length > 0 ? "SELECT_PRODUCT" : "REFINE_SEARCH",
      };
      break;
    }

    case "PRODUCT_DETAILS": {
      const productId =
        options.productId ??
        (await resolveProductIdFromMessage(organizationId, message, session.recentSearchProductIds ?? []));
      if (!productId) {
        response = {
          message: "Which product would you like more details on? Mention its name, or search first.",
          intent,
          nextAction: "REFINE_SEARCH",
        };
        break;
      }
      const product = await getProductDetailsTool(organizationId, productId);
      const recommendations = await recommendationsTool(organizationId, productId);
      recordTurn(session, message, intent, filters, [productId]);
      response = {
        message: `Here's what I have on "${product.name}".`,
        intent,
        products: [product],
        recommendations,
        nextAction: "SELECT_PRODUCT",
      };
      break;
    }

    case "PRODUCT_COMPARE": {
      const ids =
        options.productIds && options.productIds.length >= 2
          ? [...new Set(options.productIds)].slice(0, MAX_COMPARE_PRODUCTS)
          : await resolveCompareIdsFromMessage(organizationId, message, session.recentSearchProductIds ?? []);
      if (ids.length < 2) {
        response = {
          message: "Tell me which two (or more) products you'd like compared, or search first so I have candidates.",
          intent,
          nextAction: "REFINE_SEARCH",
        };
        break;
      }
      const comparison = await compareProductsTool(organizationId, ids);
      recordTurn(session, message, intent, filters, ids);
      response = {
        message: `Here's a comparison of ${comparison.map((p) => p.name).join(" vs ")}.`,
        intent,
        comparison,
        nextAction: "SELECT_PRODUCT",
      };
      break;
    }

    case "ADD_TO_CART": {
      const productId =
        options.productId ??
        (await resolveProductIdFromMessage(organizationId, message, session.recentSearchProductIds ?? []));
      if (!productId) {
        response = {
          message: "Which product should I add to your cart? Mention its name, or search first.",
          intent,
          nextAction: "REFINE_SEARCH",
        };
        break;
      }
      const quantity = options.quantity ?? filters.quantity ?? 1;
      addToCart(session, productId, quantity);
      recordTurn(session, message, intent, filters, [productId]);
      response = { message: "Added to your cart.", intent, nextAction: "VIEW_CART" };
      break;
    }

    case "REMOVE_FROM_CART": {
      const productId =
        options.productId ??
        (await resolveProductIdFromMessage(organizationId, message, session.cart.map((c) => c.productId)));
      if (productId) removeFromCart(session, productId);
      recordTurn(session, message, intent, filters);
      response = {
        message: productId ? "Removed from your cart." : "I couldn't tell which item to remove — try naming the product.",
        intent,
        nextAction: "VIEW_CART",
      };
      break;
    }

    case "ORDER_PREVIEW": {
      const budget = filters.maxPrice;
      const { preview, policy } = await buildOrderPreview(organizationId, session.cart, budget);
      recordTurn(session, message, intent, filters);
      response = {
        message: preview ? "Here's your order preview." : "I can't build an order preview yet — see the policy notes below.",
        intent,
        policy,
        orderPreview: preview ?? undefined,
        nextAction: preview ? "PROCEED_TO_PREVIEW" : "VIEW_CART",
      };
      break;
    }

    default: {
      recordTurn(session, message, "UNKNOWN", filters);
      response = {
        message:
          "I'm not sure what you're asking for yet — try telling me what product you're looking for, or ask to compare, add to cart, or checkout.",
        intent: "UNKNOWN",
        nextAction: "REFINE_SEARCH",
      };
    }
  }

  response.memory = { sessionId: session.sessionId, cart: session.cart, lastIntent: session.lastIntent };
  await persist(session);
  return response;
}

export async function getSessionSummary(session: ConversationSession) {
  return {
    sessionId: session.sessionId,
    cart: session.cart,
    lastIntent: session.lastIntent,
    lastFilters: session.lastFilters,
    recentSearchProductIds: session.recentSearchProductIds ?? [],
    updatedAt: session.updatedAt,
  };
}

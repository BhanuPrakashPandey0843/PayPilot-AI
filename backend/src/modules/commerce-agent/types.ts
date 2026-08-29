import type { COMMERCE_INTENTS, POLICY_STATUSES, NEXT_ACTIONS, CONVERSATION_ROLES } from "./constants.js";
import type { AgentCatalogProduct, AgentRecommendation } from "../agent/agent.service.js";

export type CommerceIntent = (typeof COMMERCE_INTENTS)[number];
export type PolicyStatus = (typeof POLICY_STATUSES)[number];
export type NextAction = (typeof NEXT_ACTIONS)[number];
export type ConversationRole = (typeof CONVERSATION_ROLES)[number];

export interface ConversationMessage {
  role: ConversationRole;
  content: string;
  at: string; // ISO timestamp
}

/**
 * Deterministically-extracted buyer filters. Every field is optional —
 * the intent-extraction layer only fills in what it can confidently
 * parse from the message. `minPrice`/`maxPrice` are integer minor units
 * (paise), matching the rest of the catalog.
 */
export interface SearchFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  color?: string;
  size?: string;
  brand?: string;
  available?: boolean;
  quantity?: number;
}

export interface BuyerPreferences {
  budget?: number;
  category?: string;
  preferredTags?: string[];
}

/** A catalog product enriched with a deterministic, explainable match score. */
export interface ProductMatch extends AgentCatalogProduct {
  matchScore: number; // 0-100
  matchReasons: string[];
}

/** Re-exported so commerce-agent consumers don't need to import from agent/. */
export type Recommendation = AgentRecommendation;

export interface PolicyCheck {
  name: string;
  status: PolicyStatus;
  message: string;
}

export interface PolicyResult {
  status: PolicyStatus;
  checks: PolicyCheck[];
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface OrderPreviewItem {
  productId: string;
  name: string;
  unitAmount: number; // integer minor units
  quantity: number;
  totalAmount: number; // integer minor units
}

export interface OrderPreview {
  items: OrderPreviewItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
}

/**
 * Ephemeral, Redis/in-memory conversation state — never a database row
 * (see memory.service.ts). Scoped to a single organization + session.
 */
export interface ConversationSession {
  sessionId: string;
  organizationId: string;
  userId: string;
  cart: CartItem[];
  lastIntent?: CommerceIntent;
  lastFilters?: SearchFilters;
  recentSearchProductIds?: string[];
  recommendationsShown?: string[];
  buyerPreferences?: BuyerPreferences;
  messages: ConversationMessage[];
  updatedAt: string; // ISO timestamp
}

export interface CommerceMemorySummary {
  sessionId: string;
  cart: CartItem[];
  lastIntent?: CommerceIntent;
}

/** The single structured response shape every /commerce/* endpoint returns. */
export interface CommerceResponse {
  message: string;
  intent: CommerceIntent;
  products?: ProductMatch[] | AgentCatalogProduct[];
  recommendations?: Recommendation[];
  comparison?: AgentCatalogProduct[];
  policy?: PolicyResult;
  orderPreview?: OrderPreview;
  memory?: CommerceMemorySummary;
  nextAction: NextAction;
}

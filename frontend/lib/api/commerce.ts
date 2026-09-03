/**
 * Typed API for the Commerce Assistant page. Mirrors
 * backend/src/modules/commerce-agent and backend/src/modules/checkout
 * exactly — see those modules' doc comments for the invariants this
 * file has to respect:
 *
 *  - POST /commerce/chat is stateless per call. There is no server-side
 *    "conversation id" beyond the client-generated `sessionId` used to
 *    key ephemeral (30-minute TTL) cart/memory state in Redis or an
 *    in-memory fallback (memory.service.ts). The chat transcript itself
 *    is kept client-side (see useCommerceChat.ts), same pattern as
 *    lib/api/copilot.ts.
 *  - Money is always an integer in minor units (paise for INR) — never
 *    divide/multiply on this side except through formatMoney().
 *  - Checkout requires a real customerId (a row in `customers` for this
 *    organization) — the commerce assistant is a merchant-operated
 *    shopping agent, not a public storefront, so a customer must be
 *    selected before "Secure Checkout" is reachable.
 */
import { apiClient } from "./client";

// --- Shared literal unions (constants.ts) ---
export type CommerceIntent =
  | "PRODUCT_SEARCH"
  | "PRODUCT_COMPARE"
  | "PRODUCT_DETAILS"
  | "ADD_TO_CART"
  | "REMOVE_FROM_CART"
  | "ORDER_PREVIEW"
  | "UNKNOWN";

export type PolicyStatus = "PASS" | "FAIL" | "WARNING";
export type NextAction = "SELECT_PRODUCT" | "VIEW_CART" | "PROCEED_TO_PREVIEW" | "REFINE_SEARCH" | "NONE";
export type RecommendationType = "UPSELL" | "CROSS_SELL";

// --- Catalog shapes (agent.service.ts) ---
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

export interface ProductMatch extends AgentCatalogProduct {
  matchScore: number;
  matchReasons: string[];
}

export interface Recommendation {
  product: AgentCatalogProduct;
  type: RecommendationType;
  score: number;
  reasons: string[];
}

// --- Policy / order preview (types.ts) ---
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
  unitAmount: number;
  quantity: number;
  totalAmount: number;
}

export interface OrderPreview {
  items: OrderPreviewItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
}

export interface CommerceMemorySummary {
  sessionId: string;
  cart: CartItem[];
  lastIntent?: CommerceIntent;
}

/** The single structured shape every /commerce/* endpoint returns. */
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

export interface SessionSummary {
  sessionId: string;
  cart: CartItem[];
  lastIntent?: CommerceIntent;
  lastFilters?: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    tags?: string[];
    color?: string;
    size?: string;
    brand?: string;
    available?: boolean;
    quantity?: number;
  };
  recentSearchProductIds: string[];
  updatedAt: string;
}

// --- POST /commerce/chat ---
export interface ChatOptions {
  productId?: string;
  productIds?: string[];
  quantity?: number;
}

export function postCommerceChat(
  sessionId: string,
  message: string,
  options: ChatOptions = {}
): Promise<CommerceResponse> {
  return apiClient.post<CommerceResponse>("/commerce/chat", { sessionId, message, ...options });
}

// --- GET /commerce/session ---
export function getCommerceSession(sessionId: string): Promise<SessionSummary> {
  return apiClient.get<SessionSummary>(`/commerce/session?sessionId=${encodeURIComponent(sessionId)}`);
}

// --- DELETE /commerce/session ---
export function clearCommerceSession(sessionId: string): Promise<{ sessionId: string; cleared: boolean }> {
  return apiClient.delete<{ sessionId: string; cleared: boolean }>(
    `/commerce/session?sessionId=${encodeURIComponent(sessionId)}`
  );
}

// --- POST /commerce/order-preview ---
export interface OrderPreviewResponse {
  message: string;
  orderPreview?: OrderPreview;
  policy: PolicyResult;
}

export function postOrderPreview(
  sessionId: string,
  opts: { items?: CartItem[]; budget?: number } = {}
): Promise<OrderPreviewResponse> {
  return apiClient.post<OrderPreviewResponse>("/commerce/order-preview", { sessionId, ...opts });
}

// --- GET /commerce/compare ---
export function getCompareProducts(productIds: string[]): Promise<{ comparison: AgentCatalogProduct[] }> {
  return apiClient.get<{ comparison: AgentCatalogProduct[] }>(
    `/commerce/compare?productIds=${productIds.map(encodeURIComponent).join(",")}`
  );
}

// --- Checkout (checkout.routes.ts) ---
export interface CheckoutOrderResult {
  orderId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
  status: "pending" | "paid" | "partially_paid" | "cancelled" | "failed" | "refunded";
  idempotent: boolean;
}

export function createCheckoutOrder(
  sessionId: string,
  customerId: string,
  idempotencyKey?: string
): Promise<CheckoutOrderResult> {
  return apiClient.post<CheckoutOrderResult>("/checkout/create-order", { sessionId, customerId, idempotencyKey });
}

export interface VerifyPaymentResult {
  orderId: string;
  status: string;
  paymentId: string;
}

export function verifyCheckoutPayment(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): Promise<VerifyPaymentResult> {
  return apiClient.post<VerifyPaymentResult>("/checkout/verify-payment", {
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  });
}

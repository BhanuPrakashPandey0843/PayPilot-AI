"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  postCommerceChat,
  clearCommerceSession,
  type CommerceIntent,
  type ProductMatch,
  type AgentCatalogProduct,
  type Recommendation,
  type PolicyResult,
  type OrderPreview,
  type NextAction,
  type CartItem,
  type ChatOptions,
} from "@/lib/api/commerce";
import { ApiError } from "@/lib/api/client";

export interface CommerceChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  intent?: CommerceIntent;
  products?: ProductMatch[] | AgentCatalogProduct[];
  recommendations?: Recommendation[];
  comparison?: AgentCatalogProduct[];
  policy?: PolicyResult;
  orderPreview?: OrderPreview;
  nextAction?: NextAction;
  error?: boolean;
}

const SESSION_STORAGE_KEY = "paypilot_commerce_session_id";

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `cmsg_${Date.now()}_${idCounter}`;
}

/**
 * Client-generated session id, per commerce.schemas.ts's sessionIdSchema
 * (any non-empty string up to 128 chars — deliberately not required to
 * be a UUID). Persisted in sessionStorage (not localStorage) so it
 * naturally expires with the tab, roughly matching the backend's
 * 30-minute conversation TTL (constants.ts CONVERSATION_TTL_SECONDS)
 * instead of outliving it across browser restarts.
 */
function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "session_ssr";
  const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) return existing;
  const fresh = `session_${crypto.randomUUID()}`;
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, fresh);
  return fresh;
}

/**
 * Drives the Commerce Assistant chat transcript against the real
 * POST /commerce/chat endpoint. Mirrors useCopilotChat.ts's shape
 * (client-side transcript over a stateless backend call) but also
 * tracks the session's cart (from CommerceResponse.memory) since the
 * Context Panel and Cart Widget need it live, without a second
 * source of truth for "what's in the cart".
 *
 * Every quick-action helper (addToCart, removeFromCart, compare,
 * viewDetails, requestOrderPreview) sends a real free-text message
 * that the backend's deterministic intent extractor
 * (intent.service.ts) would classify correctly on its own — plus the
 * explicit productId/productIds/quantity to bypass its fuzzy name-match
 * heuristic for a guaranteed-correct target. Nothing here fakes intent
 * classification; it demonstrates the real one.
 */
export function useCommerceChat() {
  const [sessionId] = useState(getOrCreateSessionId);
  const [messages, setMessages] = useState<CommerceChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [lastIntent, setLastIntent] = useState<CommerceIntent | undefined>(undefined);
  const sendingRef = useRef(false);

  const send = useCallback(
    async (text: string, options: ChatOptions = {}, opts: { silent?: boolean } = {}) => {
      const trimmed = text.trim();
      if (!trimmed || sendingRef.current) return;

      sendingRef.current = true;
      setIsSending(true);

      if (!opts.silent) {
        setMessages((prev) => [...prev, { id: nextId(), role: "user", text: trimmed }]);
      }

      try {
        const result = await postCommerceChat(sessionId, trimmed, options);
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: "assistant",
            text: result.message,
            intent: result.intent,
            products: result.products,
            recommendations: result.recommendations,
            comparison: result.comparison,
            policy: result.policy,
            orderPreview: result.orderPreview,
            nextAction: result.nextAction,
          },
        ]);
        if (result.memory) {
          setCart(result.memory.cart);
          setLastIntent(result.memory.lastIntent);
        }
        return result;
      } catch (err) {
        const message = err instanceof ApiError ? err.message : "Something went wrong. Please try again.";
        setMessages((prev) => [...prev, { id: nextId(), role: "assistant", text: message, error: true }]);
        return null;
      } finally {
        sendingRef.current = false;
        setIsSending(false);
      }
    },
    [sessionId]
  );

  const addToCart = useCallback(
    (product: { id: string; name: string }, quantity: number = 1) =>
      send(`Add ${quantity} ${product.name} to my cart`, { productId: product.id, quantity }),
    [send]
  );

  const removeFromCart = useCallback(
    (product: { id: string; name: string }) =>
      send(`Remove the ${product.name} from my cart`, { productId: product.id }),
    [send]
  );

  const viewDetails = useCallback(
    (product: { id: string; name: string }) =>
      send(`Tell me more about the ${product.name}`, { productId: product.id }),
    [send]
  );

  const compare = useCallback(
    (products: Array<{ id: string; name: string }>) =>
      send(`Compare ${products.map((p) => p.name).join(" vs ")}`, {
        productIds: products.map((p) => p.id),
      }),
    [send]
  );

  const requestOrderPreview = useCallback(() => send("Show me my order preview"), [send]);

  /** Appends a locally-generated assistant message without a round trip
   * to /commerce/chat — used only for real, already-known outcomes (a
   * completed Razorpay checkout) that don't need to be reclassified. */
  const appendAssistantMessage = useCallback((message: Omit<CommerceChatMessage, "id" | "role">) => {
    setMessages((prev) => [...prev, { id: nextId(), role: "assistant", ...message }]);
  }, []);

  /** The backend clears the session's cart server-side the moment a
   * checkout succeeds (checkout.service.ts's clearCart) — mirror that
   * locally so the Cart Summary/Context Panel don't show stale items. */
  const clearCartLocally = useCallback(() => setCart([]), []);

  const reset = useCallback(async () => {
    setMessages([]);
    setCart([]);
    setLastIntent(undefined);
    try {
      await clearCommerceSession(sessionId);
    } catch {
      // Best-effort — a stale session naturally falls out of the
      // backend's 30-minute TTL either way.
    }
  }, [sessionId]);

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  return {
    sessionId,
    messages,
    isSending,
    cart,
    cartCount,
    lastIntent,
    send,
    addToCart,
    removeFromCart,
    viewDetails,
    compare,
    requestOrderPreview,
    appendAssistantMessage,
    clearCartLocally,
    reset,
  };
}

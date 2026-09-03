"use client";

import { useEffect, useState } from "react";
import { postOrderPreview, type CartItem, type OrderPreview, type PolicyResult } from "@/lib/api/commerce";
import { ApiError } from "@/lib/api/client";

export interface UseOrderPreviewResult {
  preview: OrderPreview | null;
  policy: PolicyResult | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Keeps a live, real order-preview (POST /commerce/order-preview) in
 * sync with the session's cart — this is what backs the Context Panel's
 * "Cart Summary" and the inline Cart Widget, so the subtotal/tax/total
 * shown is always the same figure /commerce/order-preview would return
 * (never a client-side price recomputation, which would drift from the
 * backend's placeholder tax rate / policy checks).
 *
 * Refetches whenever the cart's contents change (compared by a stable
 * signature, not array identity, since a fresh CartItem[] arrives on
 * every chat turn even when unchanged) and skips the call entirely for
 * an empty cart.
 */
export function useOrderPreview(sessionId: string, cart: CartItem[]): UseOrderPreviewResult {
  const [preview, setPreview] = useState<OrderPreview | null>(null);
  const [policy, setPolicy] = useState<PolicyResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signature = cart.map((c) => `${c.productId}:${c.quantity}`).sort().join("|");

  useEffect(() => {
    if (cart.length === 0) {
      setPreview(null);
      setPolicy(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    postOrderPreview(sessionId)
      .then((res) => {
        if (cancelled) return;
        setPreview(res.orderPreview ?? null);
        setPolicy(res.policy);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Could not load your cart total.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, signature]);

  return { preview, policy, isLoading, error };
}

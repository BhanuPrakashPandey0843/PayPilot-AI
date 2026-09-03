"use client";

import { useCallback, useState } from "react";
import { createCheckoutOrder, verifyCheckoutPayment } from "@/lib/api/commerce";
import { ApiError } from "@/lib/api/client";

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void };
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  handler: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
  modal?: { ondismiss?: () => void };
  theme?: { color?: string };
}

const RAZORPAY_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

let scriptLoadingPromise: Promise<void> | null = null;

function loadRazorpayScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (scriptLoadingPromise) return scriptLoadingPromise;

  scriptLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load the Razorpay checkout script."));
    document.body.appendChild(script);
  });
  return scriptLoadingPromise;
}

export type CheckoutStatus = "idle" | "creating" | "awaiting_payment" | "verifying" | "paid" | "failed" | "cancelled";

/**
 * Drives the real POST /checkout/create-order -> Razorpay Checkout.js ->
 * POST /checkout/verify-payment flow (checkout.routes.ts). The backend
 * computes the amount from the session's cart itself — this hook never
 * sends a client-supplied amount, only the sessionId/customerId, exactly
 * as checkout.service.ts requires.
 */
export function useCheckout() {
  const [status, setStatus] = useState<CheckoutStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  const startCheckout = useCallback(async (sessionId: string, customerId: string) => {
    setStatus("creating");
    setError(null);
    setOrderId(null);

    try {
      const order = await createCheckoutOrder(sessionId, customerId);
      setOrderId(order.orderId);

      if (order.status === "paid") {
        setStatus("paid");
        return { ok: true as const, orderId: order.orderId };
      }

      await loadRazorpayScript();
      if (!window.Razorpay) throw new Error("Razorpay checkout could not be loaded.");

      setStatus("awaiting_payment");

      return await new Promise<{ ok: boolean; orderId: string }>((resolve) => {
        const razorpay = new window.Razorpay!({
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: "PayPilot AI",
          description: "Secure checkout via Razorpay Test Mode",
          order_id: order.razorpayOrderId,
          theme: { color: "#22d3ee" },
          handler: (response) => {
            setStatus("verifying");
            verifyCheckoutPayment(response.razorpay_order_id, response.razorpay_payment_id, response.razorpay_signature)
              .then(() => {
                setStatus("paid");
                resolve({ ok: true, orderId: order.orderId });
              })
              .catch((err: unknown) => {
                setStatus("failed");
                setError(err instanceof ApiError ? err.message : "Payment verification failed.");
                resolve({ ok: false, orderId: order.orderId });
              });
          },
          modal: {
            ondismiss: () => {
              setStatus((current) => (current === "verifying" || current === "paid" ? current : "cancelled"));
              resolve({ ok: false, orderId: order.orderId });
            },
          },
        });
        razorpay.open();
      });
    } catch (err) {
      setStatus("failed");
      const message = err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Checkout could not be started.";
      setError(message);
      return { ok: false as const, orderId: null };
    }
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setOrderId(null);
  }, []);

  return { status, error, orderId, startCheckout, reset };
}

import type { Metadata } from "next";
import { ShieldCheck, RefreshCw, Webhook, Lock } from "lucide-react";

import { ProductFeaturePage } from "@/components/marketing/ProductFeaturePage";

export const metadata: Metadata = {
  title: "Checkout — PayPilot AI",
  description: "Conversational checkout backed by Razorpay test-mode — server-computed totals, idempotent orders, and verified webhooks.",
};

export default function CheckoutProductPage() {
  return (
    <ProductFeaturePage
      eyebrow="Product · Checkout"
      title="Checkout the agent"
      accent="can't get wrong."
      description="The server always computes the total from the session's cart — there's no `amount` field a client (or an AI buyer) could tamper with. Every step is idempotent, signature-verified, and rate-limited."
      highlights={[
        {
          icon: Lock,
          title: "Server-computed totals",
          body: "create-order never accepts an amount from the client — it's always derived from buildOrderPreview() against the session's cart, run through the same cart-policy engine that powers order previews.",
        },
        {
          icon: RefreshCw,
          title: "Idempotent by design",
          body: "An optional idempotency key (or one derived from sessionId + cart) means a replayed request returns the existing in-flight checkout instead of creating a duplicate order.",
        },
        {
          icon: Webhook,
          title: "Verified webhooks",
          body: "Payment confirmation is never trusted from the client — Razorpay webhooks are HMAC-verified against the raw request body, deduplicated via a database constraint, and processed inside their own transaction to avoid racing a concurrent verify call.",
        },
        {
          icon: ShieldCheck,
          title: "Graceful failure",
          body: "A processing failure after signature verification still returns 200 to Razorpay (so it doesn't retry forever) but is durably recorded as FAILED and visible through the audit log for investigation.",
        },
      ]}
    />
  );
}

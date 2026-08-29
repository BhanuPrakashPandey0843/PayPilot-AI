/**
 * Dedicated Razorpay integration layer (Phase 1). This is the ONLY file
 * in the codebase allowed to import the `razorpay` package or read
 * RAZORPAY_* env vars directly — every other module goes through
 * `razorpayGateway` below.
 *
 * `razorpayGateway` is a plain, mutable object (not a set of standalone
 * named exports) specifically so tests can swap its methods for mocks
 * without touching real network/credentials (Phase 28: "Mock external
 * Razorpay calls in automated tests. Do not make the normal test suite
 * depend on live Razorpay.") — e.g.
 *
 *   import { razorpayGateway } from "../src/modules/payments/razorpay.client.js";
 *   const originalCreateOrder = razorpayGateway.createOrder;
 *   razorpayGateway.createOrder = async () => ({ id: "order_test123", amount: 100000, currency: "INR", status: "created" });
 *   // ...run the test...
 *   razorpayGateway.createOrder = originalCreateOrder; // restore
 *
 * NEVER logs, returns, or otherwise exposes RAZORPAY_KEY_SECRET or
 * RAZORPAY_WEBHOOK_SECRET (Rule: never expose secrets in API responses,
 * logs, or errors).
 */
import Razorpay from "razorpay";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "../../config/env.js";
import { Errors } from "../../utils/errors.js";

let cachedClient: Razorpay | null = null;

/**
 * Lazily constructs the singleton Razorpay SDK client. Deliberately NOT
 * constructed at module load time: importing this file (e.g. transitively,
 * through checkout.service.ts) must never crash the process just because
 * Razorpay isn't configured yet — only an actual attempt to call Razorpay
 * should fail, and it should fail with a clear, typed error instead of an
 * SDK constructor throw or a silent `undefined`.
 */
function getClient(): Razorpay {
  if (cachedClient) return cachedClient;
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw Errors.internal(
      "Razorpay is not configured on this server. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET (see .env.example)."
    );
  }
  cachedClient = new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET });
  return cachedClient;
}

export interface CreateRazorpayOrderParams {
  /** Integer minor units (paise for INR) — the caller is responsible for this already being server-calculated, never client-supplied. */
  amount: number;
  currency: string;
  /** Max 40 chars, unique on the Razorpay account. */
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrderResult {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

async function createOrder(params: CreateRazorpayOrderParams): Promise<RazorpayOrderResult> {
  const order = await getClient().orders.create({
    amount: params.amount,
    currency: params.currency,
    receipt: params.receipt,
    notes: params.notes,
  });
  return {
    id: order.id,
    amount: typeof order.amount === "string" ? parseInt(order.amount, 10) : order.amount,
    currency: order.currency,
    status: order.status,
  };
}

/** Constant-time hex-string comparison — avoids leaking timing info about how much of a signature matched. */
function timingSafeEqualHex(expectedHex: string, actualHex: string | undefined | null): boolean {
  if (!actualHex) return false;
  const a = Buffer.from(expectedHex, "hex");
  let b: Buffer;
  try {
    b = Buffer.from(actualHex, "hex");
  } catch {
    return false;
  }
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Verifies the standard Razorpay Checkout payment signature per Razorpay's
 * documented formula for order-based payments:
 *   expected = HMAC-SHA256(razorpay_order_id + "|" + razorpay_payment_id, key_secret)
 * The frontend-reported "payment succeeded" status is NEVER trusted on
 * its own — this is the actual proof.
 */
function verifyPaymentSignature(razorpayOrderId: string, razorpayPaymentId: string, signature: string): boolean {
  if (!env.RAZORPAY_KEY_SECRET) {
    throw Errors.internal("Razorpay is not configured on this server (RAZORPAY_KEY_SECRET missing).");
  }
  const expected = createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");
  return timingSafeEqualHex(expected, signature);
}

/**
 * Verifies a Razorpay webhook's `X-Razorpay-Signature` header against the
 * EXACT raw request body bytes (see webhook.routes.ts for why this must
 * be the raw body, not a re-serialized JSON.stringify of the parsed
 * body) and RAZORPAY_WEBHOOK_SECRET (configured separately on the
 * Razorpay Dashboard — never the same value as RAZORPAY_KEY_SECRET).
 */
function verifyWebhookSignature(rawBody: string | Buffer, signature: string): boolean {
  if (!env.RAZORPAY_WEBHOOK_SECRET) {
    throw Errors.internal(
      "Razorpay webhooks are not configured on this server (RAZORPAY_WEBHOOK_SECRET missing)."
    );
  }
  const expected = createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest("hex");
  return timingSafeEqualHex(expected, signature);
}

export const razorpayGateway = {
  createOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
};

/** True once real Razorpay credentials are present — used by routes to fail fast with a clear message instead of a generic 500 mid-flow. */
export function isRazorpayConfigured(): boolean {
  return Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);
}

export function isRazorpayWebhookConfigured(): boolean {
  return Boolean(env.RAZORPAY_WEBHOOK_SECRET);
}

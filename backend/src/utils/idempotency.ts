import { createHash } from "node:crypto";

/**
 * Deterministic idempotency key derivation for checkout (Phase 26).
 *
 * A client SHOULD send its own `idempotencyKey` (e.g. a UUID generated
 * once per "pay now" button press, reused automatically by the frontend
 * on network-error retries). When it doesn't, we derive one from the
 * checkout's own content: the same session, checking out the exact same
 * cart contents and total, twice in a row, is treated as the same
 * checkout attempt. A genuinely different cart (item added/removed,
 * quantity changed) naturally produces a different key — this is a
 * safety net, not a replacement for a client-supplied key.
 */
export function deriveCheckoutIdempotencyKey(
  organizationId: string,
  sessionId: string,
  cart: { productId: string; quantity: number }[],
  customerId: string
): string {
  const normalizedCart = [...cart]
    .sort((a, b) => a.productId.localeCompare(b.productId))
    .map((i) => `${i.productId}:${i.quantity}`)
    .join(",");
  const basis = `${organizationId}|${sessionId}|${customerId}|${normalizedCart}`;
  return createHash("sha256").update(basis).digest("hex").slice(0, 64);
}

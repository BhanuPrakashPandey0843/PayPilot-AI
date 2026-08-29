/**
 * Order preview builder (Phase 8). Computes a preview ONLY — nothing is
 * persisted to `orders`/`order_items` and no Razorpay call is made. Tax
 * and shipping are explicit placeholders (see constants.ts) until a real
 * tax/shipping module exists; they're never silently hidden.
 */
import { getProductForOrg } from "../products/products.service.js";
import { checkPolicies } from "./policy.service.js";
import { PLACEHOLDER_SHIPPING_AMOUNT, PLACEHOLDER_TAX_RATE } from "./constants.js";
import type { CartItem, OrderPreview, OrderPreviewItem, PolicyResult } from "./types.js";

export interface OrderPreviewResult {
  preview: OrderPreview | null;
  policy: PolicyResult;
}

export async function buildOrderPreview(
  organizationId: string,
  cart: CartItem[],
  budget?: number
): Promise<OrderPreviewResult> {
  const policy = await checkPolicies(organizationId, cart, budget);
  if (policy.status === "FAIL") {
    // A failed policy check means we can't safely quote a price (e.g. a
    // product no longer exists, or requested quantity exceeds stock) —
    // return the explanation instead of a preview built on bad data.
    return { preview: null, policy };
  }

  const items: OrderPreviewItem[] = [];
  let subtotal = 0;
  let currency = "INR";

  for (const item of cart) {
    const product = await getProductForOrg(organizationId, item.productId);
    currency = product.currency;
    const totalAmount = product.price * item.quantity;
    subtotal += totalAmount;
    items.push({
      productId: product.id,
      name: product.name,
      unitAmount: product.price,
      quantity: item.quantity,
      totalAmount,
    });
  }

  const tax = Math.round(subtotal * PLACEHOLDER_TAX_RATE);
  const shipping = PLACEHOLDER_SHIPPING_AMOUNT;
  const total = subtotal + tax + shipping;

  return { preview: { items, subtotal, tax, shipping, total, currency }, policy };
}

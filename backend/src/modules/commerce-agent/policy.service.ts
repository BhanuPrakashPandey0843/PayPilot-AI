/**
 * Deterministic policy engine (Phase 7). Every check is a single,
 * traceable rule with a human-readable message — nothing here is a
 * black box, and nothing here is decided by an LLM (Rule 3).
 *
 * `checkPolicies` never leaks whether a product exists in ANOTHER
 * organization: a cross-tenant or missing product both surface as the
 * same generic "no longer available" FAIL message.
 */
import { getProductForOrg } from "../products/products.service.js";
import { LOW_INVENTORY_WARNING_THRESHOLD } from "./constants.js";
import type { CartItem, PolicyCheck, PolicyResult } from "./types.js";

export async function checkPolicies(
  organizationId: string,
  cart: CartItem[],
  budget?: number
): Promise<PolicyResult> {
  const checks: PolicyCheck[] = [];
  let subtotal = 0;
  let hasFail = false;
  let hasWarning = false;

  if (cart.length === 0) {
    checks.push({
      name: "CART_NOT_EMPTY",
      status: "FAIL",
      message: "Your cart is empty — add at least one product before requesting an order preview.",
    });
    hasFail = true;
  }

  for (const item of cart) {
    let product;
    try {
      product = await getProductForOrg(organizationId, item.productId);
    } catch {
      checks.push({
        name: `PRODUCT_AVAILABLE:${item.productId}`,
        status: "FAIL",
        message: "One of the items in your cart is no longer available in this catalog.",
      });
      hasFail = true;
      continue;
    }

    if (!product.isActive) {
      checks.push({
        name: `PRODUCT_ACTIVE:${product.id}`,
        status: "FAIL",
        message: `"${product.name}" is no longer available for purchase.`,
      });
      hasFail = true;
      continue;
    }

    if (item.quantity <= 0) {
      checks.push({
        name: `QUANTITY_VALID:${product.id}`,
        status: "FAIL",
        message: `Quantity for "${product.name}" must be at least 1.`,
      });
      hasFail = true;
      continue;
    }

    if (item.quantity > product.inventoryQuantity) {
      checks.push({
        name: `INVENTORY_SUFFICIENT:${product.id}`,
        status: "FAIL",
        message: `Requested quantity (${item.quantity}) for "${product.name}" exceeds available inventory (${product.inventoryQuantity}).`,
      });
      hasFail = true;
      continue;
    }

    checks.push({
      name: `PRODUCT_ACTIVE:${product.id}`,
      status: "PASS",
      message: `"${product.name}" is active and in stock.`,
    });

    if (product.inventoryQuantity <= LOW_INVENTORY_WARNING_THRESHOLD) {
      checks.push({
        name: `INVENTORY_LOW:${product.id}`,
        status: "WARNING",
        message: `Only ${product.inventoryQuantity} left of "${product.name}".`,
      });
      hasWarning = true;
    }

    subtotal += product.price * item.quantity;
  }

  if (budget !== undefined) {
    if (subtotal > budget) {
      checks.push({
        name: "BUDGET_WITHIN_LIMIT",
        status: "FAIL",
        message: `Cart subtotal (${subtotal}) exceeds your stated budget (${budget}).`,
      });
      hasFail = true;
    } else {
      checks.push({
        name: "BUDGET_WITHIN_LIMIT",
        status: "PASS",
        message: "Cart subtotal is within budget.",
      });
    }
  }

  const status = hasFail ? "FAIL" : hasWarning ? "WARNING" : "PASS";
  return { status, checks };
}

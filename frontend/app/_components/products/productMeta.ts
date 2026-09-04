/**
 * Presentation helpers for the Products page. Status is derived, never
 * stored — the backend has exactly two real signals on a product
 * (isActive: boolean, inventoryQuantity: integer), no separate "Draft"
 * or "Out of stock" enum value (see backend/src/db/schema/products.ts).
 * "Out of stock" here means isActive && inventoryQuantity === 0; a
 * deactivated product with quantity 0 shows as Inactive first, since
 * that's the more actionable fact.
 */
import type { LucideIcon } from "lucide-react";
import { CheckCircle2, XCircle, PackageX } from "lucide-react";
import type { Product } from "@/lib/api/products";

export type ProductStatus = "active" | "inactive" | "out_of_stock";

export interface ProductStatusMeta {
  status: ProductStatus;
  label: string;
  color: string;
  icon: LucideIcon;
}

export function getProductStatus(product: Pick<Product, "isActive" | "inventoryQuantity">): ProductStatusMeta {
  if (!product.isActive) {
    return { status: "inactive", label: "Inactive", color: "var(--muted)", icon: XCircle };
  }
  if (product.inventoryQuantity <= 0) {
    return { status: "out_of_stock", label: "Out of stock", color: "var(--accent-amber)", icon: PackageX };
  }
  return { status: "active", label: "Active", color: "var(--accent-emerald)", icon: CheckCircle2 };
}

/**
 * Whether the product is currently discoverable through the AI agent
 * catalog. Mirrors agent.routes.ts's GET /agent/catalog default filter
 * exactly (isActive ?? true, i.e. active products only) combined with
 * the same `available` semantics products.repository.ts uses elsewhere
 * (inventoryQuantity > 0) — the merchant catalog endpoint doesn't
 * force the available filter, but a 0-stock item can't actually be
 * bought by an agent, so it's shown as not-yet-discoverable here too.
 */
export function isAiCatalogReady(product: Pick<Product, "isActive" | "inventoryQuantity">): boolean {
  return product.isActive && product.inventoryQuantity > 0;
}

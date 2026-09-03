"use client";

import { Package, Plus, Crown, Wallet, Boxes } from "lucide-react";
import type { AgentCatalogProduct } from "@/lib/api/commerce";
import { formatMoney } from "../home/formatters";

interface ComparisonWidgetProps {
  products: AgentCatalogProduct[];
  onAddToCart: (product: AgentCatalogProduct) => void;
}

/**
 * GET /commerce/compare is explicitly a deterministic, non-LLM
 * comparison (tools.service.ts's compareProductsTool doc comment) —
 * no "AI recommendation" is returned. The Best Value / Best Premium
 * badges here are therefore derived client-side from the one objective
 * fact every product has (price), not invented editorial judgment.
 */
export function ComparisonWidget({ products, onAddToCart }: ComparisonWidgetProps) {
  const cheapest = products.reduce((a, b) => (b.price.amount < a.price.amount ? b : a), products[0]);
  const priciest = products.reduce((a, b) => (b.price.amount > a.price.amount ? b : a), products[0]);
  const mostStocked = products.reduce(
    (a, b) => (b.availability.inventoryQuantity > a.availability.inventoryQuantity ? b : a),
    products[0]
  );

  function badgeFor(p: AgentCatalogProduct) {
    if (products.length < 2) return null;
    if (p.id === cheapest.id && cheapest.id !== priciest.id) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-emerald)]/15 px-2 py-0.5 text-[10px] font-medium text-[var(--accent-emerald)]">
          <Wallet className="h-2.5 w-2.5" /> Best Budget
        </span>
      );
    }
    if (p.id === priciest.id && cheapest.id !== priciest.id) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-gold)]/15 px-2 py-0.5 text-[10px] font-medium text-[var(--accent-gold)]">
          <Crown className="h-2.5 w-2.5" /> Best Premium
        </span>
      );
    }
    return null;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--border-subtle)] bg-white/[0.02]">
      <div className="flex min-w-max gap-0 divide-x divide-[var(--border-subtle)]">
        {products.map((product) => (
          <div key={product.id} className="flex w-52 flex-col gap-3 p-4">
            <div className="flex h-20 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--accent-violet)]/15 to-[var(--accent-cyan)]/10">
              {product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.imageUrl} alt={product.name} className="h-full w-full rounded-xl object-cover" />
              ) : (
                <Package className="h-7 w-7 text-zinc-600" />
              )}
            </div>

            <div>
              {badgeFor(product)}
              <p className="mt-1.5 truncate text-sm font-medium text-white" title={product.name}>
                {product.name}
              </p>
              <p className="text-[11px] text-zinc-500">{product.category ?? "Uncategorized"}</p>
            </div>

            <p className="text-lg font-semibold text-white">{formatMoney(product.price.amount, product.price.currency)}</p>

            <dl className="space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between">
                <dt className="text-zinc-500">Availability</dt>
                <dd className={product.availability.available ? "text-[var(--accent-emerald)]" : "text-[var(--accent-rose)]"}>
                  {product.availability.available ? "In stock" : "Unavailable"}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-zinc-500">Inventory</dt>
                <dd className="inline-flex items-center gap-1 text-zinc-300">
                  {product.id === mostStocked.id && <Boxes className="h-3 w-3 text-[var(--accent-cyan)]" />}
                  {product.availability.inventoryQuantity}
                </dd>
              </div>
            </dl>

            {product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {product.tags.slice(0, 4).map((tag) => (
                  <span key={tag} className="rounded-full border border-[var(--border-subtle)] px-1.5 py-0.5 text-[10px] text-zinc-400">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => onAddToCart(product)}
              disabled={!product.availability.available}
              className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-cyan)] px-3 py-2 text-xs font-medium text-white transition-opacity disabled:opacity-30"
            >
              <Plus className="h-3.5 w-3.5" /> Add to cart
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

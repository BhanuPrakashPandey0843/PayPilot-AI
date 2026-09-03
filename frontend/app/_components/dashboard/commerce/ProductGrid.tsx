"use client";

import { useState } from "react";
import { Scale } from "lucide-react";
import type { AgentCatalogProduct, ProductMatch } from "@/lib/api/commerce";
import { ProductCard } from "./ProductCard";

interface ProductGridProps {
  products: (AgentCatalogProduct | ProductMatch)[];
  onAddToCart: (product: AgentCatalogProduct | ProductMatch) => void;
  onViewDetails: (product: AgentCatalogProduct | ProductMatch) => void;
  onCompare: (products: (AgentCatalogProduct | ProductMatch)[]) => void;
}

/** Inline product results grid for a chat turn — up to MAX_COMPARE_PRODUCTS (5)
 * can be selected for the real GET /commerce/compare comparison. */
export function ProductGrid({ products, onAddToCart, onViewDetails, onCompare }: ProductGridProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 5) next.add(id);
      return next;
    });
  }

  const selectedProducts = products.filter((p) => selected.has(p.id));

  return (
    <div className="relative">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={() => onAddToCart(product)}
            onViewDetails={() => onViewDetails(product)}
            onToggleCompare={() => toggle(product.id)}
            comparing={selected.has(product.id)}
          />
        ))}
      </div>

      {selectedProducts.length >= 2 && (
        <div className="sticky bottom-2 mt-3 flex justify-center">
          <button
            type="button"
            onClick={() => onCompare(selectedProducts)}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-[var(--accent-violet)] to-[var(--accent-cyan)] px-4 py-2 text-xs font-medium text-white shadow-[0_8px_24px_-8px_rgba(167,139,250,0.5)]"
          >
            <Scale className="h-3.5 w-3.5" /> Compare {selectedProducts.length} products
          </button>
        </div>
      )}
    </div>
  );
}

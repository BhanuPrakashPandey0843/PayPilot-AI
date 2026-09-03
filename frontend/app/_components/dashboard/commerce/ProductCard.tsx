"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Package, Plus, Check, Scale, Info, Sparkles } from "lucide-react";
import type { AgentCatalogProduct, ProductMatch } from "@/lib/api/commerce";
import { formatMoney } from "../home/formatters";

function isMatch(p: AgentCatalogProduct | ProductMatch): p is ProductMatch {
  return "matchScore" in p;
}

interface ProductCardProps {
  product: AgentCatalogProduct | ProductMatch;
  onAddToCart: () => void;
  onViewDetails: () => void;
  onToggleCompare?: () => void;
  comparing?: boolean;
  addingLabel?: string;
  compact?: boolean;
}

/**
 * Real catalog data only — backend/src/db/schema/products.ts has no
 * rating/review fields and the demo seed ships no product images, so
 * this deliberately never renders a fabricated star rating or a stock
 * photo. The "why this product" story instead comes from matchScore /
 * matchReasons (tools.service.ts's rankProducts — a fully traceable,
 * non-LLM score), which is real and explainable.
 */
export function ProductCard({
  product,
  onAddToCart,
  onViewDetails,
  onToggleCompare,
  comparing = false,
  addingLabel,
  compact = false,
}: ProductCardProps) {
  const [justAdded, setJustAdded] = useState(false);
  const match = isMatch(product) ? product : null;
  const unavailable = !product.availability.available;

  function handleAdd() {
    onAddToCart();
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1600);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.25 }}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-white/[0.02] transition-colors hover:border-[var(--border-strong)] hover:bg-white/[0.04] ${
        compact ? "w-56 shrink-0" : "w-full"
      }`}
    >
      {/* Image / fallback tile */}
      <div className="relative flex h-32 items-center justify-center overflow-hidden bg-gradient-to-br from-[var(--accent-violet)]/15 via-white/[0.02] to-[var(--accent-cyan)]/10">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <Package className="h-9 w-9 text-zinc-600 transition-transform duration-500 group-hover:scale-110" />
        )}
        {match && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full border border-[var(--accent-cyan)]/30 bg-black/40 px-2 py-0.5 text-[10px] font-medium text-[var(--accent-cyan)] backdrop-blur">
            <Sparkles className="h-2.5 w-2.5" /> {match.matchScore}% match
          </span>
        )}
        {unavailable && (
          <span className="absolute right-2 top-2 rounded-full bg-[var(--accent-rose)]/15 px-2 py-0.5 text-[10px] font-medium text-[var(--accent-rose)]">
            Out of stock
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <div>
          {product.category && <p className="text-[10px] uppercase tracking-wide text-zinc-500">{product.category}</p>}
          <p className="mt-0.5 truncate text-sm font-medium text-white" title={product.name}>
            {product.name}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-base font-semibold text-white">{formatMoney(product.price.amount, product.price.currency)}</p>
          {!unavailable && (
            <span className="text-[11px] text-zinc-500">{product.availability.inventoryQuantity} in stock</span>
          )}
        </div>

        {product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {product.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-full border border-[var(--border-subtle)] px-2 py-0.5 text-[10px] text-zinc-400">
                {tag}
              </span>
            ))}
          </div>
        )}

        {match && match.matchReasons.length > 0 && !compact && (
          <p className="line-clamp-2 text-[11px] text-zinc-500">
            <Sparkles className="mr-1 inline h-3 w-3 text-[var(--accent-cyan)]" />
            {match.matchReasons.join(" · ")}
          </p>
        )}

        <div className="mt-auto flex items-center gap-1.5 pt-1">
          <button
            type="button"
            onClick={handleAdd}
            disabled={unavailable}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-cyan)] px-3 py-2 text-xs font-medium text-white transition-opacity disabled:opacity-30"
          >
            {justAdded ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {justAdded ? "Added" : addingLabel ?? "Add to cart"}
          </button>
          <button
            type="button"
            onClick={onViewDetails}
            aria-label="View details"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[var(--border-subtle)] text-zinc-400 transition-colors hover:border-[var(--border-strong)] hover:text-white"
          >
            <Info className="h-3.5 w-3.5" />
          </button>
          {onToggleCompare && (
            <button
              type="button"
              onClick={onToggleCompare}
              aria-label="Toggle compare"
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                comparing
                  ? "border-[var(--accent-violet)]/50 bg-[var(--accent-violet)]/15 text-[var(--accent-violet)]"
                  : "border-[var(--border-subtle)] text-zinc-400 hover:border-[var(--border-strong)] hover:text-white"
              }`}
            >
              <Scale className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

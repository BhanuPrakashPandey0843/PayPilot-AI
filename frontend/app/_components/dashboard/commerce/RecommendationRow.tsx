"use client";

import { Package, Plus, TrendingUp, Shuffle } from "lucide-react";
import type { AgentCatalogProduct, Recommendation } from "@/lib/api/commerce";
import { formatMoney } from "../home/formatters";

const TYPE_META: Record<Recommendation["type"], { label: string; icon: typeof TrendingUp; accent: string }> = {
  UPSELL: { label: "Upsell", icon: TrendingUp, accent: "text-[var(--accent-amber)]" },
  CROSS_SELL: { label: "Goes well with", icon: Shuffle, accent: "text-[var(--accent-violet)]" },
};

interface RecommendationRowProps {
  recommendations: Recommendation[];
  onAddToCart: (product: AgentCatalogProduct) => void;
}

/**
 * Reuses GET /api/v1/agent/catalog/:id/recommendations' real, rule-based
 * UPSELL/CROSS_SELL output (agent.service.ts's SCORE_BY_TYPE + the
 * matching reason string) — every score and reason shown traces back to
 * a documented rule, never an invented "customers also bought".
 */
export function RecommendationRow({ recommendations, onAddToCart }: RecommendationRowProps) {
  if (recommendations.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">You might also like</p>
      <div className="flex gap-2.5 overflow-x-auto pb-1">
        {recommendations.map((rec) => {
          const meta = TYPE_META[rec.type];
          const Icon = meta.icon;
          return (
            <div
              key={rec.product.id}
              className="flex w-60 shrink-0 flex-col gap-2 rounded-2xl border border-[var(--border-subtle)] bg-white/[0.02] p-3"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--accent-violet)]/15 to-[var(--accent-cyan)]/10">
                  {rec.product.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={rec.product.imageUrl} alt={rec.product.name} className="h-full w-full rounded-lg object-cover" />
                  ) : (
                    <Package className="h-4 w-4 text-zinc-600" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-white">{rec.product.name}</p>
                  <p className="text-[11px] text-zinc-500">{formatMoney(rec.product.price.amount, rec.product.price.currency)}</p>
                </div>
              </div>
              <p className={`inline-flex items-center gap-1 text-[10px] font-medium ${meta.accent}`}>
                <Icon className="h-3 w-3" /> {meta.label} · {Math.round(rec.score * 100)}% confidence
              </p>
              <p className="line-clamp-2 text-[11px] text-zinc-500">{rec.reasons.join(" · ")}</p>
              <button
                type="button"
                onClick={() => onAddToCart(rec.product)}
                disabled={!rec.product.availability.available}
                className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--border-subtle)] px-2.5 py-1.5 text-[11px] text-zinc-300 transition-colors hover:border-[var(--border-strong)] hover:text-white disabled:opacity-30"
              >
                <Plus className="h-3 w-3" /> Add to cart
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

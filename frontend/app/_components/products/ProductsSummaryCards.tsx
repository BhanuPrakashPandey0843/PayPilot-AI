"use client";

import type { ComponentType } from "react";
import { Package, CheckCircle2, PackageX, EyeOff } from "lucide-react";
import type { UseApiResourceResult } from "@/hooks/useApiResource";
import { formatNumber } from "../dashboard/home/formatters";
import { KpiCardSkeleton } from "../dashboard/home/Skeletons";

interface ProductsSummaryCardsProps {
  totalProducts: UseApiResourceResult<number>;
  activeProducts: UseApiResourceResult<number>;
  outOfStockProducts: UseApiResourceResult<number>;
  inactiveProducts: UseApiResourceResult<number>;
}

interface CardDef {
  label: string;
  icon: ComponentType<{ className?: string }>;
  value: number | null;
  loading: boolean;
  color: string;
}

/**
 * Real numbers only — each card is an exact meta.total from a scoped
 * GET /products?limit=1 request (see hooks/useProducts.ts's
 * useProductCount), same pattern as AuditSummaryCards. No "catalog
 * value" card: summing price across every product would need fetching
 * the entire catalog client-side, and there's no aggregate endpoint for
 * it — inventing one here would violate the "don't invent metrics the
 * backend doesn't provide" rule.
 */
export function ProductsSummaryCards({
  totalProducts,
  activeProducts,
  outOfStockProducts,
  inactiveProducts,
}: ProductsSummaryCardsProps) {
  const cards: CardDef[] = [
    {
      label: "Total products",
      icon: Package,
      value: totalProducts.data,
      loading: totalProducts.isLoading,
      color: "var(--accent-cyan)",
    },
    {
      label: "Active",
      icon: CheckCircle2,
      value: activeProducts.data,
      loading: activeProducts.isLoading,
      color: "var(--accent-emerald)",
    },
    {
      label: "Out of stock",
      icon: PackageX,
      value: outOfStockProducts.data,
      loading: outOfStockProducts.isLoading,
      color: "var(--accent-amber)",
    },
    {
      label: "Inactive",
      icon: EyeOff,
      value: inactiveProducts.data,
      loading: inactiveProducts.isLoading,
      color: "var(--muted)",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((card) =>
        card.loading || card.value === null ? (
          <KpiCardSkeleton key={card.label} />
        ) : (
          <div
            key={card.label}
            className="group relative overflow-hidden rounded-3xl border border-[var(--border-subtle)] bg-white/[0.02] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:bg-white/[0.04]"
          >
            <div
              className="absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-25"
              style={{ background: card.color }}
            />
            <span
              className="flex h-8 w-8 items-center justify-center rounded-xl"
              style={{ background: `color-mix(in srgb, ${card.color} 16%, transparent)` }}
            >
              <card.icon className="h-4 w-4" style={{ color: card.color }} />
            </span>
            <p className="mt-3 text-xl font-semibold text-white">{formatNumber(card.value)}</p>
            <p className="text-xs text-zinc-500">{card.label}</p>
          </div>
        )
      )}
    </div>
  );
}

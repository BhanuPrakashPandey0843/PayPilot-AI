"use client";

import { Package, Plus } from "lucide-react";
import type { UseApiResourceResult } from "@/hooks/useApiResource";
import { formatNumber } from "../dashboard/home/formatters";
import { SkeletonBlock } from "../dashboard/home/Skeletons";

interface ProductsHeroProps {
  organizationName: string;
  totalProducts: UseApiResourceResult<number>;
  canCreate: boolean;
  onAddProduct: () => void;
}

/**
 * Products / Catalog hero. Matches the visual language of AuditHero /
 * RevenueHero (glass panel + grid + drifting glow blobs). The one
 * number in the header — total products — is real (GET /products'
 * meta.total via a limit:1 request), not decorative.
 *
 * "+ Add Product" is hidden (not just disabled) for roles without
 * catalog.create, matching how RevenueOpportunitiesView hides its
 * execution controls for roles that would get a 403 anyway.
 */
export function ProductsHero({ organizationName, totalProducts, canCreate, onAddProduct }: ProductsHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-[var(--border-subtle)] p-6 sm:p-10">
      <div className="glass-panel absolute inset-0 -z-20" />
      <div className="bg-grid absolute inset-0 -z-10 opacity-60" />
      <div
        className="glow-blob animate-mesh-drift absolute -right-20 -top-20 -z-10 h-72 w-72 rounded-full"
        style={{ background: "var(--accent-amber)" }}
      />
      <div
        className="glow-blob animate-mesh-drift absolute -bottom-28 left-1/4 -z-10 h-64 w-64 rounded-full"
        style={{ background: "var(--accent-blue)", animationDelay: "-6s" }}
      />

      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-white/[0.03] px-3 py-1 text-xs font-medium text-[var(--accent-amber)]">
            <Package className="h-3 w-3" /> Catalog
          </p>
          <h1 className="mt-4 text-2xl font-semibold text-white sm:text-3xl">Products</h1>
          <p className="mt-2 max-w-lg text-sm text-zinc-400">
            Manage the catalog, pricing, and availability{" "}
            <span className="text-zinc-200">{organizationName}</span> sells through PayPilot — and what&apos;s
            exposed to AI buyers.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3 self-start sm:self-auto">
          <div className="glass-panel flex items-center gap-3 rounded-2xl px-5 py-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-amber)]/15">
              <Package className="h-4 w-4 text-[var(--accent-amber)]" />
            </span>
            <div>
              {totalProducts.isLoading || totalProducts.data === null ? (
                <SkeletonBlock className="h-6 w-14" />
              ) : (
                <p className="text-xl font-semibold text-white">{formatNumber(totalProducts.data)}</p>
              )}
              <p className="text-[11px] text-zinc-500">Total products</p>
            </div>
          </div>

          {canCreate && (
            <button
              type="button"
              onClick={onAddProduct}
              className="inline-flex h-full items-center gap-1.5 self-stretch rounded-2xl bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-cyan)] px-5 py-4 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> Add Product
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

"use client";

import { RefreshCw, ShoppingCart, Sparkles } from "lucide-react";

interface OrdersHeroProps {
  organizationName: string;
  onRefresh: () => void;
  isRefreshing: boolean;
}

/**
 * Orders hero. Matches the visual language of ProductsHero (glass panel
 * + grid + drifting glow blobs) so the page reads as part of the same
 * product. No primary "create" CTA here — unlike Products, there is no
 * POST /orders on the backend (orders only ever come from checkout), so
 * a merchant "Add Order" action would have nothing real to call.
 */
export function OrdersHero({ organizationName, onRefresh, isRefreshing }: OrdersHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-[var(--border-subtle)] p-6 sm:p-10">
      <div className="glass-panel absolute inset-0 -z-20" />
      <div className="bg-grid absolute inset-0 -z-10 opacity-60" />
      <div
        className="glow-blob animate-mesh-drift absolute -right-20 -top-20 -z-10 h-72 w-72 rounded-full"
        style={{ background: "var(--accent-blue)" }}
      />
      <div
        className="glow-blob animate-mesh-drift absolute -bottom-28 left-1/4 -z-10 h-64 w-64 rounded-full"
        style={{ background: "var(--accent-cyan)", animationDelay: "-6s" }}
      />

      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-white/[0.03] px-3 py-1 text-xs font-medium text-[var(--accent-cyan)]">
            <ShoppingCart className="h-3 w-3" /> Commerce
          </p>
          <h1 className="mt-4 text-2xl font-semibold text-white sm:text-3xl">Orders</h1>
          <p className="mt-2 max-w-lg text-sm text-zinc-400">
            Track orders, payments, and customer purchases across{" "}
            <span className="text-zinc-200">{organizationName}</span> from one place.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-2xl border border-[var(--border-subtle)] bg-white/[0.03] px-5 py-3 text-sm font-medium text-zinc-200 transition-colors hover:border-[var(--border-strong)] hover:text-white disabled:opacity-40 sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      <div className="mt-6 flex items-start gap-2.5 rounded-2xl border border-[var(--border-subtle)] bg-white/[0.02] p-4 text-xs text-zinc-400 sm:mt-8">
        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent-cyan)]" />
        <p>
          <span className="font-medium text-zinc-200">Order status</span> and{" "}
          <span className="font-medium text-zinc-200">payment status</span> are tracked separately — an order can
          be pending with a failed payment attempt behind it, or paid with a partial refund on record.
        </p>
      </div>
    </section>
  );
}

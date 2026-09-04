"use client";

import { CreditCard, RefreshCw, Sparkles } from "lucide-react";

interface PaymentsHeroProps {
  organizationName: string;
  onRefresh: () => void;
  isRefreshing: boolean;
}

/**
 * Payments hero. Follows the exact visual pattern of OrdersHero and
 * ProductsHero — glass panel, grid texture, drifting glow blobs, and a
 * contextual hint card explaining the distinction between captured
 * payments (money moved, shown here) and payment attempts (the full
 * lifecycle, shown per-order in the Orders detail modal).
 *
 * No primary CTA here — unlike Products, there is no merchant-initiated
 * POST /payments on the backend. Payments are only ever created as a
 * side effect of a successful Razorpay capture via checkout or a
 * payment recovery opportunity execution.
 */
export function PaymentsHero({ organizationName, onRefresh, isRefreshing }: PaymentsHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-[var(--border-subtle)] p-6 sm:p-10">
      <div className="glass-panel absolute inset-0 -z-20" />
      <div className="bg-grid absolute inset-0 -z-10 opacity-60" />
      <div
        className="glow-blob animate-mesh-drift absolute -right-20 -top-20 -z-10 h-72 w-72 rounded-full"
        style={{ background: "var(--accent-violet)" }}
      />
      <div
        className="glow-blob animate-mesh-drift absolute -bottom-28 left-1/4 -z-10 h-64 w-64 rounded-full"
        style={{ background: "var(--accent-emerald)", animationDelay: "-6s" }}
      />

      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-white/[0.03] px-3 py-1 text-xs font-medium text-[var(--accent-cyan)]">
            <CreditCard className="h-3 w-3" /> Finance
          </p>
          <h1 className="mt-4 text-2xl font-semibold text-white sm:text-3xl">Payments</h1>
          <p className="mt-2 max-w-lg text-sm text-zinc-400">
            Manage and monitor captured payment transactions across{" "}
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
          This page shows <span className="font-medium text-zinc-200">captured payment records</span>{" "}
          — the authoritative financial trail. Individual{" "}
          <span className="font-medium text-zinc-200">payment attempts</span> (including failures,
          retries, and pending authorizations) are visible per order in the Orders detail view.
        </p>
      </div>
    </section>
  );
}

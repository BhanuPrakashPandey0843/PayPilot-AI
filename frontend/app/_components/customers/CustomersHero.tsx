"use client";

import { Plus, RefreshCw, Sparkles, Users } from "lucide-react";

interface CustomersHeroProps {
  organizationName: string;
  canCreate: boolean;
  onAddCustomer: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

/**
 * Customers hero. Matches the visual language of OrdersHero/ProductsHero
 * (glass panel + grid + drifting glow blobs) so the page reads as part
 * of the same product. "Add Customer" only renders for roles with
 * customers.create — the exact permission POST /customers enforces —
 * matching how ProductsHero gates its own create CTA.
 */
export function CustomersHero({
  organizationName,
  canCreate,
  onAddCustomer,
  onRefresh,
  isRefreshing,
}: CustomersHeroProps) {
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
        style={{ background: "var(--accent-cyan)", animationDelay: "-6s" }}
      />

      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-white/[0.03] px-3 py-1 text-xs font-medium text-[var(--accent-cyan)]">
            <Users className="h-3 w-3" /> Commerce
          </p>
          <h1 className="mt-4 text-2xl font-semibold text-white sm:text-3xl">Customers</h1>
          <p className="mt-2 max-w-lg text-sm text-zinc-400">
            Understand your customers, purchases, and activity across{" "}
            <span className="text-zinc-200">{organizationName}</span> in one place.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border-subtle)] bg-white/[0.03] px-5 py-3 text-sm font-medium text-zinc-200 transition-colors hover:border-[var(--border-strong)] hover:text-white disabled:opacity-40"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} /> Refresh
          </button>
          {canCreate && (
            <button
              type="button"
              onClick={onAddCustomer}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-cyan)] px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> Add Customer
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 flex items-start gap-2.5 rounded-2xl border border-[var(--border-subtle)] bg-white/[0.02] p-4 text-xs text-zinc-400 sm:mt-8">
        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent-cyan)]" />
        <p>
          Open a customer to see their <span className="font-medium text-zinc-200">order history</span>,{" "}
          <span className="font-medium text-zinc-200">spend</span>, and recent activity — all pulled live from
          Orders and Audit, never duplicated here.
        </p>
      </div>
    </section>
  );
}

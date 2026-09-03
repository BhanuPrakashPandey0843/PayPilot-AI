"use client";

import { Sparkles, Wifi, ShoppingBag, Building2 } from "lucide-react";

interface CommerceHeroProps {
  organizationName: string;
  cartCount: number;
  hasActiveConversation: boolean;
}

/** Compact hero for the Commerce Assistant page — same glass/glow/grid
 * depth system as DashboardHero.tsx, scaled down since the chat below
 * is the actual point of the page, not the banner. */
export function CommerceHero({ organizationName, cartCount, hasActiveConversation }: CommerceHeroProps) {
  return (
    <section className="relative mb-5 overflow-hidden rounded-3xl border border-[var(--border-subtle)] p-5 sm:p-7">
      <div className="glass-panel absolute inset-0 -z-20" />
      <div className="bg-grid absolute inset-0 -z-10 opacity-50" />
      <div
        className="glow-blob animate-mesh-drift absolute -right-20 -top-20 -z-10 h-64 w-64 rounded-full"
        style={{ background: "var(--accent-cyan)" }}
      />
      <div
        className="glow-blob animate-mesh-drift absolute -bottom-24 left-1/4 -z-10 h-56 w-56 rounded-full"
        style={{ background: "var(--accent-violet)", animationDelay: "-5s" }}
      />

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3.5">
          <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent-violet)]/30 to-[var(--accent-cyan)]/30">
            <span className="animate-orb-float absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--accent-violet)]/20 to-[var(--accent-cyan)]/20 blur-md" />
            <Sparkles className="relative h-5 w-5 text-[var(--accent-cyan)]" />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-white sm:text-2xl">Commerce Assistant</h1>
            <p className="text-sm text-zinc-400">Your AI shopping concierge for product discovery and secure checkout.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-300">
            <Wifi className="h-3.5 w-3.5 text-[var(--accent-emerald)]" /> AI online
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-300">
            <Building2 className="h-3.5 w-3.5 text-[var(--accent-violet)]" /> {organizationName}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-300">
            <ShoppingBag className="h-3.5 w-3.5 text-[var(--accent-cyan)]" /> {cartCount} in cart
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
              hasActiveConversation
                ? "bg-[var(--accent-emerald)]/10 text-[var(--accent-emerald)]"
                : "bg-white/[0.03] text-zinc-500"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${hasActiveConversation ? "bg-[var(--accent-emerald)]" : "bg-zinc-600"}`} />
            {hasActiveConversation ? "Conversation active" : "New conversation"}
          </span>
        </div>
      </div>
    </section>
  );
}

"use client";

import { Bot, Sparkles } from "lucide-react";

/**
 * Contextual note explaining the relationship between this page and
 * PayPilot's agent-facing catalog (GET /agent/catalog,
 * backend/src/modules/agent/agent.routes.ts). That endpoint reuses this
 * exact products table — filtered to isActive && inventoryQuantity > 0
 * (see agent.service.ts's getAgentCatalog default `isActive ?? true`
 * plus the same `available` semantics products.repository.ts uses) —
 * so there is no second catalog system to build or explain here, only
 * this one fact about which of a merchant's products currently qualify.
 * Per-row readiness is shown next to each product (see productMeta.ts's
 * isAiCatalogReady + ProductsTable's badge), so this banner stays a
 * short explanation rather than duplicating that state.
 */
export function AiCatalogNote() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-[var(--border-subtle)] bg-white/[0.02] p-4 sm:items-center">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-violet)]/15">
        <Bot className="h-4 w-4 text-[var(--accent-violet)]" />
      </span>
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-sm font-medium text-zinc-200">
          AI Buyer Catalog <Sparkles className="h-3 w-3 text-[var(--accent-violet)]" />
        </p>
        <p className="mt-0.5 text-xs text-zinc-500">
          Active products with stock on hand can be discovered and recommended by PayPilot&apos;s commerce agent.
          Look for the <span className="text-[var(--accent-violet)]">AI-ready</span> badge below.
        </p>
      </div>
    </div>
  );
}

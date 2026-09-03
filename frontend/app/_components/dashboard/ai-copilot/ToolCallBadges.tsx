"use client";

import { useState } from "react";
import { ChevronDown, CheckCircle2, XCircle, Wrench } from "lucide-react";
import type { CopilotToolCall } from "@/lib/api/copilot";

const TOOL_LABELS: Record<string, string> = {
  getRevenueOverview: "Revenue overview",
  getRevenueTrend: "Revenue trend",
  getProductPerformance: "Product performance",
  getPaymentPerformance: "Payment performance",
  getRevenueOpportunities: "Revenue opportunities",
  getOpportunityDetails: "Opportunity details",
  getProductRecommendations: "Product recommendations",
};

/**
 * Explainability strip for an assistant reply — the product's whole
 * pitch is "every financial action explainable" (see brief), so instead
 * of just printing the model's text, every real tool call the backend
 * made (copilot.service.ts's bounded agentic loop) is shown, collapsed
 * by default. Renders nothing when there are no tool calls (template
 * provider / a question answered without one).
 */
export function ToolCallBadges({ toolCalls }: { toolCalls: CopilotToolCall[] }) {
  const [open, setOpen] = useState(false);
  if (toolCalls.length === 0) return null;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500 hover:text-zinc-300"
      >
        <Wrench className="h-3 w-3" />
        {toolCalls.length} data lookup{toolCalls.length > 1 ? "s" : ""} used
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {toolCalls.map((call, i) => (
            <span
              key={`${call.name}_${i}`}
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] ${
                call.ok
                  ? "border-[var(--border-subtle)] bg-white/[0.03] text-zinc-300"
                  : "border-[var(--accent-rose)]/30 bg-[var(--accent-rose)]/[0.06] text-[var(--accent-rose)]"
              }`}
            >
              {call.ok ? (
                <CheckCircle2 className="h-3 w-3 text-[var(--accent-emerald)]" />
              ) : (
                <XCircle className="h-3 w-3" />
              )}
              {TOOL_LABELS[call.name] ?? call.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

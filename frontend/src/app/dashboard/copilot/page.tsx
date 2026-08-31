"use client";

import { useState } from "react";
import { Send, Sparkles } from "lucide-react";

import { DashboardPageHeader } from "@/components/dashboard/PageHeader";

const SUGGESTED_PROMPTS = [
  "What's my revenue trend this month?",
  "Which products are underperforming?",
  "Summarize open revenue opportunities",
  "How's my payment success rate?",
];

const COPILOT_RULES = [
  "Never invents a number, name or ID — every figure traces to a tool call",
  "Read-only — can discuss an opportunity, never approve or execute one",
  "Caps at 4 tool iterations before an honest \"I don't know\"",
  "Falls back to a deterministic template if the AI provider fails mid-conversation",
];

export default function CopilotPage() {
  const [draft, setDraft] = useState("");

  return (
    <div>
      <DashboardPageHeader title="AI Copilot" description="Ask questions about your revenue, products and payments." />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="flex h-[480px] flex-col rounded-[20px] border border-black/[0.06] bg-white">
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-[#111217]">
              <Sparkles className="h-5 w-5 text-[#8C7BE0]" strokeWidth={1.75} />
            </div>
            <p className="text-[13.5px] font-medium text-[#111217]">Ask the copilot anything</p>
            <p className="max-w-xs text-[12px] leading-[1.5] text-[#8A8B92]">
              Every answer is grounded in a real tool call against your analytics and revenue data.
            </p>

            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setDraft(prompt)}
                  className="rounded-full border border-black/[0.1] px-3 py-1.5 text-[11.5px] font-medium text-[#5F6067] transition-colors hover:border-black/[0.2] hover:text-[#111217]"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* UI shell only — not wired to POST /api/v1/merchant/ai/chat yet */}
          <form onSubmit={(e) => e.preventDefault()} className="flex items-center gap-2 border-t border-black/[0.06] p-3">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask a question…"
              className="flex-1 rounded-[12px] border border-black/[0.1] bg-white px-3.5 py-2 text-[13px] text-[#111217] outline-none placeholder:text-[#A9AAB1] focus:border-[#111217]/30"
            />
            <button
              type="submit"
              disabled
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-[#111217] text-white outline-none disabled:cursor-not-allowed disabled:opacity-50"
              title="Not wired to the backend yet"
            >
              <Send className="h-4 w-4" strokeWidth={2} />
            </button>
          </form>
        </div>

        <div className="rounded-[20px] border border-black/[0.06] bg-white p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8A8B92]">How it's bounded</p>
          <ul className="mt-3 space-y-2.5">
            {COPILOT_RULES.map((rule) => (
              <li key={rule} className="text-[12px] leading-[1.5] text-[#5F6067]">
                {rule}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Send } from "lucide-react";

import { DashboardPageHeader } from "@/components/dashboard/PageHeader";
import { MOCK_AGENT_CONVERSATION, AGENT_CAPABILITIES } from "@/lib/mock/agent";
import { cn } from "@/lib/utils";

export default function CommerceAgentPage() {
  const [draft, setDraft] = useState("");

  return (
    <div>
      <DashboardPageHeader
        title="Commerce Agent"
        description="Test the conversational buyer experience against your own catalog."
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="flex h-[480px] flex-col rounded-[20px] border border-black/[0.06] bg-white">
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {MOCK_AGENT_CONVERSATION.map((turn, i) => (
              <div key={i} className={cn("flex flex-col gap-1", turn.role === "buyer" ? "items-end" : "items-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-[16px] px-4 py-2.5 text-[13.5px] leading-[1.55]",
                    turn.role === "buyer"
                      ? "rounded-tr-[4px] bg-[#111217] text-white"
                      : "rounded-tl-[4px] bg-[#F5F5F7] text-[#111217]"
                  )}
                >
                  {turn.text}
                </div>
                {turn.meta && <span className="px-1 text-[10.5px] text-[#A9AAB1]">{turn.meta}</span>}
              </div>
            ))}
          </div>

          {/* UI shell only — not wired to POST /api/v1/commerce/chat yet */}
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex items-center gap-2 border-t border-black/[0.06] p-3"
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Simulate a buyer message…"
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
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8A8B92]">Capabilities</p>
          <ul className="mt-3 space-y-2">
            {AGENT_CAPABILITIES.map((c) => (
              <li key={c} className="text-[12px] leading-[1.5] text-[#5F6067]">
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

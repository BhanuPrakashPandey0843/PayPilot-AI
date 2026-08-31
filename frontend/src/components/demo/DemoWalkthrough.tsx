"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bot, TrendingUp, ScrollText, Check, ShieldAlert, Info } from "lucide-react";

import { MOCK_AGENT_CONVERSATION } from "@/lib/mock/agent";
import { MOCK_OPPORTUNITIES } from "@/lib/mock/opportunities";
import { MOCK_AUDIT_TRAIL } from "@/lib/mock/audit";
import { OpportunityCard } from "./OpportunityCard";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "agent", label: "Commerce Agent", icon: Bot },
  { id: "revenue", label: "Revenue Opportunities", icon: TrendingUp },
  { id: "audit", label: "Audit Trail", icon: ScrollText },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function DemoWalkthrough() {
  const [tab, setTab] = useState<TabId>("agent");
  const [selectedOpportunity, setSelectedOpportunity] = useState(MOCK_OPPORTUNITIES[0].id);

  const activeOpportunity =
    MOCK_OPPORTUNITIES.find((o) => o.id === selectedOpportunity) ?? MOCK_OPPORTUNITIES[0];

  return (
    <div className="mx-auto max-w-4xl">
      {/* Tab switcher */}
      <div className="mx-auto flex w-fit items-center gap-1 rounded-full border border-black/[0.08] bg-white p-1 shadow-[0_10px_30px_-18px_rgba(20,20,30,0.18)]">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12.5px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#111217]/25",
              tab === id ? "bg-[#111217] text-white" : "text-[#5F6067] hover:text-[#111217]"
            )}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={2} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      <div className="mt-8">
        <AnimatePresence mode="wait">
          {tab === "agent" && (
            <motion.div
              key="agent"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-[0_16px_40px_-24px_rgba(20,20,30,0.14)] sm:p-6"
            >
              <div className="space-y-4">
                {MOCK_AGENT_CONVERSATION.map((turn, i) => (
                  <div
                    key={i}
                    className={cn("flex flex-col gap-1", turn.role === "buyer" ? "items-end" : "items-start")}
                  >
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
                    {turn.meta && (
                      <span className="px-1 text-[10.5px] text-[#A9AAB1]">{turn.meta}</span>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {tab === "revenue" && (
            <motion.div
              key="revenue"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="grid gap-5 sm:grid-cols-[minmax(0,320px)_minmax(0,1fr)]"
            >
              <div className="space-y-3">
                {MOCK_OPPORTUNITIES.map((opp) => (
                  <OpportunityCard
                    key={opp.id}
                    opportunity={opp}
                    selected={opp.id === selectedOpportunity}
                    onSelect={() => setSelectedOpportunity(opp.id)}
                  />
                ))}
              </div>

              <div className="rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-[0_16px_40px_-24px_rgba(20,20,30,0.14)] sm:p-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8A8B92]">
                  Why this scored {activeOpportunity.score}
                </p>
                <ul className="mt-3 space-y-2">
                  {activeOpportunity.evidence.map((line) => (
                    <li key={line} className="flex gap-2 text-[12.5px] leading-[1.55] text-[#3F424C]">
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#8C7BE0]" strokeWidth={2} />
                      {line}
                    </li>
                  ))}
                </ul>

                <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8A8B92]">
                  Recommended action
                </p>
                <p className="mt-2 text-[13px] leading-[1.55] text-[#111217]">
                  {activeOpportunity.recommendedAction}
                </p>

                <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8A8B92]">
                  Policy checks
                </p>
                <ul className="mt-2 space-y-1.5">
                  {activeOpportunity.policyChecks.map((check) => (
                    <li key={check.label} className="flex items-center gap-2 text-[12.5px] text-[#3F424C]">
                      {check.passed ? (
                        <Check className="h-3.5 w-3.5 shrink-0 text-[#1F9D6C]" strokeWidth={2.5} />
                      ) : (
                        <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-[#E0537A]" strokeWidth={2.25} />
                      )}
                      {check.label}
                    </li>
                  ))}
                </ul>

                <p className="mt-5 rounded-[12px] bg-[#F5F5F7] px-3.5 py-2.5 text-[11.5px] leading-[1.5] text-[#8A8B92]">
                  Approving an opportunity never charges anyone directly — execution only
                  prepares a fresh payment attempt for the buyer to complete.
                </p>
              </div>
            </motion.div>
          )}

          {tab === "audit" && (
            <motion.div
              key="audit"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-[0_16px_40px_-24px_rgba(20,20,30,0.14)] sm:p-6"
            >
              <ol className="relative space-y-5 border-l border-black/[0.08] pl-5">
                {MOCK_AUDIT_TRAIL.map((event) => (
                  <li key={event.id} className="relative">
                    <span
                      className={cn(
                        "absolute -left-[26px] top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-white",
                        event.result === "success" && "bg-[#1F9D6C]",
                        event.result === "blocked" && "bg-[#E0537A]",
                        event.result === "info" && "bg-[#8C7BE0]"
                      )}
                    />
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-black/[0.05] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#5F6067]">
                        {event.actorType.replace("_", " ")}
                      </span>
                      <span className="text-[11.5px] font-medium text-[#111217]">{event.actor}</span>
                      <span className="ml-auto text-[10.5px] text-[#A9AAB1]">{event.timestamp}</span>
                    </div>
                    <p className="mt-1 text-[13px] leading-[1.5] text-[#3F424C]">{event.action}</p>
                  </li>
                ))}
              </ol>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

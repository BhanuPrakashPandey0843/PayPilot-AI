"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

import { DashboardPageHeader } from "@/components/dashboard/PageHeader";
import { OpportunityCard } from "@/components/demo/OpportunityCard";
import { MOCK_OPPORTUNITIES } from "@/lib/mock/opportunities";

export default function RevenueOpportunitiesPage() {
  const [selected, setSelected] = useState(MOCK_OPPORTUNITIES[0].id);
  const active = MOCK_OPPORTUNITIES.find((o) => o.id === selected) ?? MOCK_OPPORTUNITIES[0];

  return (
    <div>
      <DashboardPageHeader
        title="Revenue Opportunities"
        description="Detected, scored and queued for your approval — nothing executes without it."
        action={
          <button
            type="button"
            disabled
            className="inline-flex h-9 items-center gap-1.5 rounded-[11px] border border-black/[0.1] px-3.5 text-[13px] font-medium text-[#111217] outline-none transition-colors hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-50"
            title="Not wired to POST /api/v1/revenue/detect yet"
          >
            <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} />
            Run detection
          </button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <div className="space-y-3">
          {MOCK_OPPORTUNITIES.map((opp) => (
            <OpportunityCard key={opp.id} opportunity={opp} selected={opp.id === selected} onSelect={() => setSelected(opp.id)} />
          ))}
        </div>

        <div className="rounded-[20px] border border-black/[0.06] bg-white p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8A8B92]">
            {active.title}
          </p>
          <p className="mt-2 text-[13px] leading-[1.55] text-[#111217]">{active.recommendedAction}</p>

          <div className="mt-5 flex gap-2">
            <button
              type="button"
              disabled
              className="inline-flex h-9 flex-1 items-center justify-center rounded-[11px] bg-[#111217] px-4 text-[12.5px] font-medium text-white outline-none disabled:cursor-not-allowed disabled:opacity-50"
              title="Not wired to POST /api/v1/revenue/opportunities/:id/approve yet"
            >
              Approve
            </button>
            <button
              type="button"
              disabled
              className="inline-flex h-9 flex-1 items-center justify-center rounded-[11px] border border-black/[0.1] px-4 text-[12.5px] font-medium text-[#111217] outline-none disabled:cursor-not-allowed disabled:opacity-50"
              title="Not wired to POST /api/v1/revenue/opportunities/:id/reject yet"
            >
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

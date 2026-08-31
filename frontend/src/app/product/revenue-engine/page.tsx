import type { Metadata } from "next";
import { Gauge, ListChecks, PlayCircle, ShieldAlert } from "lucide-react";

import { ProductFeaturePage } from "@/components/marketing/ProductFeaturePage";
import { Section } from "@/components/layout/Section";
import { FadeIn } from "@/components/animations/FadeIn";
import { MOCK_OPPORTUNITY_TYPES, MOCK_REVENUE_SUMMARY } from "@/lib/mock/revenue";

export const metadata: Metadata = {
  title: "Revenue Engine — PayPilot AI",
  description: "Five detectors, a transparent scoring formula, and a human-approval gate before anything ever executes.",
};

export default function RevenueEnginePage() {
  return (
    <ProductFeaturePage
      eyebrow="Product · Revenue Engine"
      title="Opportunities, scored"
      accent="in the open."
      description="Cross-sell, upsell, payment recovery, abandoned checkout, and revenue drop — five detectors run in parallel, each opportunity scored by a formula you can re-derive by hand."
      highlights={[
        {
          icon: Gauge,
          title: "Transparent scoring",
          body: "Score (0–100) is a sum of four capped factors — revenue impact, frequency, recency, severity — every raw point value persisted so nothing is a black box.",
        },
        {
          icon: ListChecks,
          title: "Five detectors, one engine",
          body: "CROSS_SELL, UPSELL, PAYMENT_RECOVERY, ABANDONED_CHECKOUT and REVENUE_DROP all run via Promise.allSettled — one detector failing never blocks the others.",
        },
        {
          icon: ShieldAlert,
          title: "Human approval required",
          body: "Detection only ever proposes. Approve, reject or execute are separate, permissioned actions — and execution runs through a four-check policy engine before anything happens.",
        },
        {
          icon: PlayCircle,
          title: "Execution never charges directly",
          body: "The only two automatable actions — retrying a failed payment or refreshing an abandoned checkout's payment link — reuse checkout.service.ts's existing idempotent path. The buyer still completes their own authorization.",
        },
      ]}
    >
      <Section tone="light">
        <div className="mx-auto max-w-3xl">
          <p className="mb-4 text-center text-[11px] font-medium uppercase tracking-[0.1em] text-[#A9AAB1]">
            Illustrative demo totals
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Detected", value: MOCK_REVENUE_SUMMARY.totalOpportunities },
              { label: "Approved", value: MOCK_REVENUE_SUMMARY.approved },
              { label: "Executed", value: MOCK_REVENUE_SUMMARY.executed },
              { label: "Recovery rate", value: `${Math.round(MOCK_REVENUE_SUMMARY.recoveryRate * 100)}%` },
            ].map((stat, i) => (
              <FadeIn key={stat.label} delay={i * 0.05}>
                <div className="rounded-[16px] border border-black/[0.06] bg-white p-4 text-center">
                  <p className="text-[19px] font-bold text-[#111217]">{stat.value}</p>
                  <p className="mt-1 text-[11px] text-[#8A8B92]">{stat.label}</p>
                </div>
              </FadeIn>
            ))}
          </div>

          <div className="mt-4 space-y-2">
            {MOCK_OPPORTUNITY_TYPES.map((item) => (
              <div key={item.type} className="flex items-center gap-3">
                <span className="w-40 shrink-0 text-[11.5px] font-medium text-[#5F6067]">
                  {item.type.replace("_", " ")}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/[0.05]">
                  <div
                    className="h-full rounded-full bg-[#8C7BE0]"
                    style={{ width: `${item.share * 100}%` }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right text-[11.5px] text-[#8A8B92]">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>
    </ProductFeaturePage>
  );
}

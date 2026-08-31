import type { Metadata } from "next";
import { MessageSquare, ListTree, TrendingUp, Megaphone } from "lucide-react";

import { MarketingPage } from "@/components/marketing/MarketingPage";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { CTASection } from "@/components/layout/CTASection";
import { FadeIn } from "@/components/animations/FadeIn";

export const metadata: Metadata = {
  title: "Agentic Commerce — PayPilot AI",
  description:
    "How PayPilot AI makes a merchant transactable by an AI buyer, end to end — conversational checkout, an agent-readable catalog, and bounded automation.",
};

const DIRECTIONS = [
  {
    icon: MessageSquare,
    title: "Conversational in-app checkout",
    body: "An AI buyer can search, compare, add to cart and preview an order in plain language. The same cart-policy engine that validates a preview also gates the real checkout call, so what an agent sees is always what it gets.",
  },
  {
    icon: ListTree,
    title: "Agent-readable catalog",
    body: "Every product is exposed in a machine-friendly shape — structured price, availability and tags, with no internal or tenant-identifying fields — so an AI buyer can reason about it without scraping HTML.",
  },
  {
    icon: TrendingUp,
    title: "Upsell & cross-sell agent",
    body: "Deterministic, explainable recommendations: an upsell is the same category at a higher price; a cross-sell shares a tag but sits in a different category. No black-box scoring — every suggestion comes with its reasons.",
  },
  {
    icon: Megaphone,
    title: "Campaign orchestrator",
    body: "Revenue opportunities (cross-sell, upsell, payment recovery, abandoned checkout, revenue drop) are detected, scored and queued for a human to approve — execution only ever prepares a fresh payment attempt, never charges directly.",
  },
];

export default function AgenticCommercePage() {
  return (
    <MarketingPage>
      <Section tone="light" className="pb-10 pt-0 sm:pb-14">
        <PageHeader
          eyebrow="Agentic Commerce"
          title="Built for the age of"
          accent="AI buyers."
          description="NPCI's UAP and the global protocol race (ACP, AP2, x402) are making agent-to-agent commerce the defining problem of the year. PayPilot AI is designed so a merchant's storefront is discoverable, explainable and transactable by an AI buyer, end to end."
        />
      </Section>

      <Section tone="muted">
        <div className="grid gap-4 sm:grid-cols-2">
          {DIRECTIONS.map(({ icon: Icon, title, body }, i) => (
            <FadeIn key={title} delay={i * 0.06}>
              <div className="h-full rounded-[22px] border border-black/[0.06] bg-white p-6 shadow-[0_16px_40px_-24px_rgba(20,20,30,0.14)]">
                <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#111217]">
                  <Icon className="h-[18px] w-[18px] text-[#8C7BE0]" strokeWidth={1.75} />
                </div>
                <h3 className="mt-4 text-[16px] font-semibold tracking-[-0.01em] text-[#111217]">
                  {title}
                </h3>
                <p className="mt-2 text-[13.5px] leading-[1.65] text-[#5F6067]">{body}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      <CTASection
        eyebrow="Try it"
        title="Talk to the commerce agent yourself."
        primaryLabel="Watch the demo"
        primaryHref="/demo"
      />
    </MarketingPage>
  );
}

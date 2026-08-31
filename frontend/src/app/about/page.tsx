import type { Metadata } from "next";
import { Sparkles, Target, ShieldCheck, Radar } from "lucide-react";

import { MarketingPage } from "@/components/marketing/MarketingPage";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { CTASection } from "@/components/layout/CTASection";
import { FadeIn } from "@/components/animations/FadeIn";

export const metadata: Metadata = {
  title: "About — PayPilot AI",
  description:
    "Why PayPilot AI exists: growing merchant revenue and making commerce transactable by AI buyers, end to end.",
};

const PILLARS = [
  {
    icon: Target,
    title: "The problem",
    body: "Merchants lose revenue to abandoned checkouts, missed upsells, and payment failures they only discover after the fact — and agent-to-agent commerce (ACP, AP2, x402) is about to make \"discoverable and transactable by an AI buyer\" a requirement, not a nice-to-have.",
  },
  {
    icon: Sparkles,
    title: "The vision",
    body: "PayPilot AI is a bounded, explainable growth agent that sits on top of a merchant's catalog, orders and payments — surfacing revenue opportunities, powering an agent-readable catalog, and handling conversational checkout without ever acting outside a defined policy.",
  },
  {
    icon: Radar,
    title: "Agentic commerce",
    body: "Every product is exposed in a machine-friendly shape an AI buyer can search, compare and reason about — with the same policy engine gating a chat-driven cart that gates a real checkout, so a preview is never contradicted by what actually happens.",
  },
  {
    icon: ShieldCheck,
    title: "Security philosophy",
    body: "Every money action is explainable, bounded and gated. Nothing charges a customer directly — execution only ever prepares a fresh payment attempt for the buyer to complete — and every action is written to an audit trail a human can review.",
  },
];

export default function AboutPage() {
  return (
    <MarketingPage>
      <Section tone="light" className="pb-10 pt-0 sm:pb-14">
        <PageHeader
          eyebrow="About PayPilot"
          title="Commerce that grows itself,"
          accent="responsibly."
          description="PayPilot AI is a submission for Track 01 — AI Growth & Agentic Commerce: build an agent that grows a merchant's revenue, or makes them transactable by an AI buyer, end to end."
        />
      </Section>

      <Section tone="muted">
        <div className="grid gap-4 sm:grid-cols-2">
          {PILLARS.map(({ icon: Icon, title, body }, i) => (
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

      <Section tone="light">
        <FadeIn>
          <div className="mx-auto max-w-2xl rounded-[22px] border border-black/[0.06] bg-white p-7 text-center shadow-[0_16px_40px_-24px_rgba(20,20,30,0.14)] sm:p-9">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8C7A16]">
              The bar
            </p>
            <p className="mt-3 font-serif text-[19px] italic leading-[1.5] text-[#111217] sm:text-[22px]">
              &ldquo;Every money action explainable, bounded and gated. Show the audit trail
              and one failure handled gracefully.&rdquo;
            </p>
          </div>
        </FadeIn>
      </Section>

      <CTASection
        eyebrow="Built for the track"
        title="See how the agent works, end to end."
        secondaryLabel="Read the docs"
        secondaryHref="/docs"
      />
    </MarketingPage>
  );
}

import type { Metadata } from "next";

import { MarketingPage } from "@/components/marketing/MarketingPage";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { CTASection } from "@/components/layout/CTASection";
import { DemoWalkthrough } from "@/components/demo/DemoWalkthrough";

export const metadata: Metadata = {
  title: "Demo — PayPilot AI",
  description:
    "See the commerce agent, revenue opportunities, and audit trail in action with a walkthrough built on illustrative demo data.",
};

export default function DemoPage() {
  return (
    <MarketingPage>
      <Section tone="light" className="pb-6 pt-0 sm:pb-8">
        <PageHeader
          eyebrow="Interactive Demo"
          title="Watch the agent"
          accent="think out loud."
          description="Every tab below uses illustrative demo data — never the live backend — so you can explore the conversation flow, the revenue-opportunity reasoning, and the audit trail without an account."
        />
      </Section>

      <Section tone="light" className="pt-0">
        <DemoWalkthrough />
      </Section>

      <CTASection
        eyebrow="Prefer video?"
        title="Watch the recorded walkthrough instead."
        primaryLabel="Watch video"
        primaryHref="/demo/video"
        secondaryLabel="Read the docs"
        secondaryHref="/docs"
      />
    </MarketingPage>
  );
}

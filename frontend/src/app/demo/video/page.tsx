import type { Metadata } from "next";
import { PlayCircle } from "lucide-react";

import { MarketingPage } from "@/components/marketing/MarketingPage";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { CTASection } from "@/components/layout/CTASection";

export const metadata: Metadata = {
  title: "Demo Video — PayPilot AI",
  description: "A recorded walkthrough of the PayPilot AI commerce agent, revenue engine, and audit trail.",
};

export default function DemoVideoPage() {
  return (
    <MarketingPage>
      <Section tone="light" className="pb-6 pt-0 sm:pb-8">
        <PageHeader
          eyebrow="Demo Video"
          title="Watch it"
          accent="end to end."
          description="A recorded walkthrough of product discovery, conversational checkout, revenue-opportunity detection, and the audit trail."
        />
      </Section>

      <Section tone="light" className="pt-0">
        <div className="mx-auto max-w-4xl">
          {/* Video embed placeholder — swap the inner div for a real
              <video>/<iframe> once a recording is available. */}
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-[24px] border border-dashed border-black/[0.12] bg-[#F5F5F7] text-center">
            <PlayCircle className="h-12 w-12 text-[#8A8B92]" strokeWidth={1.25} />
            <p className="text-[13px] font-medium text-[#5F6067]">
              Video walkthrough coming soon
            </p>
            <p className="max-w-xs text-[12px] leading-[1.5] text-[#A9AAB1]">
              In the meantime, try the{" "}
              <a href="/demo" className="underline underline-offset-2 hover:text-[#5F6067]">
                interactive demo
              </a>
              .
            </p>
          </div>
        </div>
      </Section>

      <CTASection eyebrow="Or explore live" title="Try the interactive demo instead." primaryLabel="Open demo" primaryHref="/demo" />
    </MarketingPage>
  );
}

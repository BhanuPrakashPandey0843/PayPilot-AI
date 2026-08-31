import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { MarketingPage } from "@/components/marketing/MarketingPage";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { FadeIn } from "@/components/animations/FadeIn";
import { DOCS_NAV } from "@/lib/docs";

export const metadata: Metadata = {
  title: "Documentation — PayPilot AI",
  description: "Technical and product documentation for PayPilot AI — auth, catalog, commerce agent, checkout, analytics and more.",
};

export default function DocsIndexPage() {
  return (
    <MarketingPage>
      <Section tone="light" className="pb-8 pt-0 sm:pb-10">
        <PageHeader
          eyebrow="Documentation"
          title="Everything about"
          accent="how it works."
          description="Reference material for every module — from registering an organization to how the revenue engine scores an opportunity."
        />
      </Section>

      <Section tone="light" className="pt-0">
        <div className="mx-auto max-w-4xl space-y-10">
          {DOCS_NAV.map((group, gi) => (
            <FadeIn key={group.heading} delay={gi * 0.05}>
              <div>
                <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#8A8B92]">
                  {group.heading}
                </h2>
                <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                  {group.entries.map((entry) => (
                    <Link
                      key={entry.slug}
                      href={`/docs/${entry.slug}`}
                      className="group flex items-start justify-between gap-3 rounded-[16px] border border-black/[0.06] bg-white p-4 transition-colors hover:border-black/[0.14]"
                    >
                      <div>
                        <p className="text-[13.5px] font-semibold text-[#111217]">{entry.title}</p>
                        <p className="mt-1 text-[12px] leading-[1.5] text-[#8A8B92]">
                          {entry.description}
                        </p>
                      </div>
                      <ArrowRight
                        className="mt-1 h-3.5 w-3.5 shrink-0 text-[#A9AAB1] transition-transform group-hover:translate-x-0.5 group-hover:text-[#111217]"
                        strokeWidth={2}
                      />
                    </Link>
                  ))}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>
    </MarketingPage>
  );
}

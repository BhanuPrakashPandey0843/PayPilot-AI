import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { MarketingPage } from "@/components/marketing/MarketingPage";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { CTASection } from "@/components/layout/CTASection";
import { FadeIn } from "@/components/animations/FadeIn";

type Highlight = {
  icon: LucideIcon;
  title: string;
  body: string;
};

/**
 * Shared template for the `/product/*` feature pages (ai-agent, analytics,
 * catalog, checkout, revenue-engine) so each one stays a thin content
 * definition instead of a bespoke layout.
 */
export function ProductFeaturePage({
  eyebrow,
  title,
  accent,
  description,
  highlights,
  children,
  ctaTitle = "Ready to see it on your own catalog?",
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  description: string;
  highlights: Highlight[];
  children?: ReactNode;
  ctaTitle?: string;
}) {
  return (
    <MarketingPage>
      <Section tone="light" className="pb-10 pt-0 sm:pb-14">
        <PageHeader eyebrow={eyebrow} title={title} accent={accent} description={description} />
      </Section>

      <Section tone="muted">
        <div className="grid gap-4 sm:grid-cols-2">
          {highlights.map(({ icon: Icon, title: hTitle, body }, i) => (
            <FadeIn key={hTitle} delay={i * 0.06}>
              <div className="h-full rounded-[22px] border border-black/[0.06] bg-white p-6 shadow-[0_16px_40px_-24px_rgba(20,20,30,0.14)]">
                <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#111217]">
                  <Icon className="h-[18px] w-[18px] text-[#8C7BE0]" strokeWidth={1.75} />
                </div>
                <h3 className="mt-4 text-[16px] font-semibold tracking-[-0.01em] text-[#111217]">
                  {hTitle}
                </h3>
                <p className="mt-2 text-[13.5px] leading-[1.65] text-[#5F6067]">{body}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      {children}

      <CTASection eyebrow="Get started" title={ctaTitle} />
    </MarketingPage>
  );
}

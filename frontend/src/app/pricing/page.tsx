import type { Metadata } from "next";
import { Check } from "lucide-react";

import { MarketingPage } from "@/components/marketing/MarketingPage";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { CTASection } from "@/components/layout/CTASection";
import { FadeIn } from "@/components/animations/FadeIn";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pricing — PayPilot AI",
  description: "Simple, usage-aware pricing for merchants growing revenue with PayPilot AI.",
};

// Placeholder tiers — no billing integration exists yet; figures are
// illustrative only and intentionally not wired to a real plans API.
const TIERS = [
  {
    name: "Starter",
    price: "Free",
    tagline: "For evaluating the agent on a single storefront.",
    features: ["Up to 100 products", "Commerce agent (rate-limited)", "Core analytics", "Community support"],
    highlighted: false,
  },
  {
    name: "Growth",
    price: "Contact us",
    tagline: "For merchants running revenue-opportunity automation.",
    features: [
      "Unlimited products",
      "Revenue opportunity detection & approval workflow",
      "Full analytics suite",
      "AI copilot",
      "Priority support",
    ],
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Contact us",
    tagline: "For multi-org platforms with custom policy needs.",
    features: ["Everything in Growth", "Custom action-policy limits", "Dedicated audit review", "SLA & onboarding support"],
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <MarketingPage>
      <Section tone="light" className="pb-10 pt-0 sm:pb-14">
        <PageHeader
          eyebrow="Pricing"
          title="Plans that grow"
          accent="with you."
          description="PayPilot AI is currently a hackathon prototype — pricing below is illustrative. Reach out and we'll figure out the right fit."
        />
      </Section>

      <Section tone="muted">
        <div className="grid gap-5 lg:grid-cols-3">
          {TIERS.map((tier, i) => (
            <FadeIn key={tier.name} delay={i * 0.06}>
              <div
                className={cn(
                  "flex h-full flex-col rounded-[24px] border p-6 sm:p-7",
                  tier.highlighted
                    ? "border-[#111217] bg-[#111217] text-white shadow-[0_24px_60px_-24px_rgba(17,18,23,0.4)]"
                    : "border-black/[0.06] bg-white shadow-[0_16px_40px_-24px_rgba(20,20,30,0.14)]"
                )}
              >
                <p className={cn("text-[13px] font-semibold", tier.highlighted ? "text-white" : "text-[#111217]")}>
                  {tier.name}
                </p>
                <p className={cn("mt-3 text-[30px] font-extrabold tracking-[-0.02em]", tier.highlighted ? "text-white" : "text-[#111217]")}>
                  {tier.price}
                </p>
                <p className={cn("mt-2 text-[12.5px] leading-[1.5]", tier.highlighted ? "text-white/60" : "text-[#8A8B92]")}>
                  {tier.tagline}
                </p>

                <ul className="mt-6 flex-1 space-y-2.5">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className={cn(
                        "flex items-start gap-2 text-[13px] leading-[1.45]",
                        tier.highlighted ? "text-white/85" : "text-[#3F424C]"
                      )}
                    >
                      <Check
                        className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", tier.highlighted ? "text-[#8C7BE0]" : "text-[#1F9D6C]")}
                        strokeWidth={2.5}
                      />
                      {feature}
                    </li>
                  ))}
                </ul>

                <a
                  href={tier.price === "Free" ? "/auth/register" : "/contact"}
                  className={cn(
                    "mt-7 inline-flex h-10 items-center justify-center rounded-[12px] px-5 text-[13px] font-medium outline-none transition-opacity hover:opacity-90",
                    tier.highlighted ? "bg-white text-[#111217]" : "border border-black/[0.1] text-[#111217]"
                  )}
                >
                  {tier.price === "Free" ? "Get started" : "Talk to us"}
                </a>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      <CTASection eyebrow="Questions?" title="We're happy to walk through fit." secondaryLabel="Contact us" secondaryHref="/contact" />
    </MarketingPage>
  );
}

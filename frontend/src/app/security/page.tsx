import type { Metadata } from "next";
import { ShieldCheck, ScrollText, Lock, GitCommitHorizontal } from "lucide-react";

import { MarketingPage } from "@/components/marketing/MarketingPage";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { CTASection } from "@/components/layout/CTASection";
import { FadeIn } from "@/components/animations/FadeIn";
import { MOCK_AUDIT_TRAIL } from "@/lib/mock/audit";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Security — PayPilot AI",
  description: "Every money action explainable, bounded and gated — how PayPilot AI keeps automated commerce safe.",
};

const PRINCIPLES = [
  {
    icon: Lock,
    title: "Bounded, never unrestricted",
    body: "The AI copilot is read-only by design — 6 tools, all org-scoped by the server, none of them able to approve or execute a financial action. Approving and executing revenue opportunities stay behind separate, human-permissioned REST endpoints.",
  },
  {
    icon: GitCommitHorizontal,
    title: "Gated by policy engines",
    body: "Two independent, deterministic policy engines — one validates a cart before checkout, the other validates whether an approved revenue opportunity is safe to auto-execute (status, expiry, action type, and amount ceiling).",
  },
  {
    icon: ScrollText,
    title: "Every action, audited",
    body: "Money-relevant actions — payment captures, opportunity approvals, AI tool calls, webhook processing failures — are written to an organization-scoped audit trail. Nothing important happens silently.",
  },
  {
    icon: ShieldCheck,
    title: "Signature-verified, idempotent",
    body: "Razorpay webhooks are HMAC-verified against the raw request body and deduplicated at the database layer. Checkout requests never trust a client-supplied amount — it's always recomputed server-side.",
  },
];

export default function SecurityPage() {
  return (
    <MarketingPage>
      <Section tone="light" className="pb-10 pt-0 sm:pb-14">
        <PageHeader
          eyebrow="Security"
          title="Every money action"
          accent="explainable."
          description="\u201cExplainable, bounded and gated\u201d isn't a tagline here — it's the literal bar for this build. Below is how that plays out in the architecture."
        />
      </Section>

      <Section tone="muted">
        <div className="grid gap-4 sm:grid-cols-2">
          {PRINCIPLES.map(({ icon: Icon, title, body }, i) => (
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
        <div className="mx-auto max-w-2xl">
          <p className="mb-4 text-center text-[11px] font-medium uppercase tracking-[0.1em] text-[#A9AAB1]">
            Sample audit trail
          </p>
          <ol className="relative space-y-5 rounded-[22px] border border-black/[0.06] bg-white p-6 shadow-[0_16px_40px_-24px_rgba(20,20,30,0.14)]">
            {MOCK_AUDIT_TRAIL.map((event) => (
              <li key={event.id} className="flex items-start gap-3">
                <span
                  className={cn(
                    "mt-1 h-2 w-2 shrink-0 rounded-full",
                    event.result === "success" && "bg-[#1F9D6C]",
                    event.result === "blocked" && "bg-[#E0537A]",
                    event.result === "info" && "bg-[#8C7BE0]"
                  )}
                />
                <div>
                  <p className="text-[12.5px] font-medium text-[#111217]">
                    {event.actor} <span className="text-[#A9AAB1]">· {event.timestamp}</span>
                  </p>
                  <p className="mt-0.5 text-[12.5px] leading-[1.5] text-[#5F6067]">{event.action}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      <CTASection eyebrow="Have a security question?" title="Talk to the team directly." secondaryLabel="Contact us" secondaryHref="/contact" />
    </MarketingPage>
  );
}

import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";

import { MarketingPage } from "@/components/marketing/MarketingPage";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { FadeIn } from "@/components/animations/FadeIn";

export const metadata: Metadata = {
  title: "Status — PayPilot AI",
  description: "Current operational status of PayPilot AI's services.",
};

// Static placeholder — there is no status/uptime provider wired up yet.
// Replace with a real status-page integration (or a live health-check
// call) once one exists; this list intentionally isn't a fake API.
const SERVICES = [
  { name: "API", status: "operational" as const },
  { name: "Commerce Agent", status: "operational" as const },
  { name: "AI Copilot", status: "operational" as const },
  { name: "Checkout (Razorpay test-mode)", status: "operational" as const },
  { name: "Webhooks", status: "operational" as const },
];

export default function StatusPage() {
  return (
    <MarketingPage>
      <Section tone="light" className="pb-10 pt-0 sm:pb-14">
        <PageHeader
          eyebrow="Status"
          title="All systems"
          accent="operational."
          description="A lightweight status placeholder for the prototype. This page isn't yet connected to a real uptime monitor."
        />
      </Section>

      <Section tone="light" className="pt-0">
        <div className="mx-auto max-w-xl divide-y divide-black/[0.06] overflow-hidden rounded-[20px] border border-black/[0.06] bg-white">
          {SERVICES.map((service, i) => (
            <FadeIn key={service.name} delay={i * 0.04}>
              <div className="flex items-center justify-between px-5 py-3.5">
                <span className="text-[13.5px] font-medium text-[#111217]">{service.name}</span>
                <span className="flex items-center gap-1.5 text-[12px] font-medium text-[#1F9D6C]">
                  <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
                  Operational
                </span>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>
    </MarketingPage>
  );
}

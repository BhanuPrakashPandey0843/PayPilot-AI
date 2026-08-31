import type { Metadata } from "next";
import { Mail, Store, Handshake, MessageCircle } from "lucide-react";

import { MarketingPage } from "@/components/marketing/MarketingPage";
import { PageHeader } from "@/components/layout/PageHeader";
import { Section } from "@/components/layout/Section";
import { ContactForm } from "@/components/marketing/ContactForm";
import { FadeIn } from "@/components/animations/FadeIn";

export const metadata: Metadata = {
  title: "Contact — PayPilot AI",
  description: "Get in touch with the PayPilot AI team — business, merchant support, and partnership inquiries.",
};

const CONTACT_EMAIL = "bhanupandey0843@gmail.com";

const CHANNELS = [
  { icon: Mail, title: "General inquiries", body: CONTACT_EMAIL },
  { icon: Store, title: "Merchant support", body: "Questions about your catalog, orders or payments" },
  { icon: Handshake, title: "Partnerships", body: "Integrations, pilots and collaboration" },
  { icon: MessageCircle, title: "Business", body: "Everything else — just ask" },
];

export default function ContactPage() {
  return (
    <MarketingPage>
      <Section tone="light" className="pb-8 pt-0 sm:pb-10">
        <PageHeader
          eyebrow="Contact"
          title="Let's talk"
          accent="commerce."
          description="Whether you're a merchant, a partner, or just curious about the agent — we'd love to hear from you."
        />
      </Section>

      <Section tone="light" className="pt-0">
        <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <FadeIn>
            <ContactForm />
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="space-y-3">
              {CHANNELS.map(({ icon: Icon, title, body }) => (
                <div
                  key={title}
                  className="flex items-start gap-3 rounded-[16px] border border-black/[0.06] bg-white p-4"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-black/[0.04]">
                    <Icon className="h-4 w-4 text-[#8C7BE0]" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-[#111217]">{title}</p>
                    <p className="mt-0.5 text-[12px] leading-[1.5] text-[#8A8B92]">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </Section>
    </MarketingPage>
  );
}

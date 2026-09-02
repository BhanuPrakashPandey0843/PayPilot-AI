"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Boxes,
  Eye,
  FileClock,
  ShoppingBag,
  Sparkles,
  Target,
  type LucideIcon,
} from "lucide-react";
import { SectionBadge } from "./SectionBadge";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface TrackPillar {
  label: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

/** Track 01 — "Grow the merchant's revenue, and make them sellable to AI
 * buyers." PayPilot AI approaches this from both directions at once. */
const PILLARS: TrackPillar[] = [
  {
    label: "Merchant Side",
    title: "Find revenue opportunities",
    description:
      "Failed payments, abandoned checkouts, and missed upsells are detected, scored, and turned into a ranked list of next actions.",
    icon: Target,
  },
  {
    label: "Buyer Side",
    title: "Make products AI-transactable",
    description:
      "Every product is exposed in structured, agent-readable form, so an AI buyer can search, compare, and check out without scraping a page.",
    icon: ShoppingBag,
  },
  {
    label: "AI-Readable Catalog",
    title: "Structure over scraping",
    description:
      "Name, price, availability, tags, and product relationships are queryable data \u2014 not text an agent has to guess at.",
    icon: Boxes,
  },
  {
    label: "Explainable",
    title: "Every recommendation has a reason",
    description:
      "Opportunities carry evidence, a confidence score, and an estimated impact \u2014 never a black-box suggestion.",
    icon: Eye,
  },
  {
    label: "Bounded",
    title: "Policy decides what's allowed",
    description:
      "Amount limits, permissions, and status checks run before any recommended action reaches Razorpay.",
    icon: Sparkles,
  },
  {
    label: "Auditable",
    title: "Every action leaves a trail",
    description:
      "What was recommended, what was allowed, and what actually happened \u2014 all timestamped and traceable.",
    icon: FileClock,
  },
];

/**
 * "Built for the Agentic Commerce Era" — sits directly above Pricing on the
 * home page. Explicitly connects PayPilot AI to Track 01: a 3x2 grid of
 * pillar cards covering both the merchant side (revenue) and the buyer side
 * (agentic commerce), plus the explainability/bounded/auditable themes that
 * make the financial agent trustworthy. No customer quotes or attributed
 * names are used here \u2014 these are product claims, not testimonials.
 */
export function Testimonials() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from("[data-testimonial-reveal]", {
        opacity: 0,
        y: 24,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 78%",
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="border-t border-white/5 bg-black px-6 py-24"
    >
      <div className="mx-auto max-w-6xl">
        <div data-testimonial-reveal className="flex justify-center">
          <SectionBadge label="Track 01 — AI Growth & Agentic Commerce" />
        </div>
        <h2
          data-testimonial-reveal
          className="mx-auto mt-4 max-w-xl text-center text-3xl font-semibold tracking-tight text-white sm:text-4xl"
        >
          Built for the agentic commerce era
        </h2>
        <p
          data-testimonial-reveal
          className="mx-auto mt-4 max-w-lg text-center text-sm text-zinc-400 sm:text-base"
        >
          Grow the merchant&apos;s revenue, and make them sellable to AI
          buyers \u2014 approached from both directions at once.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((pillar) => (
            <PillarCard key={pillar.label} pillar={pillar} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PillarCard({ pillar }: { pillar: TrackPillar }) {
  const Icon = pillar.icon;

  return (
    <div
      data-testimonial-reveal
      className="relative flex flex-col rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900/80 to-black p-6 transition-transform duration-300 hover:-translate-y-1 sm:p-7"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white">
          <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-blue-400">
            {pillar.label}
          </p>
          <p className="text-sm font-medium text-white">{pillar.title}</p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-zinc-400">
        {pillar.description}
      </p>
    </div>
  );
}

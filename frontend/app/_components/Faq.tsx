"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, Plus } from "lucide-react";
import { Button } from "./Button";
import { SectionBadge } from "./SectionBadge";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface FaqItem {
  question: string;
  answer: string;
}

/**
 * Copy is PayPilot-specific rather than generic — swap freely, structure
 * (question/answer pairs) is what the row component depends on.
 */
const FAQ_ITEMS: FaqItem[] = [
  {
    question: "What does PayPilot AI actually connect to?",
    answer:
      "Your existing Razorpay account. Checkout, payment verification, and webhooks all run through Razorpay's test-mode APIs today, on a multi-tenant backend (PostgreSQL/Neon, RBAC per organization) — so onboarding is pointing PayPilot AI at a catalog you already have, not migrating payment infrastructure.",
  },
  {
    question: "How does AI recommend actions without being able to spend money?",
    answer:
      "AI never touches money directly. Every recommended action — a payment retry, a checkout follow-up — is evaluated against a deterministic policy engine that checks status, expiry, amount limits, and whether the action type is even executable, and returns an explainable ALLOWED or BLOCKED before anything reaches Razorpay.",
  },
  {
    question: "What revenue opportunities does it actually detect?",
    answer:
      "Five detectors run in parallel: cross-sell (co-purchase attachment rate ≥25%), upsell (repeat same-category upgrades), payment recovery (recent failed payments), abandoned checkout (orders stuck pending), and revenue drop (a period-over-period fall past a configurable threshold). Each opportunity is scored 0–100 from transparent, reproducible factors — revenue impact, frequency, recency, and severity.",
  },
  {
    question: "Can the AI copilot spend money or change my catalog on its own?",
    answer:
      "No. The copilot has exactly six read-only tools — revenue overview, trends, product and payment performance, opportunity lookups, and recommendations — and no execute tool at all. Approving, rejecting, or executing a revenue action always stays behind a human-driven endpoint the copilot can't call.",
  },
  {
    question: "Is this running real, live payments?",
    answer:
      "Payment flows currently run against Razorpay's test-mode APIs, so you can see the full detect → recommend → policy-check → execute loop working end-to-end before any real money moves through it.",
  },
];

/**
 * FAQ section — sits directly above FinalCta on the home page. Left column
 * is an original abstract "AI core" visual (no stock photography, so it
 * stays on-brand and license-clean); right column is a single-open
 * accordion. All entrance/expand motion runs through GSAP so it stays
 * consistent with the rest of the site's animation language.
 */
export function Faq() {
  const sectionRef = useRef<HTMLElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const scanRef = useRef<HTMLDivElement>(null);
  const [openIndex, setOpenIndex] = useState(0);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from("[data-faq-reveal]", {
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

      gsap.to(orbRef.current, {
        y: -14,
        scale: 1.06,
        duration: 3.2,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });

      gsap.fromTo(
        scanRef.current,
        { top: "10%", opacity: 0 },
        {
          top: "88%",
          opacity: 1,
          duration: 3.6,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        },
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="border-t border-white/5 bg-black px-6 py-24"
    >
      <div className="mx-auto max-w-6xl">
        <div data-faq-reveal>
          <SectionBadge label="FAQ" />
        </div>

        <h2
          data-faq-reveal
          className="mt-4 max-w-lg text-3xl font-semibold tracking-tight text-white sm:text-4xl"
        >
          Get your queries solved
        </h2>

        <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:items-stretch lg:gap-16">
          {/* Visual panel — original abstract "AI core", not a photo */}
          <div
            data-faq-reveal
            className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900 via-black to-black lg:aspect-auto lg:min-h-[420px]"
          >
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)",
                backgroundSize: "22px 22px",
              }}
            />

            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(circle_at_center,black,transparent_75%)]"
            >
              <div
                ref={orbRef}
                className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/30 blur-3xl"
              />
              <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-400 shadow-[0_0_50px_12px_rgba(59,130,246,0.55)]" />
            </div>

            <div
              ref={scanRef}
              aria-hidden="true"
              className="absolute inset-x-6 h-px bg-gradient-to-r from-transparent via-blue-400/70 to-transparent"
            />

            <span
              aria-hidden="true"
              className="absolute left-6 top-6 h-6 w-6 border-l-2 border-t-2 border-white/20"
            />
            <span
              aria-hidden="true"
              className="absolute bottom-6 right-6 h-6 w-6 border-b-2 border-r-2 border-white/20"
            />

            <div className="absolute right-6 top-6 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-3 py-1 backdrop-blur">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-blue-400" />
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                AI Active
              </span>
            </div>
          </div>

          {/* Accordion */}
          <div className="flex flex-col justify-between">
            <ul className="divide-y divide-white/10 border-t border-white/10">
              {FAQ_ITEMS.map((item, index) => (
                <FaqRow
                  key={item.question}
                  item={item}
                  isOpen={openIndex === index}
                  onToggle={() =>
                    setOpenIndex((current) => (current === index ? -1 : index))
                  }
                />
              ))}
            </ul>

            <div
              data-faq-reveal
              className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center"
            >
              <p className="text-sm text-zinc-400">Still have questions?</p>
              <Button href="/contact-us" variant="outline">
                Contact Our Team
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FaqRow({
  item,
  isOpen,
  onToggle,
}: {
  item: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    const el = contentRef.current;
    const icon = iconRef.current;
    if (!el || !icon) return;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      gsap.set(el, { height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 });
      gsap.set(icon, { rotate: isOpen ? 45 : 0 });
      return;
    }

    gsap.to(el, {
      height: isOpen ? "auto" : 0,
      opacity: isOpen ? 1 : 0,
      duration: 0.45,
      ease: "power2.inOut",
    });
    gsap.to(icon, {
      rotate: isOpen ? 45 : 0,
      duration: 0.35,
      ease: "power2.out",
    });
  }, [isOpen]);

  return (
    <li data-faq-reveal>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-6 py-5 text-left transition-colors duration-200"
      >
        <span
          className={`text-sm font-medium transition-colors duration-200 sm:text-base ${
            isOpen ? "text-white" : "text-zinc-300 hover:text-white"
          }`}
        >
          {item.question}
        </span>
        <span
          ref={iconRef}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 text-zinc-400"
        >
          <Plus className="h-3.5 w-3.5" />
        </span>
      </button>

      <div
        ref={contentRef}
        className="overflow-hidden"
        style={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
      >
        <p className="pb-5 pr-12 text-sm text-zinc-400 sm:text-base">
          {item.answer}
        </p>
      </div>
    </li>
  );
}

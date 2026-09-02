"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "./Button";
import { SectionBadge } from "./SectionBadge";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type Billing = "monthly" | "yearly";

interface Plan {
  name: string;
  badge?: string;
  monthlyPrice?: number;
  description: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  highlighted?: boolean;
}

/** PayPilot-specific plan copy — feature arrays are written in
 * column-major order (first half = left column, second half = right
 * column) to match the grid-flow-col layout in PricingFeatures. */
const PLANS: Plan[] = [
  {
    name: "For merchants on Razorpay",
    badge: "Popular",
    monthlyPrice: 2999,
    description: "Everything needed to detect and recover lost revenue",
    features: [
      "Agent-readable catalog & search",
      "All 5 revenue-opportunity detectors",
      "Deterministic upsell & cross-sell engine",
      "Policy-checked, idempotent execution",
      "Full audit trail on every action",
      "Priority email support",
    ],
    ctaLabel: "Get Started",
    ctaHref: "/signup",
  },
  {
    name: "For platforms & large catalogs",
    monthlyPrice: undefined,
    description: "Higher limits, more orgs, and a dedicated rollout",
    features: [
      "Multiple organizations & custom RBAC roles",
      "Conversational commerce agent for buyers",
      "Read-only AI copilot over your analytics",
      "Configurable policy limits & thresholds",
      "Dedicated onboarding & integration support",
      "24/7 priority support",
    ],
    ctaLabel: "Talk To Sales Team",
    ctaHref: "/contact-us",
    highlighted: true,
  },
];

/**
 * Pricing section — sits directly above HowWeWork on the home page.
 * Monthly/Yearly toggle uses a GSAP-animated sliding pill (same pattern as
 * HowWeWork's nav indicator) and the numeric price crossfades via GSAP
 * whenever billing changes. Everything else — type scale, badge, colors,
 * buttons — is pulled from the shared components already used elsewhere,
 * so it can't visually drift from the rest of the site.
 */
export function Pricing() {
  const sectionRef = useRef<HTMLElement>(null);
  const monthlyBtnRef = useRef<HTMLButtonElement>(null);
  const yearlyBtnRef = useRef<HTMLButtonElement>(null);
  const toggleIndicatorRef = useRef<HTMLDivElement>(null);
  const isFirstToggleMove = useRef(true);
  const [billing, setBilling] = useState<Billing>("monthly");

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from("[data-pricing-reveal]", {
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

  useEffect(() => {
    const activeBtn =
      billing === "monthly" ? monthlyBtnRef.current : yearlyBtnRef.current;
    const indicator = toggleIndicatorRef.current;
    if (!activeBtn || !indicator) return;

    const target = { left: activeBtn.offsetLeft, width: activeBtn.offsetWidth };

    if (isFirstToggleMove.current) {
      isFirstToggleMove.current = false;
      gsap.set(indicator, target);
      return;
    }

    gsap.to(indicator, { ...target, duration: 0.4, ease: "power3.out" });
  }, [billing]);

  return (
    <section
      ref={sectionRef}
      className="border-t border-white/5 bg-black px-6 py-24"
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div data-pricing-reveal>
              <SectionBadge label="Pricing" />
            </div>
            <h2
              data-pricing-reveal
              className="mt-4 max-w-lg text-3xl font-semibold tracking-tight text-white sm:text-4xl"
            >
              Simple pricing serious results
            </h2>
          </div>

          <p
            data-pricing-reveal
            className="max-w-xs text-sm text-zinc-400 lg:pt-2 lg:text-right"
          >
            Most merchants are running against their Razorpay catalog
            within days — detection and policy checks work the same from
            day one.
          </p>
        </div>

        {/* Billing toggle */}
        <div data-pricing-reveal className="mt-10">
          <div className="relative inline-flex items-center rounded-full border border-white/10 bg-zinc-900 p-1">
            <div
              ref={toggleIndicatorRef}
              aria-hidden="true"
              className="absolute top-1 h-[calc(100%-8px)] rounded-full bg-blue-600"
            />
            <button
              type="button"
              ref={monthlyBtnRef}
              onClick={() => setBilling("monthly")}
              className={`relative z-10 rounded-full px-5 py-2 text-sm font-medium transition-colors duration-300 ${
                billing === "monthly" ? "text-white" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              ref={yearlyBtnRef}
              onClick={() => setBilling("yearly")}
              className={`relative z-10 flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-colors duration-300 ${
                billing === "yearly" ? "text-white" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Yearly
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors duration-300 ${
                  billing === "yearly"
                    ? "bg-white/15 text-white"
                    : "bg-white/5 text-zinc-500"
                }`}
              >
                20% Less
              </span>
            </button>
          </div>
        </div>

        {/* Plan cards */}
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {PLANS.map((plan) => (
            <PlanCard key={plan.name} plan={plan} billing={billing} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PlanCard({ plan, billing }: { plan: Plan; billing: Billing }) {
  const priceRef = useRef<HTMLDivElement>(null);
  const isFirstPriceRender = useRef(true);

  useEffect(() => {
    if (!priceRef.current || plan.monthlyPrice === undefined) return;

    if (isFirstPriceRender.current) {
      isFirstPriceRender.current = false;
      return;
    }

    gsap.fromTo(
      priceRef.current,
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" },
    );
  }, [billing, plan.monthlyPrice]);

  const displayPrice =
    plan.monthlyPrice === undefined
      ? "Custom"
      : `$${(billing === "monthly"
          ? plan.monthlyPrice
          : Math.round(plan.monthlyPrice * 0.8)
        ).toLocaleString()}`;

  return (
    <div
      data-pricing-reveal
      className={`relative flex flex-col overflow-hidden rounded-3xl p-8 transition-transform duration-300 hover:-translate-y-1 sm:p-10 ${
        plan.highlighted
          ? "border border-blue-500/40 bg-gradient-to-b from-zinc-900 to-black shadow-[0_0_50px_-15px_rgba(37,99,235,0.45)]"
          : "border border-white/10 bg-gradient-to-b from-zinc-900/80 to-black"
      }`}
    >
      {plan.highlighted ? (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent"
        />
      ) : null}

      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-medium text-white">{plan.name}</p>
        {plan.badge ? (
          <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-medium text-black">
            {plan.badge}
          </span>
        ) : null}
      </div>

      <div ref={priceRef} className="mt-6 flex items-baseline gap-2">
        <span className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          {displayPrice}
        </span>
        {plan.monthlyPrice !== undefined ? (
          <span className="text-sm text-zinc-500">/month</span>
        ) : null}
      </div>
      {plan.monthlyPrice !== undefined && billing === "yearly" ? (
        <p className="mt-1 text-xs text-zinc-500">billed annually</p>
      ) : null}

      <p className="mt-4 text-sm text-zinc-400">{plan.description}</p>

      <div className="mt-8 border-t border-white/10 pt-8">
        <ul className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-flow-col sm:grid-rows-3">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
              <span className="text-sm text-zinc-300">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-10">
        <Button
          href={plan.ctaHref}
          variant={plan.highlighted ? "accent" : "secondary"}
        >
          {plan.ctaLabel}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

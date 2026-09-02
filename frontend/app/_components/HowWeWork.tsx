"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SectionBadge } from "./SectionBadge";
import { HowWeWorkOrb } from "./HowWeWorkOrb";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface Step {
  label: string;
  index: string;
  title: string;
  description: string;
}

/** PayPilot-specific copy — structure (label/index/title/description) is
 * what the nav + content panel depend on, so new steps slot in freely. */
const STEPS: Step[] = [
  {
    label: "Understand",
    index: "01",
    title: "It reads your catalog.",
    description:
      "Products, prices, stock, and relationships are exposed in structured, agent-readable form — so an AI can search and reason over them instead of scraping your storefront.",
  },
  {
    label: "Detect",
    index: "02",
    title: "It finds the revenue signal.",
    description:
      "Failed payments, abandoned checkouts, upsells, and cross-sells are surfaced as scored, evidence-backed opportunities — each one explaining what happened and why it matters.",
  },
  {
    label: "Check Policy",
    index: "03",
    title: "It checks if that's allowed.",
    description:
      "Before any recommendation touches money, a policy engine evaluates amount limits, permissions, status, and idempotency — returning an explainable ALLOWED or BLOCKED.",
  },
  {
    label: "Execute",
    index: "04",
    title: "It executes and records.",
    description:
      "Only permitted actions run, through Razorpay's test-mode payment infrastructure — and every recommendation, policy check, and outcome is written to the audit trail.",
  },
];

/**
 * "How we work" section — sits directly above Blogs on the home page.
 * Left: click-through step nav with a GSAP-animated sliding indicator.
 * Center: a real 3D centerpiece (react-three-fiber + drei), reacting subtly
 * to which step is active. Right: the active step's copy, crossfading in
 * via GSAP on change.
 */
export function HowWeWork() {
  const sectionRef = useRef<HTMLElement>(null);
  const navListRef = useRef<HTMLUListElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const navItemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);
  const isFirstIndicatorMove = useRef(true);
  const isFirstContentRender = useRef(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const active = STEPS[activeIndex];

  // Scroll-in entrance for the header + the three columns.
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from("[data-hww-reveal]", {
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

  // Sliding indicator bar tracks the active nav item.
  useEffect(() => {
    const activeEl = navItemRefs.current[activeIndex];
    const indicator = indicatorRef.current;
    if (!activeEl || !indicator) return;

    const target = { top: activeEl.offsetTop, height: activeEl.offsetHeight };

    if (isFirstIndicatorMove.current) {
      isFirstIndicatorMove.current = false;
      gsap.set(indicator, target);
      return;
    }

    gsap.to(indicator, { ...target, duration: 0.45, ease: "power3.out" });
  }, [activeIndex]);

  // Crossfade the copy panel in whenever the active step changes.
  useEffect(() => {
    if (!contentRef.current) return;

    if (isFirstContentRender.current) {
      isFirstContentRender.current = false;
      return;
    }

    gsap.fromTo(
      contentRef.current,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
    );
  }, [activeIndex]);

  return (
    <section
      ref={sectionRef}
      className="border-t border-white/5 bg-black px-6 py-24"
    >
      <div className="mx-auto max-w-6xl">
        <div data-hww-reveal className="flex justify-center">
          <SectionBadge label="How PayPilot AI Works" />
        </div>

        <h2
          data-hww-reveal
          className="mx-auto mt-4 max-w-lg text-center text-3xl font-semibold tracking-tight text-white sm:text-4xl"
        >
          AI proposes. Policy decides. Razorpay executes.
        </h2>

        <div className="mt-16 grid gap-12 lg:grid-cols-[200px_minmax(0,1fr)_320px] lg:items-center lg:gap-10">
          {/* Step nav */}
          <div data-hww-reveal className="relative order-1 pl-5">
            <div
              ref={indicatorRef}
              aria-hidden="true"
              className="absolute left-0 w-0.5 rounded-full bg-blue-400"
            />
            <ul ref={navListRef} className="flex flex-col">
              {STEPS.map((step, index) => (
                <li key={step.label} className="border-b border-white/10 last:border-b-0">
                  <button
                    type="button"
                    ref={(el) => {
                      navItemRefs.current[index] = el;
                    }}
                    onClick={() => setActiveIndex(index)}
                    aria-current={activeIndex === index}
                    className={`block w-full py-4 text-left text-sm font-medium transition-colors duration-300 sm:text-base ${
                      activeIndex === index
                        ? "text-white"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {step.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* 3D centerpiece */}
          <div
            data-hww-reveal
            className="relative order-3 mx-auto h-64 w-full max-w-sm sm:h-80 lg:order-2 lg:h-[360px] lg:max-w-none"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/25 blur-3xl"
            />
            <HowWeWorkOrb activeIndex={activeIndex} />
          </div>

          {/* Active step copy */}
          <div ref={contentRef} className="order-2 lg:order-3">
            <p
              data-hww-reveal
              className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500"
            >
              {active.index}
            </p>
            <h3
              data-hww-reveal
              className="mt-3 text-xl font-medium text-white sm:text-2xl"
            >
              {active.title}
            </h3>
            <p
              data-hww-reveal
              className="mt-4 text-sm text-zinc-400 sm:text-base"
            >
              {active.description}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

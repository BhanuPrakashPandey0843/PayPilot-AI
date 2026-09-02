"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Check,
  ChevronDown,
  MessagesSquare,
  LineChart,
  ShieldCheck,
  TrendingUp,
  Boxes,
  type LucideIcon,
} from "lucide-react";
import { SectionBadge } from "./SectionBadge";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface Solution {
  title: string;
  description: string;
  checklist: string[];
  icon: LucideIcon;
}

/**
 * "What we build for you" — service list. Shape (title/description/
 * checklist/icon) is what SolutionRow depends on, so new rows slot in
 * freely and every row renders identically when expanded.
 */
const SOLUTIONS: Solution[] = [
  {
    title: "Agent-Readable Catalog",
    description:
      "Your products, structured so an AI agent can understand them — not scrape them.",
    checklist: [
      "Structured name, price, stock & tags",
      "Search, filter, sort & pagination",
      "Organization-level tenant isolation",
    ],
    icon: Boxes,
  },
  {
    title: "Conversational Commerce",
    description:
      "Let customers describe what they want and get guided from discovery to checkout.",
    checklist: [
      "Product discovery & comparison",
      "Cart building inside the conversation",
      "Guided handoff to checkout",
    ],
    icon: MessagesSquare,
  },
  {
    title: "Upsell & Cross-Sell",
    description:
      "Deterministic, explainable recommendations based on real catalog relationships — not guesswork.",
    checklist: [
      "Higher-value upsells in-category",
      "Complementary cross-sells by shared tags",
      "Every suggestion traceable to a rule",
    ],
    icon: TrendingUp,
  },
  {
    title: "Revenue Intelligence",
    description:
      "Turn orders, failures, and abandoned checkouts into a ranked list of what to fix next.",
    checklist: [
      "Payment failure & abandonment detection",
      "Scored, evidence-backed opportunities",
      "Recommended next action per opportunity",
    ],
    icon: LineChart,
  },
  {
    title: "Policy-Controlled Execution",
    description:
      "AI recommends. A policy engine checks limits and permissions before anything touches money.",
    checklist: [
      "Amount limits & permission checks",
      "Idempotent, Razorpay-verified execution",
      "Every decision written to the audit trail",
    ],
    icon: ShieldCheck,
  },
];

/**
 * "What we build for you" section — sits directly above TechStack on the
 * home page. Accordion list of services; only one row is expanded at a
 * time, revealing an icon tile + description + checklist. All typography,
 * color, and spacing come from the same tokens/shared components every
 * other section uses (SectionBadge, globals.css keyframes, the zinc/blue
 * scale) so a change to any of those updates this section too.
 */
export function Solutions() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from("[data-sol-reveal]", {
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
        <div data-sol-reveal>
          <SectionBadge label="What PayPilot AI Does" />
        </div>

        <h2
          data-sol-reveal
          className="mt-4 max-w-lg text-3xl font-semibold tracking-tight text-white sm:text-4xl"
        >
          One commerce layer, five jobs
        </h2>

        <div data-sol-reveal className="mt-12 flex flex-col">
          {SOLUTIONS.map((solution, index) => (
            <SolutionRow
              key={solution.title}
              solution={solution}
              index={index}
              isOpen={activeIndex === index}
              onToggle={() =>
                setActiveIndex((current) => (current === index ? -1 : index))
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function SolutionRow({
  solution,
  index,
  isOpen,
  onToggle,
}: {
  solution: Solution;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const chevronRef = useRef<SVGSVGElement>(null);
  const isFirstRun = useRef(true);

  // Smooth height/opacity accordion — measures real content height so the
  // motion never snaps or clips, matching the crossfade feel used by
  // HowWeWork's step panel.
  useEffect(() => {
    const panel = panelRef.current;
    const chevron = chevronRef.current;
    if (!panel) return;

    if (isFirstRun.current) {
      isFirstRun.current = false;
      gsap.set(panel, isOpen ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 });
      if (chevron) gsap.set(chevron, { rotate: isOpen ? 180 : 0 });
      return;
    }

    if (isOpen) {
      const fullHeight = panel.scrollHeight;
      gsap.fromTo(
        panel,
        { height: 0, opacity: 0 },
        {
          height: fullHeight,
          opacity: 1,
          duration: 0.5,
          ease: "power3.out",
          onComplete: () => gsap.set(panel, { height: "auto" }),
        },
      );
    } else {
      gsap.to(panel, {
        height: 0,
        opacity: 0,
        duration: 0.4,
        ease: "power3.inOut",
      });
    }

    if (chevron) {
      gsap.to(chevron, {
        rotate: isOpen ? 180 : 0,
        duration: 0.4,
        ease: "power2.out",
      });
    }
  }, [isOpen]);

  const Icon = solution.icon;

  return (
    <div className="border-b border-white/10">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="group flex w-full items-center justify-between gap-4 py-6 text-left transition-colors duration-300"
      >
        <span className="flex items-center gap-4">
          <span
            className={`text-xs font-medium tracking-[0.15em] transition-colors duration-300 ${
              isOpen ? "text-blue-400" : "text-zinc-600"
            }`}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <span
            className={`text-base font-medium transition-colors duration-300 sm:text-lg ${
              isOpen ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"
            }`}
          >
            {solution.title}
          </span>
        </span>

        <ChevronDown
          ref={chevronRef}
          className={`h-4 w-4 shrink-0 transition-colors duration-300 ${
            isOpen ? "text-blue-400" : "text-zinc-600 group-hover:text-zinc-300"
          }`}
        />
      </button>

      <div
        ref={panelRef}
        className="overflow-hidden"
        style={{ height: 0, opacity: 0 }}
      >
        <div className="grid gap-8 pb-8 pl-0 sm:pl-11 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center lg:gap-12">
          <SolutionTile icon={Icon} />

          <div>
            <p className="text-sm text-zinc-400 sm:text-base">
              {solution.description}
            </p>

            <ul className="mt-6 space-y-3">
              {solution.checklist.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
                  <span className="text-sm text-zinc-300">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Icon tile reusing the same faceted-gem gradient/sheen language as
 * CaseStudies' CaseStudyGem — one idle-sway tween, shared sheen keyframe. */
function SolutionTile({ icon: Icon }: { icon: LucideIcon }) {
  const tileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tile = tileRef.current;
    if (!tile) return;

    const tween = gsap.fromTo(
      tile,
      { rotate: -4 },
      {
        rotate: 4,
        duration: 4,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      },
    );

    return () => {
      tween.kill();
    };
  }, []);

  return (
    <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-950 to-black sm:h-32 sm:w-32">
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/25 blur-2xl"
      />
      <div
        ref={tileRef}
        className="animate-float-slow absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl bg-gradient-to-br from-blue-300 via-blue-500 to-blue-800 shadow-[0_20px_40px_-12px_rgba(37,99,235,0.6)]"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.5) 0%, transparent 40%), linear-gradient(315deg, rgba(255,255,255,0.25) 0%, transparent 35%)",
          }}
        />
        <div
          aria-hidden="true"
          className="animate-sheen-sweep absolute inset-y-0 -left-1/2 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon
            className="h-7 w-7 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]"
            strokeWidth={1.75}
          />
        </div>
      </div>
    </div>
  );
}

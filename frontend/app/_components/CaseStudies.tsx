"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, Check, ShieldCheck, Lock, type LucideIcon } from "lucide-react";
import { Button } from "./Button";
import { SectionBadge } from "./SectionBadge";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface CaseStudy {
  title: string;
  results: string[];
  icon: LucideIcon;
  ctaHref: string;
}

/** Trust & safety pillars — AI never has unrestricted control over money.
 * New rows slot in freely — CaseStudyGem derives its look purely from the
 * `icon` prop. */
const CASE_STUDIES: CaseStudy[] = [
  {
    title: "AI recommends. Policy decides.",
    results: [
      "RBAC & organization-level tenant isolation",
      "Amount limits, status checks & expiration",
      "Explainable ALLOWED / BLOCKED on every action",
    ],
    icon: ShieldCheck,
    ctaHref: "/about",
  },
  {
    title: "Razorpay executes. Everything is logged.",
    results: [
      "Idempotent payment workflows — no double charges",
      "Signed webhook & payment verification",
      "Full audit trail: what, why, and when",
    ],
    icon: Lock,
    ctaHref: "/about",
  },
];

/**
 * Case studies — sits directly above Testimonials on the home page. Each
 * row is a wide dark panel: results checklist + CTA on the left, an
 * original faceted "gem" visual on the right (no stock photography — the
 * facets are CSS gradients/clip-paths, so nothing to license). Gems idle
 * with a slow sway + float and a periodic light sweep across the facets.
 */
export function CaseStudies() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from("[data-case-reveal]", {
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
        <div data-case-reveal>
          <SectionBadge label="Trust & Safety" />
        </div>
        <h2
          data-case-reveal
          className="mt-4 max-w-lg text-3xl font-semibold tracking-tight text-white sm:text-4xl"
        >
          AI does not have unrestricted control over money
        </h2>

        <div className="mt-12 flex flex-col gap-6">
          {CASE_STUDIES.map((study) => (
            <CaseStudyRow key={study.title} study={study} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CaseStudyRow({ study }: { study: CaseStudy }) {
  return (
    <div
      data-case-reveal
      className="grid gap-8 rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900/80 to-black p-8 transition-transform duration-300 hover:-translate-y-1 sm:p-10 lg:grid-cols-2 lg:items-center lg:gap-12"
    >
      <div className="flex flex-col">
        <h3 className="text-xl font-medium text-white sm:text-2xl">
          {study.title}
        </h3>

        <ul className="mt-8 space-y-3 lg:mt-auto">
          {study.results.map((result) => (
            <li key={result} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
              <span className="text-sm text-zinc-300">{result}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6">
          <Button href={study.ctaHref} variant="secondary" size="sm">
            See How It's Enforced
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="order-first lg:order-last">
        <CaseStudyGem icon={study.icon} />
      </div>
    </div>
  );
}

function CaseStudyGem({ icon: Icon }: { icon: LucideIcon }) {
  const gemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const gem = gemRef.current;
    if (!gem) return;

    const tween = gsap.fromTo(
      gem,
      { rotate: 41 },
      {
        rotate: 49,
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
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-950 to-black">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/25 blur-3xl"
      />

      <div
        ref={gemRef}
        className="animate-float-slow absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-300 via-blue-500 to-blue-800 shadow-[0_25px_50px_-15px_rgba(37,99,235,0.6)] sm:h-32 sm:w-32"
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
            className="h-9 w-9 -rotate-45 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]"
            strokeWidth={1.75}
          />
        </div>
      </div>
    </div>
  );
}

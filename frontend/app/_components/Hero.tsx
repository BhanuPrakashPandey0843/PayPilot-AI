"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Button } from "./Button";
import { SectionBadge } from "./SectionBadge";
import { HeroVisual } from "./HeroVisual";
import { HeroTicker } from "./HeroTicker";

/**
 * Homepage hero — fourth pass. Keeps everything the third pass got right
 * (full-bleed activity ticker, non-gradient body copy, the wireframe
 * data-mesh visual instead of a solid distorted blob) and adds the one
 * thing that was actually missing: ambient depth behind the content — a
 * faint structural grid plus a single soft glow anchored behind the
 * headline, using the shared .bg-grid / .glow-blob tokens from
 * globals.css so this reads as the same light source as the rest of the
 * site rather than a one-off hero treatment. Gradient text is used on
 * exactly one word ("revenue") — the brief's "AI words only" rule taken
 * literally rather than dressing up the whole headline.
 */
export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "power3.out", duration: 0.8 },
      });
      tl.from("[data-hero-reveal]", {
        opacity: 0,
        y: 24,
        stagger: 0.1,
      }).from(
        "[data-hero-visual]",
        { opacity: 0, scale: 0.9, duration: 1 },
        "-=0.6",
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-[var(--background)] px-6 py-28 sm:py-32 lg:py-36"
    >
      {/* Ambient depth layer — grid + single glow, shared tokens so this
          matches every other section that opts into the same system. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="bg-grid absolute inset-0" />
        <div
          className="glow-blob absolute left-1/2 top-0 h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-blue-600/25"
        />
        <div className="bg-noise absolute inset-0" />
      </div>

      <div className="relative mx-auto grid max-w-6xl gap-16 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center lg:gap-10">
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <div data-hero-reveal>
            <SectionBadge label="AI Growth & Agentic Commerce" />
          </div>

          <h1
            data-hero-reveal
            className="mt-6 max-w-xl text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl"
          >
            Your commerce data already knows where{" "}
            <span className="text-gradient-ai">revenue</span> is being lost.
          </h1>

          <p
            data-hero-reveal
            className="mt-6 max-w-xl text-base text-zinc-400 sm:text-lg"
          >
            PayPilot AI reads your catalog, understands your commerce
            signals, and turns them into explainable revenue actions —
            recovering failed payments, surfacing upsells, and helping AI
            agents discover and buy from your store — with every action
            policy-checked and audit-logged before it touches money.
          </p>

          <div
            data-hero-reveal
            className="mt-6 flex items-center gap-2 font-mono text-sm text-zinc-500"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75 motion-reduce:hidden" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            <span className="text-zinc-300">
              AI proposes. Policy decides. Razorpay executes.
            </span>
          </div>

          <div
            data-hero-reveal
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row lg:items-start"
          >
            <Button href="/demo" size="lg">
              See the Demo
            </Button>
            <Button href="/about" size="lg" variant="outline">
              How It Works
            </Button>
          </div>
        </div>

        <HeroVisual />
      </div>

      <HeroTicker />
    </section>
  );
}

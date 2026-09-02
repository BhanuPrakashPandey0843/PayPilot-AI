"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { BrandPanel } from "./BrandPanel";
import { SignupForm } from "./SignupForm";

/**
 * Top-level signup experience: ambient background (grid + glow, same
 * shared tokens Hero uses), the brand storytelling panel, and the
 * signup card. Entrance is a single staggered GSAP timeline over
 * [data-signup-reveal] (brand panel pieces) and [data-signup-card] (the
 * form card) — skipped entirely under prefers-reduced-motion, the same
 * guard Hero relies on via Tailwind's motion-reduce: variants, done here
 * in JS since GSAP doesn't read the media query itself.
 */
export function SignUpExperience() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out", duration: 0.7 } });
      tl.from("[data-signup-reveal]", { opacity: 0, y: 20, stagger: 0.08 }).from(
        "[data-signup-card]",
        { opacity: 0, y: 24, scale: 0.98, duration: 0.8 },
        "-=0.5"
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={sectionRef} className="relative w-full max-w-6xl overflow-hidden py-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="bg-grid absolute inset-0" />
        <div className="glow-blob absolute -top-20 right-0 h-[420px] w-[520px] rounded-full bg-blue-600/20" />
        <div className="glow-blob absolute bottom-0 left-0 h-[360px] w-[440px] rounded-full bg-emerald-500/10" />
        <div className="bg-noise absolute inset-0" />
      </div>

      <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-center lg:gap-16">
        <BrandPanel />

        <div
          data-signup-card
          className="glass-panel relative rounded-3xl p-6 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.8)] sm:p-8"
        >
          <div
            aria-hidden="true"
            className="glow-blob pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#e8c88a]/20"
          />

          <div className="relative">
            <h2 className="text-xl font-semibold text-white">Welcome to PayPilot AI</h2>
            <p className="mt-1 text-sm text-zinc-500">Create your merchant workspace.</p>

            <div className="mt-6">
              <SignupForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

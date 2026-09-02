"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { KeyRound } from "lucide-react";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { BrandLogo } from "../BrandLogo";

/**
 * Forgot-password experience: same ambient background system as
 * Login/Signup (grid + glow + noise), but a single centered card rather
 * than the split brand-panel layout — this is a focused, one-field
 * recovery step, not a storytelling moment, so the marketing panel is
 * deliberately left out here.
 */
export function ForgotPasswordExperience() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      gsap.from("[data-forgot-reveal]", {
        opacity: 0,
        y: 20,
        stagger: 0.08,
        duration: 0.7,
        ease: "power3.out",
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={sectionRef} className="relative w-full max-w-md overflow-hidden py-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="bg-grid absolute inset-0" />
        <div className="glow-blob absolute -top-24 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-blue-600/20" />
        <div className="bg-noise absolute inset-0" />
      </div>

      <div data-forgot-reveal className="mb-8 flex items-center justify-center gap-2.5">
        <BrandLogo className="h-9 w-[80px]" />
        <span className="text-lg font-semibold tracking-tight text-white">PayPilot AI</span>
      </div>

      <div
        data-forgot-reveal
        className="glass-panel relative rounded-3xl p-6 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.8)] sm:p-8"
      >
        <div
          aria-hidden="true"
          className="glow-blob pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#e8c88a]/20"
        />

        <div className="relative">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400 ring-1 ring-blue-400/20">
              <KeyRound className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <h2 className="text-xl font-semibold text-white">Forgot password?</h2>
              <p className="mt-0.5 text-sm text-zinc-500">
                Enter your business email and we&apos;ll send you a reset link.
              </p>
            </div>
          </div>

          <div className="mt-6">
            <ForgotPasswordForm />
          </div>
        </div>
      </div>
    </div>
  );
}

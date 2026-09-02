"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import { Loader2, ShieldCheck } from "lucide-react";
import { LoginBrandPanel } from "./LoginBrandPanel";
import { LoginForm } from "./LoginForm";
import { isAuthenticated } from "@/lib/auth/session";

/**
 * Top-level login experience: ambient background (grid + glow, same
 * shared tokens Hero/SignUpExperience use), the brand storytelling
 * panel, and the login card. Mirrors SignUpExperience's structure
 * exactly — same background layers, same GSAP stagger pattern — just
 * scoped to [data-login-reveal] / [data-login-card] instead of
 * [data-signup-*], and skipped under prefers-reduced-motion the same
 * way.
 *
 * Also owns the "already logged in" check: a visitor with a session
 * token already in storage never sees the login form at all — they're
 * redirected straight to /dashboard. That check is synchronous and
 * client-only (real verification always happens server-side via
 * app.authenticate), so it renders a brief neutral loading state rather
 * than flashing the form first.
 */
export function LoginExperience() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/dashboard");
      return;
    }
    setCheckingSession(false);
  }, [router]);

  useEffect(() => {
    if (checkingSession) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out", duration: 0.7 } });
      tl.from("[data-login-reveal]", { opacity: 0, y: 20, stagger: 0.08 }).from(
        "[data-login-card]",
        { opacity: 0, y: 24, scale: 0.98, duration: 0.8 },
        "-=0.5"
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [checkingSession]);

  if (checkingSession) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-600" aria-hidden="true" />
        <span className="sr-only">Checking your session…</span>
      </div>
    );
  }

  return (
    <div ref={sectionRef} className="relative w-full max-w-6xl overflow-hidden py-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="bg-grid absolute inset-0" />
        <div className="glow-blob absolute -top-20 left-0 h-[420px] w-[520px] rounded-full bg-blue-600/20" />
        <div className="glow-blob absolute bottom-0 right-0 h-[360px] w-[440px] rounded-full bg-emerald-500/10" />
        <div className="bg-noise absolute inset-0" />
      </div>

      <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-center lg:gap-16">
        <LoginBrandPanel />

        <div
          data-login-card
          className="glass-panel relative rounded-3xl p-6 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.8)] sm:p-8"
        >
          <div
            aria-hidden="true"
            className="glow-blob pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-[#e8c88a]/20"
          />

          <div className="relative">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Welcome Back</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Sign in to continue to your PayPilot workspace.
                </p>
              </div>
              <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-medium text-emerald-300">
                <ShieldCheck className="h-3 w-3" />
                Secure Merchant Login
              </span>
            </div>

            <Suspense fallback={null}>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

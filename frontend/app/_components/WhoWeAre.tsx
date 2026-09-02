"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "./Button";
import { SectionBadge } from "./SectionBadge";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface Stat {
  value: number;
  suffix: string;
  label: string;
}

/** Stat cards — value/suffix/label is what StatCard's counter depends on,
 * so new stats slot in freely. */
const STATS: Stat[] = [
  { value: 5, suffix: "", label: "Revenue opportunity types tracked" },
  { value: 2, suffix: "", label: "Policy outcomes: allowed or blocked" },
  { value: 100, suffix: "%", label: "Money actions logged to the audit trail" },
];

/**
 * "Who we are?" — sits directly above Solutions on the home page. Left:
 * an original abstract portrait tile (no stock/AI photography reused, to
 * keep the project license-clean, matching CaseStudies' "nothing to
 * license" approach) plus the primary CTA. Right: the agency statement and
 * a row of stat cards that count up once scrolled into view. Typography,
 * color, and the reveal pattern all reuse the same tokens/shared
 * components as every other section (SectionBadge, Button, the zinc/blue
 * scale, the GSAP data-reveal convention).
 */
export function WhoWeAre() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from("[data-wwa-reveal]", {
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
        <div className="grid gap-12 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start lg:gap-16">
          {/* Left: badge + portrait tile + CTA */}
          <div className="flex flex-col">
            <div data-wwa-reveal>
              <SectionBadge label="What PayPilot AI is" />
            </div>

            <div data-wwa-reveal className="mt-6">
              <PortraitTile />
            </div>

            <div data-wwa-reveal className="mt-6">
              <Button href="/demo" variant="secondary" size="sm">
                See It Work
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Right: statement + stats */}
          <div>
            <p
              data-wwa-reveal
              className="max-w-2xl text-2xl font-medium leading-snug tracking-tight text-white sm:text-3xl"
            >
              PayPilot AI is a controlled AI commerce layer for merchants
              already running on Razorpay.{" "}
              <span className="text-zinc-400">
                It reads your catalog and commerce signals, detects revenue
                opportunities like failed payments and abandoned checkouts,
                and recommends the next best action — but AI never touches
                money directly. A policy engine checks every action first,
                and Razorpay executes only what&apos;s permitted.
              </span>
            </p>

            <div
              data-wwa-reveal
              className="mt-10 grid gap-4 border-t border-white/10 pt-10 sm:grid-cols-3"
            >
              {STATS.map((stat) => (
                <StatCard key={stat.label} stat={stat} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({ stat }: { stat: Stat }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const numberRef = useRef<HTMLParagraphElement>(null);

  // Counts up from 0 to the stat's value once the card enters the
  // viewport — a single tween per card, driven off its own ScrollTrigger
  // so cards animate independently as they arrive on screen.
  useEffect(() => {
    const card = cardRef.current;
    const numberEl = numberRef.current;
    if (!card || !numberEl) return;

    const counter = { value: 0 };
    const tween = gsap.to(counter, {
      value: stat.value,
      duration: 1.6,
      ease: "power2.out",
      scrollTrigger: {
        trigger: card,
        start: "top 85%",
        once: true,
      },
      onUpdate: () => {
        numberEl.textContent = `${Math.round(counter.value).toLocaleString()}${stat.suffix}`;
      },
    });

    return () => {
      tween.kill();
    };
  }, [stat.value, stat.suffix]);

  return (
    <div
      ref={cardRef}
      className="rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900/80 to-black p-6 transition-colors duration-300 hover:border-white/20"
    >
      <p
        ref={numberRef}
        className="text-3xl font-semibold tracking-tight text-white sm:text-4xl"
      >
        0{stat.suffix}
      </p>
      <p className="mt-2 text-sm text-zinc-500">{stat.label}</p>
    </div>
  );
}

/** Original abstract portrait — soft gradient field, grain-style dot
 * texture, and a glowing figure silhouette built from CSS shapes only.
 * Deliberately not a reproduction of any photograph, so nothing here needs
 * licensing; swap in a real headshot later by replacing this component's
 * body with an <Image> if the agency wants an actual portrait. */
function PortraitTile() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const glow = glowRef.current;
    if (!glow) return;

    const tween = gsap.fromTo(
      glow,
      { opacity: 0.5 },
      {
        opacity: 0.9,
        duration: 3,
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
    <div className="relative aspect-[4/5] w-full max-w-[220px] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-800 to-black">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      />

      <div
        ref={glowRef}
        aria-hidden="true"
        className="absolute left-1/2 top-[38%] h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/40 blur-2xl"
      />

      {/* Abstract hooded-figure silhouette, built entirely from shapes */}
      <svg
        viewBox="0 0 220 275"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
      >
        <ellipse cx="110" cy="230" rx="90" ry="70" fill="#000" opacity="0.7" />
        <ellipse cx="110" cy="110" rx="56" ry="62" fill="url(#hoodGradient)" />
        <ellipse cx="112" cy="112" rx="34" ry="40" fill="#0a0a0a" opacity="0.85" />
        <defs>
          <linearGradient id="hoodGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3f3f46" />
            <stop offset="100%" stopColor="#09090b" />
          </linearGradient>
        </defs>
      </svg>

      <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
        <Sparkles className="h-3.5 w-3.5 text-blue-300" strokeWidth={1.75} />
      </div>
    </div>
  );
}

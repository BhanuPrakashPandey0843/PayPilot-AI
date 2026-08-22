"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { Calculator, Mic, ShieldCheck, Square } from "lucide-react";

import navLogo from "@/assets/Navlogo.png";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/lib/useReducedMotion";

const PROMPTS = [
  "Ask me anything about this transaction…",
  "Why was this payment flagged for review?",
  "Show this merchant's compliance status.",
  "Explain this chargeback in plain English.",
];

/**
 * The PayPilot wordmark, recolored for use on dark chips. Sized relative to the
 * surrounding text via `em` so it scales correctly whether it sits in a small
 * paragraph or a large heading. Rendered from a higher intrinsic resolution than
 * its display size so it stays crisp even when scaled up inside a large heading.
 */
function BrandMark({ className }: { className?: string }) {
  return (
    <Image
      src={navLogo}
      alt=""
      width={96}
      height={96}
      quality={100}
      className={cn("h-[0.8em] w-[0.8em] shrink-0 object-contain invert", className)}
    />
  );
}

/**
 * Black pill bearing the PayPilot mark — used as an inline accent.
 * `tone="circle"` (default) suits small inline paragraph use; `tone="square"`
 * gives a compact rounded-square badge sized to sit cleanly inside a large heading.
 */
function LogoBadge({
  className,
  tone = "circle",
}: {
  className?: string;
  tone?: "circle" | "square";
}) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center bg-[#111217] align-[-0.16em] shadow-[0_4px_12px_rgba(17,18,23,0.32)] ring-1 ring-white/10",
        tone === "square"
          ? "h-[0.92em] w-[0.92em] rounded-[0.26em]"
          : "h-[1.55em] translate-y-[0.14em] rounded-full px-[0.5em] align-middle",
        className
      )}
    >
      <BrandMark className={tone === "square" ? "h-[0.56em] w-[0.56em]" : undefined} />
    </span>
  );
}

/** Three overlapping status dots (green / amber / red). */
function StatusDots() {
  return (
    <span className="relative inline-flex h-[1.1em] w-[2.3em] shrink-0 translate-y-[0.2em] align-middle">
      <span className="absolute left-0 h-[1.1em] w-[1.1em] rounded-full bg-[#2BC48A] ring-2 ring-[#FAFAF8]" />
      <span className="absolute left-[0.65em] h-[1.1em] w-[1.1em] rounded-full bg-[#FFB020] ring-2 ring-[#FAFAF8]" />
      <span className="absolute left-[1.3em] h-[1.1em] w-[1.1em] rounded-full bg-[#FF5A5F] ring-2 ring-[#FAFAF8]" />
    </span>
  );
}

/** Purple "core" chip representing the AI engine. */
function CoreBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex h-[1.5em] w-[1.5em] shrink-0 translate-y-[0.18em] items-center justify-center rounded-full bg-[#8C7BE0] align-middle shadow-[0_4px_10px_rgba(140,123,224,0.45)]",
        className
      )}
    >
      <span className="h-[0.42em] w-[0.42em] rounded-full bg-white" />
    </span>
  );
}

/** Minimal outlined capsule mark. */
function CapsuleMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 30 16"
      className={cn(
        "inline-block h-[0.72em] w-[1.35em] shrink-0 translate-y-[0.06em] align-middle",
        className
      )}
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="1.25"
        y="1.25"
        width="27.5"
        height="13.5"
        rx="6.75"
        stroke="#111217"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function SecurityCompliance() {
  const reducedMotion = useReducedMotion();
  const [promptIndex, setPromptIndex] = useState(0);

  useEffect(() => {
    if (reducedMotion) return;
    const id = setInterval(() => {
      setPromptIndex((current) => (current + 1) % PROMPTS.length);
    }, 2800);
    return () => clearInterval(id);
  }, [reducedMotion]);

  return (
    <section id="security" className="relative overflow-hidden bg-[#FAFAF8] px-5 py-20 scroll-mt-24 sm:py-24">
      {/* Soft pastel glows matching the hero palette */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(38% 42% at 6% 12%, rgba(140,123,224,0.16) 0%, rgba(140,123,224,0) 70%), " +
              "radial-gradient(42% 46% at 96% 28%, rgba(255,214,110,0.20) 0%, rgba(255,214,110,0) 70%), " +
              "radial-gradient(34% 38% at 50% 100%, rgba(140,123,224,0.10) 0%, rgba(140,123,224,0) 70%)",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-3xl">
        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center text-[28px] font-extrabold leading-[1.22] tracking-[-0.03em] text-[#111217] sm:text-[34px] sm:leading-[1.2] lg:text-[40px] lg:leading-[1.18]"
        >
          Security And{" "}
          <LogoBadge tone="square" className="mx-0.5 translate-y-[0.06em]" />
          <br />
          Compliance, <span className="font-serif italic">Built In</span>
        </motion.h2>

        {/* Card mockup */}
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="relative mx-auto mt-12 max-w-[520px] sm:mt-14"
        >
          {/* Ambient glow behind the card */}
          <div
            aria-hidden="true"
            className="absolute -inset-8 -z-10 rounded-[36px] bg-gradient-to-br from-[#DDD3FF]/50 via-transparent to-[#FFDE8A]/40 blur-[42px]"
          />

          <motion.div
            animate={reducedMotion ? undefined : { y: [0, -6, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="overflow-hidden rounded-[26px] border border-black/[0.06] bg-white shadow-[0_28px_70px_-24px_rgba(20,20,30,0.16)] ring-1 ring-black/[0.03]"
          >
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/[0.06] bg-gradient-to-r from-[#F1EDFF] to-[#FFF6DC] px-3 py-3 sm:px-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/70 py-1.5 pl-1.5 pr-3 shadow-[0_1px_2px_rgba(17,18,23,0.05)] backdrop-blur-sm">
                <LogoBadge className="h-6 translate-y-0 px-1.5" />
                <span className="text-[11px] font-medium text-[#4B4C53] sm:text-[12px]">
                  SOC 2 Type II
                  <span className="mx-1.5 text-black/20">·</span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="relative flex h-[6px] w-[6px]">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2BC48A] opacity-60" />
                      <span className="relative inline-flex h-[6px] w-[6px] rounded-full bg-[#2BC48A]" />
                    </span>
                    In progress
                  </span>
                </span>
              </div>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[11px] text-[#82838A] shadow-[0_1px_2px_rgba(17,18,23,0.05)] backdrop-blur-sm">
                <ShieldCheck size={12} strokeWidth={2} className="text-[#8C7BE0]" />
                Powered by <span className="font-semibold text-[#111217]">PayPilot AI</span>
              </span>
            </div>

            {/* Body */}
            <div className="relative flex min-h-[104px] items-start px-4 py-4 sm:min-h-[118px] sm:px-5 sm:py-5">
              <span className="caret-blink mr-[3px] inline-block h-[15px] w-[1.5px] shrink-0 translate-y-[2px] bg-[#B9BAC1] sm:h-[16px]" />
              <AnimatePresence mode="wait">
                <motion.span
                  key={promptIndex}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="text-[13px] leading-[1.5] text-[#9C9DA4] sm:text-[14px]"
                >
                  {PROMPTS[promptIndex]}
                </motion.span>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-2 border-t border-black/[0.06] px-4 py-3 sm:px-5">
              <motion.button
                type="button"
                whileHover={{ scale: 1.04, backgroundColor: "#ECECEF" }}
                whileTap={{ scale: 0.96 }}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#F4F4F6] px-3 py-[7px] text-[11px] font-medium text-[#4B4C53] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#111217]/30 sm:text-[12px]"
              >
                <Calculator size={13} strokeWidth={2} />
                Calculate
              </motion.button>

              <div className="flex items-center gap-2">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.04, backgroundColor: "#ECECEF" }}
                  whileTap={{ scale: 0.96 }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#F4F4F6] px-3 py-[7px] text-[11px] font-medium text-[#4B4C53] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#111217]/30 sm:text-[12px]"
                >
                  <Mic size={13} strokeWidth={2} />
                  Talk
                </motion.button>

                <motion.button
                  type="button"
                  aria-label="Stop recording"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.94 }}
                  className="record-pulse relative flex h-8 w-8 items-center justify-center rounded-full bg-[#111217] text-white outline-none focus-visible:ring-2 focus-visible:ring-[#111217]/40 focus-visible:ring-offset-2"
                >
                  <Square size={10} strokeWidth={0} fill="currentColor" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Highlighted paragraph */}
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
          className="mx-auto mt-12 max-w-[600px] text-center text-[14px] leading-[1.75] text-[#111217] sm:mt-14 sm:text-[15px] lg:text-[16px]"
        >
          <span className="font-semibold">PayPilot</span> <StatusDots />{" "}
          <span className="font-semibold">is engineered</span>{" "}
          <span className="text-[#B7B8BF]">specifically for regulated</span>{" "}
          <span className="text-[#B7B8BF]">financial</span>{" "}
          <span className="font-semibold">sectors.</span> <LogoBadge />{" "}
          <span className="font-serif">Security and compliance aren&rsquo;t</span>{" "}
          <span className="font-semibold">optional</span>{" "}
          <span className="text-[#B7B8BF]">features — they form the</span>{" "}
          <span className="font-semibold">core on</span> <CoreBadge />{" "}
          <span className="font-semibold">which all other capabilities</span>{" "}
          <CapsuleMark /> <span className="text-[#B7B8BF]">rely.</span>
        </motion.p>
      </div>
    </section>
  );
}

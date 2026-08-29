"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import {
  Calculator,
  Eye,
  GitBranch,
  Loader2,
  Lock,
  Mic,
  RotateCcw,
  ShieldCheck,
  Square,
} from "lucide-react";

import navLogo from "@/assets/Navlogo.png";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/lib/useReducedMotion";

/* ------------------------------------------------------------------ */
/*  Demo data                                                          */
/* ------------------------------------------------------------------ */

/** Sample Q&A pairs the mock assistant "answers" when Talk is pressed. */
const CONVERSATIONS = [
  {
    question: "Why was this payment flagged for review?",
    answer:
      "This \u20b948,200 transfer came from a device with no prior history on this account. Policy requires manual sign-off on new devices above \u20b940,000.",
  },
  {
    question: "Show this merchant's compliance status.",
    answer:
      "KYC is fully verified, SOC 2 controls are active, and the last audit passed 12 days ago. No open compliance flags on this account.",
  },
  {
    question: "Explain this chargeback in plain English.",
    answer:
      "The customer's bank reversed the charge, citing \u201cgoods not received.\u201d You have 7 days left to submit delivery proof before it's finalized.",
  },
] as const;

const GREETING = "Ask me anything about this transaction\u2026";
const IDLE_PROMPTS = [GREETING, ...CONVERSATIONS.map((c) => c.question)];

/** What Calculate reveals \u2014 a fully itemized settlement breakdown. */
const CALC_ROWS: { label: string; value: string; strong?: boolean }[] = [
  { label: "Transaction amount", value: "\u20b948,200.00" },
  { label: "Razorpay fee (2%)", value: "\u2212 \u20b9964.00" },
  { label: "GST on fee (18%)", value: "\u2212 \u20b9173.52" },
  { label: "Net settlement", value: "\u20b947,062.48", strong: true },
  { label: "Expected payout", value: "T+2 business days" },
];

/** Mirrors the "Explainable / Bounded / Gated" bar used elsewhere on the page. */
const TRUST_TAGS = [
  { icon: Eye, label: "Explainable" },
  { icon: GitBranch, label: "Bounded" },
  { icon: Lock, label: "Gated" },
];

type Mode = "idle" | "listening" | "thinking" | "answered" | "calculating";

/* ------------------------------------------------------------------ */
/*  Small decorative primitives                                        */
/* ------------------------------------------------------------------ */

/**
 * The PayPilot wordmark, recolored for use on dark chips.
 * Sized relative to the surrounding text via `em` so it scales correctly
 * whether it sits in a small paragraph or a large heading.
 */
function BrandMark({ className }: { className?: string }) {
  return (
    <Image
      src={navLogo}
      alt=""
      width={96}
      height={96}
      quality={100}
      className={cn(
        "h-[0.8em] w-[0.8em] shrink-0 object-contain invert",
        className
      )}
    />
  );
}

/**
 * Black pill bearing the PayPilot mark \u2014 used as an inline accent.
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
      <BrandMark
        className={
          tone === "square"
            ? "h-[0.56em] w-[0.56em]"
            : undefined
        }
      />
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

/** Tiny "explainable / bounded / gated" trust row shown under an answer. */
function TrustRow() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-1">
      {TRUST_TAGS.map(({ icon: Icon, label }) => (
        <span
          key={label}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-[#9A9BA2] sm:text-[11.5px]"
        >
          <Icon size={11} strokeWidth={2.2} className="text-[#8C7BE0]" />
          {label}
        </span>
      ))}
    </div>
  );
}

/** Three animated bars standing in for a live mic waveform. */
function ListeningWaveform({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <span className="inline-flex h-4 items-center gap-[3px]" aria-hidden="true">
      {[6, 14, 9, 16, 7].map((height, i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full bg-[#8C7BE0]"
          style={{ height }}
          animate={
            reducedMotion
              ? undefined
              : { scaleY: [0.4, 1, 0.4] }
          }
          transition={{
            duration: 0.9,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.1,
          }}
        />
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Section                                                             */
/* ------------------------------------------------------------------ */

export function SecurityCompliance() {
  const reducedMotion = useReducedMotion();

  const [idlePromptIndex, setIdlePromptIndex] = useState(0);
  const [mode, setMode] = useState<Mode>("idle");
  const [activeConversation, setActiveConversation] = useState<
    (typeof CONVERSATIONS)[number] | null
  >(null);

  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearPendingTimers = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  // Clear any in-flight "listening \u2192 thinking \u2192 answered" timers on unmount.
  useEffect(() => clearPendingTimers, []);

  // Cycle the idle placeholder text \u2014 only while nothing else is happening.
  useEffect(() => {
    if (reducedMotion || mode !== "idle") return;

    const id = setInterval(() => {
      setIdlePromptIndex((current) => (current + 1) % IDLE_PROMPTS.length);
    }, 2800);

    return () => clearInterval(id);
  }, [reducedMotion, mode]);

  /** Starts (or restarts) the mock "ask the assistant" flow. */
  const startListening = () => {
    clearPendingTimers();

    const nextConversation =
      mode === "answered" && activeConversation
        ? CONVERSATIONS[
            (CONVERSATIONS.indexOf(activeConversation) + 1) %
              CONVERSATIONS.length
          ]
        : CONVERSATIONS[
            idlePromptIndex === 0 ? 0 : idlePromptIndex - 1
          ];

    setActiveConversation(nextConversation);
    setMode("listening");

    const listenTimer = setTimeout(() => setMode("thinking"), 1100);
    const answerTimer = setTimeout(() => setMode("answered"), 2000);
    timeoutsRef.current.push(listenTimer, answerTimer);
  };

  const resetToIdle = () => {
    clearPendingTimers();
    setActiveConversation(null);
    setMode("idle");
  };

  const handleMicPress = () => {
    if (mode === "listening" || mode === "thinking") {
      resetToIdle();
    } else {
      startListening();
    }
  };

  const toggleCalculate = () => {
    clearPendingTimers();
    setActiveConversation(null);
    setMode((current) => (current === "calculating" ? "idle" : "calculating"));
  };

  const isVoiceActive = mode === "listening" || mode === "thinking";

  const talkLabel = isVoiceActive
    ? "Stop"
    : mode === "answered"
      ? "Ask again"
      : "Talk";
  const TalkIcon = isVoiceActive ? Square : mode === "answered" ? RotateCcw : Mic;

  return (
    <section
      id="security"
      className="relative isolate min-h-[680px] w-full overflow-hidden bg-[#FAFAF8] px-5 py-20 scroll-mt-24 sm:min-h-[720px] sm:py-24 lg:min-h-[760px] lg:py-28"
    >
      {/* Soft pastel glows matching the hero palette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
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

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center px-0">
        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{
            once: true,
            amount: 0.6,
          }}
          transition={{
            duration: 0.6,
            ease: "easeOut",
          }}
          className="max-w-[750px] text-center text-[42px] font-extrabold leading-[0.95] tracking-[-0.04em] text-[#111217] sm:text-[56px] sm:leading-[0.94] lg:text-[64px] lg:leading-[0.92] lg:tracking-[-0.045em]"
        >
          Security And{" "}
          <LogoBadge
            tone="square"
            className="mx-0.5 -translate-y-[0.05em]"
          />
          <br />
          Compliance,{" "}
          <span className="font-serif italic">
            Built In
          </span>
        </motion.h2>

        {/* Larger card mockup */}
        <motion.div
          initial={{
            opacity: 0,
            y: 28,
            scale: 0.97,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          viewport={{
            once: true,
            amount: 0.3,
          }}
          transition={{
            duration: 0.7,
            ease: [0.16, 1, 0.3, 1],
            delay: 0.1,
          }}
          className="relative mx-auto mt-12 w-full max-w-[600px] sm:mt-14 lg:max-w-[620px]"
        >
          {/* Ambient glow behind the card */}
          <div
            aria-hidden="true"
            className="absolute -inset-10 -z-10 rounded-[40px] bg-gradient-to-br from-[#DDD3FF]/50 via-transparent to-[#FFDE8A]/40 blur-[48px]"
          />

          <motion.div
            whileHover={
              reducedMotion
                ? undefined
                : { y: -3 }
            }
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-[28px] bg-gradient-to-b from-black/[0.09] via-black/[0.04] to-black/[0.09] p-px shadow-[0_2px_8px_-3px_rgba(20,20,30,0.10),0_44px_100px_-30px_rgba(20,20,30,0.24)]"
          >
            <div className="relative overflow-hidden rounded-[27px] bg-white">
              {/* Glass-style top highlight */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent"
              />

              {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/[0.06] bg-gradient-to-r from-[#F1EDFF] to-[#FFF6DC] px-4 py-3.5 sm:px-5 sm:py-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/70 py-1.5 pl-1.5 pr-3 shadow-[0_1px_2px_rgba(17,18,23,0.05)] backdrop-blur-sm">
                <LogoBadge className="h-7 translate-y-0 px-1.5" />

                <span className="text-[12px] font-medium text-[#4B4C53] sm:text-[13px]">
                  SOC 2 Type II
                  <span className="mx-1.5 text-black/20">
                    ·
                  </span>

                  <span className="inline-flex items-center gap-1.5">
                    <span className="relative flex h-[6px] w-[6px]">
                      <span
                        className={cn(
                          "absolute inline-flex h-full w-full rounded-full bg-[#2BC48A] opacity-60",
                          !reducedMotion && "animate-ping"
                        )}
                      />
                      <span className="relative inline-flex h-[6px] w-[6px] rounded-full bg-[#2BC48A]" />
                    </span>

                    In progress
                  </span>
                </span>
              </div>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3.5 py-1.5 text-[12px] text-[#82838A] shadow-[0_1px_2px_rgba(17,18,23,0.05)] backdrop-blur-sm sm:text-[13px]">
                <ShieldCheck
                  size={13}
                  strokeWidth={2}
                  className="text-[#8C7BE0]"
                />
                Powered by{" "}
                <span className="font-semibold text-[#111217]">
                  PayPilot AI
                </span>
              </span>
            </div>

            {/* Message / AI response area \u2014 reflects live interaction state */}
            <div
              className="relative flex min-h-[150px] items-center px-5 py-5 sm:min-h-[168px] sm:px-6 sm:py-6 lg:min-h-[176px]"
              aria-live="polite"
            >
              <AnimatePresence mode="wait">
                {mode === "idle" && (
                  <motion.div
                    key={`idle-${idlePromptIndex}`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="flex items-start"
                  >
                    <span className="caret-blink mr-[5px] inline-block h-[18px] w-[1.5px] shrink-0 translate-y-[3px] bg-[#B9BAC1] sm:h-[20px]" />
                    <span className="max-w-[500px] text-[15px] leading-[1.55] text-[#8F9098] sm:text-[16px] lg:text-[17px]">
                      {IDLE_PROMPTS[idlePromptIndex]}
                    </span>
                  </motion.div>
                )}

                {mode === "listening" && (
                  <motion.div
                    key="listening"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="flex items-center gap-2.5"
                  >
                    <ListeningWaveform reducedMotion={reducedMotion} />
                    <span className="text-[15px] leading-[1.55] text-[#4B4C53] sm:text-[16px]">
                      Listening&hellip;
                    </span>
                  </motion.div>
                )}

                {mode === "thinking" && (
                  <motion.div
                    key="thinking"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="flex items-center gap-2"
                  >
                    <Loader2
                      size={15}
                      strokeWidth={2}
                      className={cn("text-[#8C7BE0]", !reducedMotion && "animate-spin")}
                    />
                    <span className="text-[15px] leading-[1.55] text-[#4B4C53] sm:text-[16px]">
                      Checking policy and transaction history&hellip;
                    </span>
                  </motion.div>
                )}

                {mode === "answered" && activeConversation && (
                  <motion.div
                    key={`answer-${activeConversation.question}`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="flex w-full flex-col gap-2"
                  >
                    <p className="text-[12px] font-medium text-[#B7B8BF] sm:text-[12.5px]">
                      &ldquo;{activeConversation.question}&rdquo;
                    </p>
                    <p className="max-w-[520px] text-[15px] leading-[1.55] text-[#111217] sm:text-[16px] lg:text-[17px]">
                      {activeConversation.answer}
                    </p>
                    <TrustRow />
                  </motion.div>
                )}

                {mode === "calculating" && (
                  <motion.div
                    key="calculating"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="flex w-full flex-col gap-1.5"
                  >
                    <p className="mb-1 text-[12px] font-medium text-[#B7B8BF] sm:text-[12.5px]">
                      Settlement breakdown for this transaction
                    </p>
                    {CALC_ROWS.map((row) => (
                      <div
                        key={row.label}
                        className={cn(
                          "flex items-center justify-between gap-4 text-[13.5px] sm:text-[14.5px]",
                          row.strong
                            ? "border-t border-black/[0.06] pt-1.5 font-semibold text-[#111217]"
                            : "text-[#4B4C53]"
                        )}
                      >
                        <span>{row.label}</span>
                        <span
                          className={cn(
                            "font-mono tabular-nums",
                            row.strong ? "text-[#111217]" : "text-[#111217]/80"
                          )}
                        >
                          {row.value}
                        </span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 border-t border-black/[0.06] px-5 py-3.5 sm:px-6 sm:py-4">
              <motion.button
                type="button"
                onClick={toggleCalculate}
                aria-pressed={mode === "calculating"}
                whileHover={{
                  scale: 1.04,
                  backgroundColor: mode === "calculating" ? undefined : "#ECECEF",
                }}
                whileTap={{
                  scale: 0.96,
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[12px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#111217]/30 sm:text-[13px]",
                  mode === "calculating"
                    ? "border-[#111217] bg-[#111217] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                    : "border-black/[0.05] bg-[#F4F4F6] text-[#4B4C53] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"
                )}
              >
                <Calculator
                  size={14}
                  strokeWidth={2}
                />
                {mode === "calculating" ? "Hide breakdown" : "Calculate"}
              </motion.button>

              <div className="flex items-center gap-2">
                <motion.button
                  type="button"
                  onClick={handleMicPress}
                  whileHover={{
                    scale: 1.04,
                    backgroundColor: "#ECECEF",
                  }}
                  whileTap={{
                    scale: 0.96,
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.05] bg-[#F4F4F6] px-3.5 py-2 text-[12px] font-medium text-[#4B4C53] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#111217]/30 sm:text-[13px]"
                >
                  <TalkIcon
                    size={14}
                    strokeWidth={TalkIcon === Square ? 0 : 2}
                    fill={TalkIcon === Square ? "currentColor" : "none"}
                  />
                  {talkLabel}
                </motion.button>

                <motion.button
                  type="button"
                  onClick={handleMicPress}
                  aria-label={isVoiceActive ? "Stop listening" : "Ask a question by voice"}
                  aria-pressed={isVoiceActive}
                  whileHover={{
                    scale: 1.08,
                  }}
                  whileTap={{
                    scale: 0.94,
                  }}
                  className={cn(
                    "relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-b from-[#26272F] to-[#0B0C10] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_6px_16px_-6px_rgba(17,18,23,0.5)] outline-none focus-visible:ring-2 focus-visible:ring-[#111217]/40 focus-visible:ring-offset-2",
                    isVoiceActive && "record-pulse"
                  )}
                >
                  {isVoiceActive ? (
                    <Square
                      size={10}
                      strokeWidth={0}
                      fill="currentColor"
                    />
                  ) : (
                    <Mic size={14} strokeWidth={2} />
                  )}
                </motion.button>
              </div>
            </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Larger highlighted paragraph */}
        <motion.p
          initial={{
            opacity: 0,
            y: 18,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
            amount: 0.5,
          }}
          transition={{
            duration: 0.6,
            ease: "easeOut",
            delay: 0.15,
          }}
          className="mx-auto mt-14 max-w-[780px] text-center text-[20px] leading-[1.8] text-[#111217] sm:mt-16 sm:text-[16px] lg:mt-[72px] lg:text-[18px]"
        >
          <span className="font-semibold">
            PayPilot
          </span>{" "}
          <StatusDots />{" "}
          <span className="font-semibold">
            is engineered
          </span>{" "}
          <span className="text-[#B7B8BF]">
            specifically for regulated
          </span>{" "}
          <span className="text-[#B7B8BF]">
            financial
          </span>{" "}
          <span className="font-semibold">
            sectors.
          </span>{" "}
          <LogoBadge />{" "}
          <span className="font-serif">
            Security and compliance aren&rsquo;t
          </span>{" "}
          <span className="font-semibold">
            optional
          </span>{" "}
          <span className="text-[#B7B8BF]">
            features — they form the
          </span>{" "}
          <span className="font-semibold">
            core on
          </span>{" "}
          <CoreBadge />{" "}
          <span className="font-semibold">
            which all other capabilities
          </span>{" "}
          <CapsuleMark />{" "}
          <span className="text-[#B7B8BF]">
            rely.
          </span>
        </motion.p>
      </div>
    </section>
  );
}

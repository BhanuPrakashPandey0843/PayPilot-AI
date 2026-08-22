"use client";

import { motion } from "motion/react";
import {
  ArrowUpRight,
  Bot,
  Check,
  CircleDollarSign,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HeroFloatingCardProps {
  eyebrow: string;
  line1: string;
  line2: string;
  rotate: number;
  className?: string;
  floatClassName?: string;
  delay?: number;
}

export function HeroFloatingCard({
  eyebrow,
  line1,
  line2,
  rotate,
  className,
  floatClassName = "hero-float-slow",
  delay = 0,
}: HeroFloatingCardProps) {
  const isGrowth = eyebrow.toLowerCase().includes("growth");

  return (
    <motion.div
      data-hero-card
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay }}
      whileHover={{
        y: -7,
        rotate: 0,
        scale: 1.025,
        transition: {
          duration: 0.3,
          ease: "easeOut",
        },
      }}
      className={cn(
        "pointer-events-none absolute hidden lg:block",
        className
      )}
      style={{ rotate }}
    >
      {/* Soft glow behind card */}
      <div
        aria-hidden="true"
        className={cn(
          "absolute -inset-5 rounded-[28px] blur-2xl",
          isGrowth ? "bg-[#FFF0A8]/35" : "bg-[#DCD2FF]/35"
        )}
      />

      {/* Offset glass layer */}
      <div
        aria-hidden="true"
        className="absolute inset-0 translate-x-[7px] translate-y-[9px] rounded-[22px] border border-white/70 bg-white/30"
      />

      {/* Main card */}
      <div
        className={cn(
          "hero-float relative w-[205px] overflow-hidden rounded-[22px]",
          "border border-black/[0.065]",
          "bg-white/[0.88]",
          "shadow-[0_24px_70px_rgba(20,20,30,0.12)]",
          "backdrop-blur-xl",
          floatClassName
        )}
      >
        {/* Very subtle top gradient */}
        <div
          aria-hidden="true"
          className={cn(
            "absolute inset-x-0 top-0 h-[70px] opacity-70",
            isGrowth
              ? "bg-gradient-to-b from-[#FFF5B8]/70 to-transparent"
              : "bg-gradient-to-b from-[#E8E0FF]/70 to-transparent"
          )}
        />

        {/* Top row */}
        <div className="relative flex items-center justify-between px-4 pt-4">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-[9px]",
                isGrowth
                  ? "bg-[#FFF3B0] text-[#8A7515]"
                  : "bg-[#EAE4FF] text-[#7461D5]"
              )}
            >
              {isGrowth ? (
                <TrendingUp size={14} strokeWidth={2.2} />
              ) : (
                <Bot size={14} strokeWidth={2.2} />
              )}
            </div>

            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#77777E]">
                {eyebrow}
              </p>

              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span
                    className={cn(
                      "absolute inline-flex h-full w-full animate-ping rounded-full opacity-50",
                      isGrowth ? "bg-[#C5A900]" : "bg-[#806DE0]"
                    )}
                  />
                  <span
                    className={cn(
                      "relative inline-flex h-1.5 w-1.5 rounded-full",
                      isGrowth ? "bg-[#C5A900]" : "bg-[#806DE0]"
                    )}
                  />
                </span>

                <span className="text-[9px] font-medium text-[#77777E]">
                  Active
                </span>
              </div>
            </div>
          </div>

          <Sparkles
            size={13}
            strokeWidth={1.8}
            className="text-[#A4A4AA]"
          />
        </div>

        {/* Main content */}
        <div className="relative px-4 pb-4 pt-4">
          {isGrowth ? (
            <>
              {/* Revenue metric */}
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[9px] font-medium text-[#77777E]">
                    Revenue opportunity
                  </p>

                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-[23px] font-semibold tracking-[-0.04em] text-[#111217]">
                      +₹798
                    </span>

                    <ArrowUpRight
                      size={14}
                      className="mb-1 text-[#8C7A16]"
                    />
                  </div>
                </div>

                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFF7C9]">
                  <CircleDollarSign
                    size={15}
                    strokeWidth={1.8}
                    className="text-[#8C7A16]"
                  />
                </div>
              </div>

              {/* Mini graph */}
              <div className="mt-4 h-[38px] overflow-hidden rounded-[10px] bg-[#FAFAF7] px-2 py-1.5">
                <svg
                  viewBox="0 0 180 32"
                  className="h-full w-full"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    d="M0 25 C18 23, 24 26, 40 20 S62 22, 78 17 S98 20, 113 12 S135 15, 148 8 S166 9, 180 3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-[#A99622]"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              {/* AI insight */}
              <div className="mt-3 flex items-start gap-2 rounded-[11px] border border-black/[0.045] bg-[#FAFAF9] p-2.5">
                <Sparkles
                  size={12}
                  className="mt-0.5 shrink-0 text-[#9B881D]"
                />

                <p className="text-[9.5px] leading-[1.4] text-[#66666D]">
                  Bundle opportunity detected
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Buyer request */}
              <div className="rounded-[13px] border border-black/[0.045] bg-[#FAFAF9] p-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#111217]">
                    <Bot
                      size={12}
                      strokeWidth={2}
                      className="text-white"
                    />
                  </div>

                  <span className="text-[9px] font-medium text-[#77777E]">
                    Buyer intent
                  </span>
                </div>

                <p className="mt-2 text-[11px] font-medium leading-[1.4] text-[#17181D]">
                  {line1}
                </p>

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[9px] text-[#77777E]">
                    {line2}
                  </span>

                  <span className="rounded-full bg-[#EDE8FF] px-2 py-1 text-[8px] font-semibold text-[#7562D3]">
                    HIGH INTENT
                  </span>
                </div>
              </div>

              {/* AI match */}
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <p className="text-[9px] text-[#85858B]">
                    Product match
                  </p>

                  <p className="mt-0.5 text-[15px] font-semibold tracking-[-0.02em] text-[#111217]">
                    94%
                  </p>
                </div>

                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#DED7FF] bg-[#F5F2FF]">
                  <Check
                    size={14}
                    strokeWidth={2.5}
                    className="text-[#7562D3]"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Bottom shine */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-black/[0.08] to-transparent"
        />
      </div>
    </motion.div>
  );
}





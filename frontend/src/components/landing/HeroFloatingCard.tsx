"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface HeroFloatingCardProps {
  eyebrow: string;
  line1: string;
  line2: string;
  rotate: number;
  className?: string;
  floatClassName?: string;
}

export function HeroFloatingCard({
  eyebrow,
  line1,
  line2,
  rotate,
  className,
  floatClassName = "hero-float-slow",
}: HeroFloatingCardProps) {
  return (
    <div
      data-hero-card
      className={cn("pointer-events-none absolute hidden lg:block", className)}
    >
      {/* Duplicate card behind, for a layered/stacked feel */}
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-[18px] border border-black/[0.05] bg-white/60"
        style={{ rotate: `${rotate * 1.6}deg`, translate: "0 8px" }}
      />

      <motion.div
        whileHover={{ y: -4 }}
        className={cn(
          "hero-float relative w-[168px] rounded-[18px] border border-black/[0.06] bg-white/90 p-3.5 shadow-[0_18px_40px_rgba(20,20,30,0.08)] backdrop-blur-sm",
          floatClassName
        )}
        style={{ rotate: `${rotate}deg` }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8C7BE0]">
          {eyebrow}
        </p>
        <p className="mt-1.5 text-[12.5px] font-medium leading-snug text-[#111217]">{line1}</p>
        <p className="mt-0.5 text-[11.5px] leading-snug text-[#62636A]">{line2}</p>
      </motion.div>
    </div>
  );
}

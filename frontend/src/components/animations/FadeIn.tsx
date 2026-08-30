"use client";

import { motion, type Variants } from "motion/react";
import type { ReactNode } from "react";

import { useReducedMotion } from "@/lib/useReducedMotion";

interface FadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  y?: number;
  once?: boolean;
  amount?: number;
  as?: "div" | "section" | "span";
}

/**
 * Standard scroll-triggered fade + rise, used across every interior page
 * instead of hand-rolled GSAP timelines. Respects `prefers-reduced-motion`
 * by skipping the transform and only cross-fading in.
 */
export function FadeIn({
  children,
  className,
  delay = 0,
  duration = 0.6,
  y = 18,
  once = true,
  amount = 0.4,
  as = "div",
}: FadeInProps) {
  const reducedMotion = useReducedMotion();

  const variants: Variants = {
    hidden: { opacity: 0, y: reducedMotion ? 0 : y },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: reducedMotion ? 0.2 : duration, ease: [0.16, 1, 0.3, 1], delay },
    },
  };

  const MotionTag = motion[as];

  return (
    <MotionTag
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount }}
      variants={variants}
      className={className}
    >
      {children}
    </MotionTag>
  );
}

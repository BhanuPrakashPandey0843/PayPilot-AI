"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

import { useReducedMotion } from "@/lib/useReducedMotion";
import { cn } from "@/lib/utils";

/**
 * Masked line-reveal for headings — the text rides up from behind an
 * overflow-hidden mask, matching the treatment already used for the
 * hero heading in `TrackBrief`. Falls back to a plain fade for
 * reduced-motion users.
 */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <span className={className}>{children}</span>;
  }

  return (
    <span className={cn("block overflow-hidden", className)}>
      <motion.span
        initial={{ y: "100%", opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay }}
        className="block"
      >
        {children}
      </motion.span>
    </span>
  );
}

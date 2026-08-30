"use client";

import { motion } from "motion/react";
import { type ReactNode, useRef } from "react";

import { useReducedMotion } from "@/lib/useReducedMotion";
import { cn } from "@/lib/utils";

/**
 * Subtle magnetic hover for primary CTAs — the button drifts a few
 * pixels toward the cursor, then springs back. No-ops entirely under
 * reduced motion (returns a plain span wrapper).
 */
export function MagneticButton({
  children,
  className,
  strength = 10,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <span className={className}>{children}</span>;
  }

  return (
    <motion.span
      ref={ref}
      className={cn("inline-block", className)}
      onMouseMove={(event) => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        el.style.setProperty("--mx", `${(x / rect.width) * strength}px`);
        el.style.setProperty("--my", `${(y / rect.height) * strength}px`);
      }}
      onMouseLeave={() => {
        ref.current?.style.setProperty("--mx", "0px");
        ref.current?.style.setProperty("--my", "0px");
      }}
      style={{
        translate: "var(--mx, 0px) var(--my, 0px)",
        transition: "translate 0.25s cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      {children}
    </motion.span>
  );
}

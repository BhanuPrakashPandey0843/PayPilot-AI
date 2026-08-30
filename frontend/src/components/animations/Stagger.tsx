"use client";

import { motion, type Variants } from "motion/react";
import type { ReactNode } from "react";

import { useReducedMotion } from "@/lib/useReducedMotion";

const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

/**
 * Wraps a list of children in a stagger-on-scroll container. Pair with
 * `<StaggerItem>` for each child, or rely on Framer's variant propagation
 * if the immediate children are already `motion.*` elements.
 */
export function Stagger({
  children,
  className,
  once = true,
  amount = 0.3,
}: {
  children: ReactNode;
  className?: string;
  once?: boolean;
  amount?: number;
}) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={reducedMotion ? undefined : "hidden"}
      whileInView={reducedMotion ? undefined : "show"}
      viewport={{ once, amount }}
      variants={containerVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}

"use client";

import { motion } from "motion/react";

import { cn } from "@/lib/utils";

/**
 * Full-page loader used by route-level `loading.tsx` files. A soft
 * pulsing PayPilot mark instead of a generic spinner, so even the
 * loading moment carries the brand.
 */
export function PageLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-4 bg-[#FAFAF8] px-5 py-24">
      <motion.div
        animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-[#111217] shadow-[0_10px_24px_rgba(17,18,23,0.18)]"
      >
        <span className="h-2.5 w-2.5 rounded-full bg-[#8C7BE0]" />
      </motion.div>
      <p className="text-[12px] font-medium tracking-[0.02em] text-[#8A8B92]">{label}&hellip;</p>
    </div>
  );
}

/** Shimmering block used as the base for every skeleton primitive below. */
function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[10px] bg-black/[0.05]",
        className
      )}
    >
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/[0.04] to-transparent"
        animate={{ translateX: ["-100%", "100%"] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-[0_16px_40px_-24px_rgba(20,20,30,0.14)]",
        className
      )}
    >
      <Shimmer className="h-9 w-9 rounded-[10px]" />
      <Shimmer className="mt-4 h-3 w-2/3" />
      <Shimmer className="mt-2.5 h-5 w-1/2" />
      <Shimmer className="mt-4 h-3 w-full" />
      <Shimmer className="mt-2 h-3 w-4/5" />
    </div>
  );
}

export function ContentSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: lines }).map((_, i) => (
        <Shimmer key={i} className={cn("h-3", i === lines - 1 ? "w-2/3" : "w-full")} />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-[18px] border border-black/[0.06] bg-white">
      <div className="grid gap-3 border-b border-black/[0.06] p-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Shimmer key={i} className="h-3 w-2/3" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="grid gap-3 border-b border-black/[0.04] p-4 last:border-0"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: cols }).map((_, c) => (
            <Shimmer key={c} className="h-3 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-48 items-end gap-2 rounded-[18px] border border-black/[0.06] bg-white p-5",
        className
      )}
    >
      {[40, 65, 50, 80, 60, 90, 70].map((h, i) => (
        <Shimmer key={i} className="w-full rounded-[6px]" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <ChartSkeleton />
      <TableSkeleton />
    </div>
  );
}

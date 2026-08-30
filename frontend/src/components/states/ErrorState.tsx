"use client";

import { motion } from "motion/react";
import { AlertTriangle, RefreshCw, WifiOff, Lock, ShieldOff } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

type ErrorKind = "generic" | "network" | "unauthorized" | "forbidden";

const KIND_CONFIG: Record<ErrorKind, { icon: typeof AlertTriangle; title: string; description: string }> = {
  generic: {
    icon: AlertTriangle,
    title: "Something went wrong",
    description: "An unexpected error occurred. You can try again, or head back to safety.",
  },
  network: {
    icon: WifiOff,
    title: "Connection lost",
    description: "We couldn't reach PayPilot. Check your connection and try again.",
  },
  unauthorized: {
    icon: Lock,
    title: "Sign in required",
    description: "You need to be signed in to view this page.",
  },
  forbidden: {
    icon: ShieldOff,
    title: "Access restricted",
    description: "Your account doesn't have permission to view this page.",
  },
};

/**
 * Reusable inline error panel — used inside `error.tsx` boundaries and
 * anywhere a fetch/action can fail. `onRetry` wires into Next's `reset()`.
 */
export function ErrorState({
  kind = "generic",
  title,
  description,
  onRetry,
  className,
}: {
  kind?: ErrorKind;
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  const config = KIND_CONFIG[kind];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "mx-auto flex max-w-md flex-col items-center gap-4 rounded-[24px] border border-black/[0.06] bg-white px-6 py-12 text-center shadow-[0_24px_60px_-24px_rgba(20,20,30,0.14)]",
        className
      )}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FDE8E9]"
      >
        <Icon className="h-5 w-5 text-[#E14F55]" strokeWidth={2} />
      </motion.div>

      <div>
        <h3 className="text-[17px] font-bold tracking-[-0.01em] text-[#111217]">
          {title ?? config.title}
        </h3>
        <p className="mt-2 text-[13.5px] leading-[1.6] text-[#5F6067]">
          {description ?? config.description}
        </p>
      </div>

      <div className="mt-1 flex items-center gap-2.5">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex h-9 items-center gap-1.5 rounded-[11px] bg-[#111217] px-4 text-[13px] font-medium text-white outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[#111217]/40"
          >
            <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} />
            Try again
          </button>
        )}
        <Link
          href="/"
          className="inline-flex h-9 items-center rounded-[11px] border border-black/[0.08] px-4 text-[13px] font-medium text-[#111217] outline-none transition-colors hover:bg-black/[0.03] focus-visible:ring-2 focus-visible:ring-[#111217]/20"
        >
          Back home
        </Link>
      </div>
    </div>
  );
}

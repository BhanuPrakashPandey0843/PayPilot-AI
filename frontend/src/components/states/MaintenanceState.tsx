"use client";

import { motion } from "motion/react";
import { Wrench, WifiOff } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

/** Full-page panel for planned downtime — distinct from `ErrorState`'s inline failure panel. */
export function MaintenanceState({
  title = "Down for maintenance",
  description = "PayPilot AI is undergoing scheduled maintenance. We'll be back shortly.",
  className,
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-[60vh] flex-col items-center justify-center gap-4 px-5 text-center", className)}>
      <motion.div
        animate={{ rotate: [0, -8, 8, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF3C4]"
      >
        <Wrench className="h-5 w-5 text-[#A9860F]" strokeWidth={2} />
      </motion.div>
      <div>
        <h2 className="text-[17px] font-bold tracking-[-0.01em] text-[#111217]">{title}</h2>
        <p className="mt-2 max-w-sm text-[13.5px] leading-[1.6] text-[#5F6067]">{description}</p>
      </div>
    </div>
  );
}

/** Full-page panel for a detected offline/connectivity state. */
export function OfflineState({ className }: { className?: string }) {
  return (
    <div className={cn("flex min-h-[60vh] flex-col items-center justify-center gap-4 px-5 text-center", className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/[0.05]">
        <WifiOff className="h-5 w-5 text-[#8A8B92]" strokeWidth={2} />
      </div>
      <div>
        <h2 className="text-[17px] font-bold tracking-[-0.01em] text-[#111217]">You're offline</h2>
        <p className="mt-2 max-w-sm text-[13.5px] leading-[1.6] text-[#5F6067]">
          Check your connection — this page will keep trying to reconnect.
        </p>
      </div>
      <Link
        href="/"
        className="inline-flex h-9 items-center rounded-[11px] border border-black/[0.08] px-4 text-[13px] font-medium text-[#111217] outline-none transition-colors hover:bg-black/[0.03]"
      >
        Back home
      </Link>
    </div>
  );
}

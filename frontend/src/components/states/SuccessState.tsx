"use client";

import { motion } from "motion/react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

/** Confirmation panel for completed flows (form submitted, email sent, etc). */
export function SuccessState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex max-w-md flex-col items-center gap-4 rounded-[24px] border border-black/[0.06] bg-white px-6 py-12 text-center shadow-[0_24px_60px_-24px_rgba(20,20,30,0.14)]",
        className
      )}
    >
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E4F7EE]"
      >
        <Check className="h-5 w-5 text-[#1F9D6C]" strokeWidth={2.5} />
      </motion.div>

      <div>
        <h3 className="text-[17px] font-bold tracking-[-0.01em] text-[#111217]">{title}</h3>
        {description && (
          <p className="mt-2 text-[13.5px] leading-[1.6] text-[#5F6067]">{description}</p>
        )}
      </div>

      {action}
    </div>
  );
}

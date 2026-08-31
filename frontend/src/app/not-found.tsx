"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[#FAFAF8] px-5 text-center">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-black/[0.05]"
      >
        <Compass className="h-6 w-6 text-[#8A8B92]" strokeWidth={1.75} />
      </motion.div>

      <div>
        <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-[#A9AAB1]">404</p>
        <h1 className="mt-2 text-[26px] font-extrabold tracking-[-0.02em] text-[#111217] sm:text-[30px]">
          This page doesn&apos;t exist
        </h1>
        <p className="mt-2 max-w-sm text-[13.5px] leading-[1.55] text-[#5F6067]">
          The page you're looking for may have moved or never existed. Let's get you back on track.
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        <Link
          href="/"
          className="inline-flex h-10 items-center rounded-[12px] bg-[#111217] px-5 text-[13px] font-medium text-white outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[#111217]/40"
        >
          Back home
        </Link>
        <Link
          href="/contact"
          className="inline-flex h-10 items-center rounded-[12px] border border-black/[0.1] px-5 text-[13px] font-medium text-[#111217] outline-none transition-colors hover:bg-black/[0.03] focus-visible:ring-2 focus-visible:ring-[#111217]/20"
        >
          Contact us
        </Link>
      </div>
    </div>
  );
}

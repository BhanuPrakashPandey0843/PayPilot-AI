"use client";

import Image from "next/image";
import { Menu } from "lucide-react";
import { motion } from "motion/react";

import navLogo from "@/assets/Navlogo.png";

export function Navbar() {
  return (
    <nav
      aria-label="Primary"
      className="absolute inset-x-0 top-[10px] z-20 mx-auto flex h-12 w-[92%] max-w-[360px] items-center justify-between rounded-full bg-[#11141C] px-4 shadow-[0_10px_30px_rgba(0,0,0,0.12)] sm:top-5 sm:h-[50px] sm:w-[360px] sm:px-[18px]"
    >
      <div className="flex items-center gap-2">
        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.25),0_0_0_1px_rgba(255,255,255,0.06)] sm:h-[34px] sm:w-[34px] sm:rounded-[9px]">
          <Image
            src={navLogo}
            alt="PayPilot logo"
            width={26}
            height={26}
            className="h-[22px] w-[22px] shrink-0 object-contain sm:h-6 sm:w-6"
            priority
          />
          {/* Shine sweep */}
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-[-60%] w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/90 to-transparent"
            animate={{ left: ["-60%", "160%"] }}
            transition={{
              duration: 1.6,
              ease: "easeInOut",
              repeat: Infinity,
              repeatDelay: 2.4,
            }}
          />
        </div>
        <span className="font-sans text-[15px] font-semibold tracking-tight text-white">
          PayPilot
        </span>
      </div>

      <motion.button
        type="button"
        aria-label="Open menu"
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.92 }}
        className="flex h-8 w-8 items-center justify-center rounded-full text-white/90 outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      >
        <Menu className="h-[18px] w-[18px]" strokeWidth={2} />
      </motion.button>
    </nav>
  );
}

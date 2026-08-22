"use client";

import { ShoppingBag, Wallet, Sparkles, Boxes, ShieldCheck, type LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

const ICONS: { icon: LucideIcon; label: string; rotate: number }[] = [
  { icon: ShoppingBag, label: "Product discovery", rotate: -8 },
  { icon: Wallet, label: "Checkout", rotate: 5 },
  { icon: Sparkles, label: "AI recommendations", rotate: -4 },
  { icon: Boxes, label: "Catalog", rotate: 7 },
  { icon: ShieldCheck, label: "Secure payment", rotate: -6 },
];

export function HeroIconCluster() {
  return (
    <ul
      aria-label="What PayPilot handles"
      className="mt-8 flex items-center justify-center gap-2.5 sm:mt-9 sm:gap-3"
    >
      {ICONS.map(({ icon: Icon, label, rotate }) => (
        <li key={label} style={{ rotate: `${rotate}deg` }}>
          <motion.div
            whileHover={{ y: -3, rotate: 0 }}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-[10px] border border-black/[0.05] bg-white shadow-[0_8px_18px_rgba(20,20,30,0.06)]",
              "sm:h-9 sm:w-9 sm:rounded-[11px]",
              "lg:h-[42px] lg:w-[42px] lg:rounded-xl"
            )}
          >
            <Icon className="h-4 w-4 text-[#111217] sm:h-[18px] sm:w-[18px]" strokeWidth={1.75} />
            <span className="sr-only">{label}</span>
          </motion.div>
        </li>
      ))}
    </ul>
  );
}

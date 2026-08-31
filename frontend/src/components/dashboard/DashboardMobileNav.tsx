"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";

import navLogo from "@/assets/Navlogo.png";
import { DashboardNavList } from "./DashboardNavItem";

/** Slide-down mobile nav for the dashboard shell — mirrors the marketing Navbar's escape/outside-click behavior. */
export function DashboardMobileNav() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="lg:hidden">
      <div className="flex h-14 items-center justify-between border-b border-black/[0.06] bg-white px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-[8px] bg-[#111217]">
            <Image src={navLogo} alt="PayPilot logo" width={16} height={16} className="h-[15px] w-[15px] object-contain" />
          </div>
          <span className="text-[13.5px] font-semibold tracking-tight text-[#111217]">PayPilot</span>
        </Link>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-[#111217] outline-none focus-visible:ring-2 focus-visible:ring-[#111217]/30"
        >
          {open ? <X className="h-[18px] w-[18px]" strokeWidth={2} /> : <Menu className="h-[18px] w-[18px]" strokeWidth={2} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            aria-label="Dashboard"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden border-b border-black/[0.06] bg-white px-3 py-3"
          >
            <DashboardNavList onNavigate={() => setOpen(false)} />
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
}

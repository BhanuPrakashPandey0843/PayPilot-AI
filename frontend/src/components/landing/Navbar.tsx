"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import navLogo from "@/assets/Navlogo.png";

const NAV_LINKS = [
  { label: "Product", href: "#product" },
  { label: "Security", href: "#security" },
  { label: "FAQ", href: "#faq" },
];

const CONTACT_EMAIL = "bhanupandey0843@gmail.com";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isHome = pathname === "/";
  const resolveHref = (href: string) => (href.startsWith("#") && !isHome ? `/${href}` : href);

  // Close on Escape and on outside click.
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen]);

  // Close automatically once the viewport grows past mobile/tablet.
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const handleChange = () => setIsOpen(false);
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  return (
    <div
      ref={navRef}
      className="absolute inset-x-0 top-[10px] z-20 mx-auto flex w-[92%] max-w-[360px] flex-col items-center sm:top-5 sm:w-[360px]"
    >
      <nav
        aria-label="Primary"
        className="flex h-12 w-full items-center justify-between rounded-full bg-[#111217] px-4 shadow-[0_10px_30px_rgba(0,0,0,0.12)] sm:h-[50px] sm:px-[18px]"
      >
        <a href={resolveHref("#top")} className="flex items-center gap-2">
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
        </a>

        {/* Desktop links */}
        <ul className="hidden items-center gap-5 sm:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={resolveHref(link.href)}
                className="text-[13px] font-medium text-white/75 outline-none transition-colors hover:text-white focus-visible:text-white"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <motion.button
          type="button"
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
          aria-controls="mobile-nav-menu"
          onClick={() => setIsOpen((open) => !open)}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.92 }}
          className="flex h-8 w-8 items-center justify-center rounded-full text-white/90 outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:hidden"
        >
          {isOpen ? (
            <X className="h-[18px] w-[18px]" strokeWidth={2} />
          ) : (
            <Menu className="h-[18px] w-[18px]" strokeWidth={2} />
          )}
        </motion.button>
      </nav>

      {/* Mobile dropdown menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="mobile-nav-menu"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="mt-2 w-full overflow-hidden rounded-[20px] border border-white/10 bg-[#111217] p-2 shadow-[0_20px_45px_rgba(0,0,0,0.28)] sm:hidden"
          >
            <ul className="flex flex-col">
              {NAV_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={resolveHref(link.href)}
                    onClick={() => setIsOpen(false)}
                    className="block rounded-[14px] px-3 py-2.5 text-[14px] font-medium text-white/85 outline-none transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:bg-white/[0.06] focus-visible:text-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-1 border-t border-white/10 pt-2">
              <a
                href={`mailto:${CONTACT_EMAIL}?subject=Demo%20Request`}
                onClick={() => setIsOpen(false)}
                className="block rounded-[14px] bg-white px-3 py-2.5 text-center text-[14px] font-medium text-[#111217] outline-none transition-opacity hover:opacity-90 focus-visible:opacity-90"
              >
                Book a Demo
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

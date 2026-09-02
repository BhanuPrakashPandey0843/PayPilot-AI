"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "./Button";
import { BrandLogo } from "./BrandLogo";

/**
 * Public-site navigation. Fixed to the top of the viewport, floating as
 * a glass pill inset from the edges once the page has scrolled — reads
 * clean against the hero at rest, then picks up a frosted border and
 * shrinks slightly as a wayfinding cue once content is moving under it.
 * Anchors point at real homepage sections rather than routes that don't
 * exist yet — see PagePlaceholder for which top-level pages are still
 * scaffolds.
 */

const NAV_LINKS = [
  { label: "How It Works", href: "/#how-it-works" },
  { label: "AI Copilot", href: "/#ai-copilot" },
  { label: "Revenue Intelligence", href: "/#revenue-intelligence" },
  { label: "Pricing", href: "/pricing" },
  { label: "Demo", href: "/demo" },
];

/**
 * Underline that grows from center on hover/focus rather than a plain
 * color swap — small, but it's the difference between links that feel
 * designed and links that feel like defaults.
 */
function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group relative py-2 text-sm text-zinc-400 transition-colors duration-200 hover:text-white"
    >
      {label}
      <span className="absolute inset-x-0 -bottom-0.5 h-px origin-center scale-x-0 bg-gradient-to-r from-transparent via-cyan-300 to-transparent transition-transform duration-300 ease-out group-hover:scale-x-100" />
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      menuButtonRef.current?.focus();
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 flex justify-center transition-all duration-500 ease-out ${
        scrolled ? "pt-3" : "pt-0"
      }`}
    >
      <nav
        className={`mx-auto flex w-full items-center justify-between transition-all duration-500 ease-out ${
          scrolled
            ? "glass-panel max-w-5xl rounded-2xl px-5 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.6)]"
            : "max-w-6xl border-b border-transparent bg-transparent px-6"
        } ${scrolled ? "h-14" : "h-16"}`}
      >
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50"
        >
          <BrandLogo className="h-7 w-[63px]" priority />
          <span className="text-base font-semibold tracking-tight text-white">
            PayPilot AI
          </span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <NavLink href={link.href} label={link.label} />
            </li>
          ))}
        </ul>

        {/* Desktop auth actions */}
        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/login"
            className="text-sm text-zinc-400 transition-colors duration-200 hover:text-white"
          >
            Login
          </Link>
          <Button href="/signup" variant="accent" size="sm">
            Get Started
          </Button>
        </div>

        {/* Mobile menu trigger */}
        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors duration-200 hover:bg-white/10 lg:hidden"
        >
          {mobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </nav>

      {/* Mobile drawer */}
      <div
        id="mobile-nav"
        ref={mobileMenuRef}
        className={`glass-panel absolute inset-x-4 top-[calc(100%+0.5rem)] overflow-hidden rounded-2xl transition-[max-height,opacity] duration-300 ease-out lg:hidden ${
          mobileOpen ? "max-h-[28rem] opacity-100" : "pointer-events-none max-h-0 opacity-0"
        }`}
      >
        <ul className="flex flex-col gap-1 px-4 py-4">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <Link
                href={link.href}
                className="block rounded-lg px-3 py-3 text-base text-zinc-300 transition-colors duration-200 hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-3 border-t border-white/10 px-4 py-5">
          <Link
            href="/login"
            className="rounded-lg px-3 py-3 text-center text-base text-zinc-300 transition-colors duration-200 hover:bg-white/5 hover:text-white"
          >
            Login
          </Link>
          <Button href="/signup" variant="accent" size="md" className="w-full">
            Get Started
          </Button>
        </div>
      </div>
    </header>
  );
}

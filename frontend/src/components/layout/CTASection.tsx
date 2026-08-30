"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";

import { FadeIn } from "@/components/animations/FadeIn";
import { Section } from "./Section";

const CONTACT_EMAIL = "bhanupandey0843@gmail.com";

/**
 * Reusable closing call-to-action band. Defaults to "Get Started" /
 * "Book a Demo" but every field is overridable so it can close out any
 * page (product pages, docs, pricing, etc.) without a bespoke section.
 */
export function CTASection({
  eyebrow = "Get Started",
  title = "Ready to put your commerce on autopilot?",
  description = "Let PayPilot AI handle discovery, recommendations and checkout — so your team can focus on growth, not busywork.",
  primaryLabel = "Create an account",
  primaryHref = "/auth/register",
  secondaryLabel = "Talk to us",
  secondaryHref = `mailto:${CONTACT_EMAIL}?subject=Demo%20Request`,
  tone = "dark",
}: {
  eyebrow?: string;
  title?: string;
  description?: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  tone?: "dark" | "light";
}) {
  const isDark = tone === "dark";

  return (
    <Section tone={isDark ? "dark" : "light"} className="text-center">
      {isDark && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(40% 60% at 10% 0%, rgba(140,123,224,0.22) 0%, rgba(140,123,224,0) 70%), " +
              "radial-gradient(35% 50% at 100% 100%, rgba(255,214,110,0.16) 0%, rgba(255,214,110,0) 70%)",
          }}
        />
      )}

      <div className="relative mx-auto max-w-2xl">
        <FadeIn>
          <p
            className={
              isDark
                ? "text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9A9BA2] sm:text-[11px]"
                : "text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8C7A16] sm:text-[11px]"
            }
          >
            {eyebrow}
          </p>
        </FadeIn>

        <FadeIn delay={0.08}>
          <h2
            className={
              isDark
                ? "mt-3 text-[30px] font-extrabold leading-[1.05] tracking-[-0.03em] text-white sm:text-[40px]"
                : "mt-3 text-[30px] font-extrabold leading-[1.05] tracking-[-0.03em] text-[#111217] sm:text-[40px]"
            }
          >
            {title}
          </h2>
        </FadeIn>

        <FadeIn delay={0.14}>
          <p
            className={
              isDark
                ? "mx-auto mt-4 max-w-[440px] text-[13px] leading-[1.6] text-white/60 sm:text-[15px]"
                : "mx-auto mt-4 max-w-[440px] text-[13px] leading-[1.6] text-[#5F6067] sm:text-[15px]"
            }
          >
            {description}
          </p>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="mt-7 flex flex-col items-center justify-center gap-2.5 sm:mt-8 sm:flex-row sm:gap-3">
            <motion.span
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full max-w-[220px] sm:w-auto"
            >
              <Link
                href={secondaryHref}
                className={
                  isDark
                    ? "inline-flex h-11 w-full items-center justify-center rounded-[13px] border border-white/15 bg-white/[0.06] px-6 text-sm font-medium text-white outline-none backdrop-blur-sm transition-colors hover:bg-white/[0.1] focus-visible:ring-2 focus-visible:ring-white/40 sm:h-12 sm:w-auto"
                    : "inline-flex h-11 w-full items-center justify-center rounded-[13px] border border-black/[0.08] bg-white px-6 text-sm font-medium text-[#111217] outline-none focus-visible:ring-2 focus-visible:ring-[#111217]/30 focus-visible:ring-offset-2 sm:h-12 sm:w-auto"
                }
              >
                {secondaryLabel}
              </Link>
            </motion.span>

            <motion.span
              animate={{ scale: [1, 1.018, 1] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
              className="w-full max-w-[220px] sm:w-auto"
            >
              <Link
                href={primaryHref}
                className={
                  isDark
                    ? "inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-[13px] bg-white px-6 text-sm font-medium text-[#111217] shadow-[0_10px_24px_rgba(0,0,0,0.28)] outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111217] sm:h-12 sm:w-auto"
                    : "inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-[13px] bg-[#111217] px-6 text-sm font-medium text-white shadow-[0_10px_24px_rgba(17,18,23,0.18)] outline-none focus-visible:ring-2 focus-visible:ring-[#111217]/50 focus-visible:ring-offset-2 sm:h-12 sm:w-auto"
                }
              >
                {primaryLabel}
                <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
              </Link>
            </motion.span>
          </div>
        </FadeIn>
      </div>
    </Section>
  );
}

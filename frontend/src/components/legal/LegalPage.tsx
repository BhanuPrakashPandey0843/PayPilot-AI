"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useScroll,
  useSpring,
  type Variants,
} from "motion/react";
import { ArrowLeft, ArrowUp, ShieldCheck } from "lucide-react";

import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { useReducedMotion } from "@/lib/useReducedMotion";

type LegalSection = {
  heading: string;
  paragraphs: string[];
  list?: string[];
};

type LegalPageProps = {
  title: string;
  intro: string;
  lastUpdated: string;
  sections: LegalSection[];
  ctaLabel?: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

export function LegalPage({ title, intro, lastUpdated, sections, ctaLabel = "Back to home" }: LegalPageProps) {
  const reducedMotion = useReducedMotion();
  const [showBackToTop, setShowBackToTop] = useState(false);

  const { scrollYProgress } = useScroll();
  const progressWidth = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 24,
    mass: 0.3,
  });

  const sectionsWithIds = useMemo(
    () =>
      sections.map((section) => ({
        ...section,
        id: slugify(section.heading),
      })),
    [sections]
  );

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 480);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#FAFAF8] text-[#111217]">
      {/* Scroll progress indicator */}
      <motion.div
        aria-hidden="true"
        className="fixed inset-x-0 top-0 z-50 h-[3px] origin-left bg-gradient-to-r from-[#8C7BE0] via-[#FFD979] to-[#8C7BE0]"
        style={{ scaleX: progressWidth }}
      />

      {/* Decorative background */}
      <div
        aria-hidden="true"
        className="hero-dots pointer-events-none absolute inset-x-0 top-0 h-[520px] opacity-70"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,_rgba(140,123,224,0.18),_transparent_58%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[-12%] top-24 h-72 w-72 rounded-full bg-[#FFD979]/20 blur-3xl sm:right-[-6%]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[-14%] top-[420px] h-64 w-64 rounded-full bg-[#8C7BE0]/15 blur-3xl"
      />

      <Navbar />

      <section className="relative z-10 mx-auto w-full max-w-4xl flex-1 px-4 pb-20 pt-[104px] sm:px-6 sm:pb-24 sm:pt-[132px] lg:px-8 lg:pt-[150px]">
        <motion.div
          initial={reducedMotion ? undefined : "hidden"}
          animate={reducedMotion ? undefined : "show"}
          variants={staggerContainer}
        >
          <motion.div variants={fadeUp}>
            <Link
              href="/"
              className="group inline-flex items-center gap-1.5 text-xs font-medium text-[#5F6067] transition-colors hover:text-[#111217]"
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover:-translate-x-0.5" />
              {ctaLabel}
            </Link>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-black/[0.06] bg-white/70 px-[10px] py-[6px] text-[10px] font-medium text-[#55565D] backdrop-blur-sm sm:text-[11px]"
          >
            <ShieldCheck className="h-3 w-3 text-[#8C7BE0]" strokeWidth={2} />
            <span>PayPilot prototype</span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="mt-4 max-w-2xl text-[clamp(2rem,6vw,3.5rem)] font-extrabold leading-[0.95] tracking-[-0.04em] text-[#111217]"
          >
            {title}
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-4 max-w-2xl text-base leading-7 text-[#5F6067] sm:text-lg"
          >
            {intro}
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-[#111217]/8 bg-[#F5F5F7] px-4 py-3 text-sm text-[#4D4E55]"
          >
            <span className="relative inline-flex h-2.5 w-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2BC48A]/60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#2BC48A] shadow-[0_0_0_4px_rgba(43,196,138,0.15)]" />
            </span>
            Last updated: {lastUpdated}
          </motion.div>

          {/* Quick section jump chips */}
          <motion.nav
            variants={fadeUp}
            aria-label="Jump to section"
            className="mt-6 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
          >
            {sectionsWithIds.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="shrink-0 whitespace-nowrap rounded-full border border-[#111217]/10 bg-white px-3.5 py-1.5 text-xs font-medium text-[#4D4E55] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#8C7BE0]/40 hover:text-[#111217] hover:shadow-[0_8px_18px_rgba(17,18,23,0.08)]"
              >
                {section.heading}
              </a>
            ))}
          </motion.nav>
        </motion.div>

        <motion.div
          initial={reducedMotion ? undefined : { opacity: 0, y: 18 }}
          whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="mt-8 rounded-[28px] border border-[#111217]/10 bg-white/90 p-5 shadow-[0_25px_80px_rgba(17,18,23,0.08)] backdrop-blur-sm sm:p-8 lg:p-10"
        >
          <div className="space-y-10 text-[15px] leading-8 text-[#252832] sm:space-y-12 sm:text-[16px]">
            {sectionsWithIds.map((section, index) => (
              <motion.section
                key={section.id}
                id={section.id}
                initial={reducedMotion ? undefined : { opacity: 0, y: 24 }}
                whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="scroll-mt-28"
              >
                <div className="mb-3 flex items-baseline gap-3">
                  <span className="font-serif text-sm italic text-[#8C7BE0]/70">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h2 className="text-xl font-bold tracking-[-0.03em] text-[#111217] sm:text-2xl">
                    {section.heading}
                  </h2>
                </div>

                <div className="space-y-4 pl-0 text-[#3F424C] sm:pl-8">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="leading-7 text-[#3F424C]">
                      {paragraph}
                    </p>
                  ))}

                  {section.list && (
                    <ul className="space-y-2 pl-5 text-[#3F424C] marker:text-[#8C7BE0]">
                      {section.list.map((item) => (
                        <li key={item} className="list-disc leading-7">
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </motion.section>
            ))}
          </div>
        </motion.div>
      </section>

      <Footer />

      {/* Back to top */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            type="button"
            aria-label="Back to top"
            onClick={() => window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" })}
            initial={{ opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.9 }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.92 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed bottom-5 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-[#111217] text-white shadow-[0_12px_30px_rgba(17,18,23,0.28)] outline-none focus-visible:ring-2 focus-visible:ring-[#111217]/50 focus-visible:ring-offset-2 sm:bottom-8 sm:right-8"
          >
            <ArrowUp className="h-[18px] w-[18px]" strokeWidth={2.25} />
          </motion.button>
        )}
      </AnimatePresence>
    </main>
  );
}

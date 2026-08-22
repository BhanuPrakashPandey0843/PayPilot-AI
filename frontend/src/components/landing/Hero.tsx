"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { motion } from "motion/react";

import { HeroBackground } from "./HeroBackground";
import { Navbar } from "./Navbar";
import { HeroTrustBadge } from "./HeroTrustBadge";
import { HeroFloatingCard } from "./HeroFloatingCard";
import { HeroIconCluster } from "./HeroIconCluster";
import { TrustedRow } from "./TrustedRow";
import { useReducedMotion } from "@/lib/useReducedMotion";

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const iconsRef = useRef<HTMLDivElement>(null);
  const trustRowRef = useRef<HTMLDivElement>(null);

  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;

    const ctx = gsap.context(() => {
      const arch = sectionRef.current?.querySelector(".hero-arch");
      const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });

      if (arch) {
        timeline.from(arch, { opacity: 0, scale: 0.94, duration: 0.9, ease: "power2.out" }, 0);
      }

      timeline
        .from(navRef.current, { y: -16, opacity: 0, duration: 0.6 }, 0.05)
        .from(badgeRef.current, { y: 12, opacity: 0, duration: 0.5 }, 0.25)
        .from(
          headingRef.current,
          { y: 24, opacity: 0, duration: 0.75, ease: "power4.out" },
          0.35
        )
        .from(descriptionRef.current, { y: 16, opacity: 0, duration: 0.55 }, 0.55)
        .from(ctaRef.current, { y: 12, opacity: 0, duration: 0.5 }, 0.65)
        .from(
          iconsRef.current ? Array.from(iconsRef.current.querySelectorAll("li")) : [],
          { opacity: 0, y: 10, duration: 0.4, stagger: 0.06 },
          0.8
        )
        .from(trustRowRef.current, { opacity: 0, duration: 0.5 }, 0.95);
      // Note: the floating storytelling cards (cardsRef) are intentionally left out of
      // this GSAP timeline — HeroFloatingCard already animates its own entrance via
      // Framer Motion's `initial`/`animate` props. Having both GSAP and Framer Motion
      // drive opacity/scale/transform on the same nodes causes them to fight over the
      // same inline styles, which can leave the cards stuck invisible.
    }, sectionRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section
      ref={sectionRef}
      id="top"
      className="relative isolate min-h-[680px] w-full overflow-hidden sm:min-h-[720px] lg:min-h-[760px]"
    >
      <HeroBackground />

      <div ref={navRef}>
        <Navbar />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center px-5 pt-[104px] pb-16 text-center sm:pt-[132px] lg:pt-[150px]">
        <div ref={badgeRef}>
          <HeroTrustBadge />
        </div>

        <h1
          ref={headingRef}
          className="mt-5 max-w-[750px] text-[42px] font-extrabold leading-[0.95] tracking-[-0.04em] text-[#111217] sm:mt-6 sm:text-[56px] sm:leading-[0.94] lg:text-[74px] lg:leading-[0.92] lg:tracking-[-0.045em]"
        >
          AI Commerce
          <br />
          On Autopilot.
        </h1>

        <p
          ref={descriptionRef}
          className="mt-5 max-w-[300px] text-[13px] leading-[1.45] text-[#5F6067] sm:mt-6 sm:max-w-[500px] sm:text-[15px] lg:text-[16px]"
        >
          Let AI discover, recommend and convert — from product discovery to a secure,
          explainable payment.
        </p>

        <div
          ref={ctaRef}
          className="mt-7 flex w-full max-w-[320px] flex-col gap-2.5 sm:mt-8 sm:max-w-none sm:flex-row sm:items-center sm:justify-center sm:gap-3"
        >
          <motion.a
            href="#product"
            animate={{ scale: [1, 1.018, 1] }}
            transition={{
              duration: 2.6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            whileHover={{
              scale: 1.06,
              boxShadow: "0 16px 34px rgba(17,18,23,0.32)",
              transition: { duration: 0.25, ease: "easeOut" },
            }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex h-11 w-full items-center justify-center rounded-[13px] bg-[#111217] px-6 text-sm font-medium text-white shadow-[0_10px_24px_rgba(17,18,23,0.18)] outline-none focus-visible:ring-2 focus-visible:ring-[#111217]/50 focus-visible:ring-offset-2 sm:h-12 sm:w-auto"
          >
            Explore PayPilot
          </motion.a>
          <motion.a
            href="#security"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex h-11 w-full items-center justify-center rounded-[13px] border border-black/[0.08] bg-white px-6 text-sm font-medium text-[#111217] outline-none focus-visible:ring-2 focus-visible:ring-[#111217]/30 focus-visible:ring-offset-2 sm:h-12 sm:w-auto"
          >
            Watch Demo
          </motion.a>
        </div>

        <div ref={iconsRef}>
          <HeroIconCluster />
        </div>

        <div ref={trustRowRef}>
          <TrustedRow />
        </div>

        {/* Floating storytelling cards — desktop only */}
        <div ref={cardsRef}>
          <HeroFloatingCard
            eyebrow="AI Buyer"
            line1="Looking for running shoes"
            line2="Budget ₹5,000"
            rotate={-6}
            delay={0.55}
            className="left-[4%] top-[54%] xl:left-[8%]"
            floatClassName="hero-float"
          />
          <HeroFloatingCard
            eyebrow="Growth Agent"
            line1="+₹798 projected AOV"
            line2="Bundle opportunity detected"
            rotate={5}
            delay={0.7}
            className="right-[4%] top-[42%] xl:right-[8%]"
            floatClassName="hero-float-slow"
          />
        </div>
      </div>
    </section>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowUpRight,
  BookOpenText,
  Eye,
  GitBranch,
  Lock,
  Megaphone,
  MessageSquareText,
  Radio,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { useReducedMotion } from "@/lib/useReducedMotion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const PROTOCOLS = ["NPCI UAP", "ACP", "AP2", "x402", "Razorpay pilots"];

const DIRECTIONS = [
  {
    icon: MessageSquareText,
    label: "Conversational in-app checkout",
    iconBg: "#EDE8FF",
    iconColor: "#7461D5",
  },
  {
    icon: BookOpenText,
    label: "Agent-readable catalog",
    iconBg: "#FFF3C4",
    iconColor: "#A9860F",
  },
  {
    icon: TrendingUp,
    label: "Upsell & cross-sell agent",
    iconBg: "#DAF3E6",
    iconColor: "#249A67",
  },
  {
    icon: Megaphone,
    label: "Campaign orchestrator",
    iconBg: "#FFE0E8",
    iconColor: "#E0537A",
  },
];

const BAR_ITEMS = [
  { icon: Eye, label: "Explainable" },
  { icon: GitBranch, label: "Bounded" },
  { icon: Lock, label: "Gated" },
];

/* ------------------------------------------------------------------ */
/*  Section                                                            */
/* ------------------------------------------------------------------ */

export function TrackBrief() {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;

    const ctx = gsap.context(() => {
      /* Entrance timeline for the header block */
      const headerTl = gsap.timeline({
        defaults: { ease: "power3.out" },
        scrollTrigger: {
          trigger: ".track-header",
          start: "top 78%",
        },
      });

      headerTl
        .from(".track-eyebrow", { y: 14, opacity: 0, duration: 0.5 })
        .from(
          ".track-heading-line",
          { y: 34, opacity: 0, duration: 0.75, stagger: 0.08, ease: "power4.out" },
          0.08
        )
        .from(".track-quote", { y: 16, opacity: 0, duration: 0.6 }, 0.4)
        .fromTo(
          ".track-quote-rule",
          { scaleY: 0 },
          { scaleY: 1, duration: 0.6, ease: "power2.out", transformOrigin: "top" },
          0.4
        );

      /* Giant faint numeral — entrance + gentle parallax drift on scroll */
      gsap.fromTo(
        ".track-numeral",
        { y: -40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: { trigger: ".track-header", start: "top 78%" },
        }
      );
      gsap.to(".track-numeral", {
        y: 60,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.6,
        },
      });

      /* The build / mission card */
      gsap.from(".track-ask", {
        y: 26,
        opacity: 0,
        scale: 0.98,
        duration: 0.7,
        ease: [0.16, 1, 0.3, 1],
        scrollTrigger: { trigger: ".track-ask", start: "top 82%" },
      });

      /* Why-now card + protocol pills */
      const whyTl = gsap.timeline({
        scrollTrigger: { trigger: ".track-why", start: "top 82%" },
      });
      whyTl
        .from(".track-why", { y: 24, opacity: 0, duration: 0.65, ease: [0.16, 1, 0.3, 1] })
        .from(
          ".track-pill",
          { y: 8, opacity: 0, duration: 0.4, stagger: 0.06, ease: "power2.out" },
          0.2
        );

      /* Direction cards — staggered rise */
      gsap.from(".track-direction-card", {
        y: 28,
        opacity: 0,
        duration: 0.6,
        stagger: 0.09,
        ease: [0.16, 1, 0.3, 1],
        scrollTrigger: { trigger: ".track-grid", start: "top 85%" },
      });

      /* Closing "bar" panel — rule draws across, badges pop in */
      const barTl = gsap.timeline({
        scrollTrigger: { trigger: ".track-bar", start: "top 82%" },
      });
      barTl
        .from(".track-bar", { y: 30, opacity: 0, duration: 0.7, ease: [0.16, 1, 0.3, 1] })
        .fromTo(
          ".track-bar-rule",
          { scaleX: 0 },
          { scaleX: 1, duration: 0.8, ease: "power3.out", transformOrigin: "left center" },
          0.15
        )
        .from(
          ".track-bar-badge",
          { y: 10, opacity: 0, duration: 0.4, stagger: 0.08, ease: "power2.out" },
          0.35
        )
        .from(".track-bar-footnote", { opacity: 0, duration: 0.5 }, 0.6);
    }, sectionRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section
      ref={sectionRef}
      id="track"
      className="relative isolate overflow-hidden bg-white px-5 py-20 sm:py-24 lg:py-28"
    >
      {/* Ambient glows echoing the hero/section palette */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 opacity-80"
          style={{
            background:
              "radial-gradient(32% 36% at 96% 8%, rgba(255,214,110,0.16) 0%, rgba(255,214,110,0) 70%), " +
              "radial-gradient(30% 34% at 2% 96%, rgba(140,123,224,0.12) 0%, rgba(140,123,224,0) 70%)",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl">
        {/* ---------------------------------------------------------- */}
        {/* Header                                                      */}
        {/* ---------------------------------------------------------- */}
        <div className="track-header relative">
          {/* Giant faint track numeral, decorative */}
          <span
            aria-hidden="true"
            className="track-numeral pointer-events-none absolute -top-10 right-0 select-none text-[140px] font-extrabold leading-none tracking-[-0.05em] text-[#111217]/[0.04] sm:-top-14 sm:text-[200px] lg:-top-20 lg:text-[260px]"
          >
            01
          </span>

          <div className="track-eyebrow inline-flex items-center gap-1.5 rounded-full border border-black/[0.06] bg-white/70 px-[10px] py-[6px] text-[10px] font-medium text-[#55565D] backdrop-blur-sm sm:text-[11px]">
            <Sparkles className="h-3 w-3 text-[#8C7BE0]" strokeWidth={2} />
            <span>Track 01 · Hackathon Brief</span>
          </div>

          <h2 className="relative mt-5 max-w-[620px] text-[34px] font-extrabold leading-[1.02] tracking-[-0.035em] text-[#111217] sm:mt-6 sm:text-[46px] lg:text-[54px]">
            <span className="track-heading-line block overflow-hidden">AI Growth &amp;</span>
            <span className="track-heading-line block overflow-hidden font-serif italic font-medium">
              Agentic Commerce
            </span>
          </h2>

          <div className="track-quote relative mt-6 max-w-[560px] pl-5 sm:mt-7">
            <span className="track-quote-rule absolute left-0 top-0.5 h-full w-[2.5px] rounded-full bg-gradient-to-b from-[#8C7BE0] to-[#FFD66E]" />
            <p className="text-[15px] italic leading-[1.55] text-[#5F6067] sm:text-[17px]">
              Grow the merchant&rsquo;s revenue, and make them sellable to AI buyers.
            </p>
          </div>
        </div>

        {/* ---------------------------------------------------------- */}
        {/* The ask / mission panel                                     */}
        {/* ---------------------------------------------------------- */}
        <div className="track-ask relative mt-10 overflow-hidden rounded-[24px] border border-black/[0.06] bg-[#FCFCFB] p-5 shadow-[0_24px_60px_-24px_rgba(20,20,30,0.14)] sm:mt-12 sm:rounded-[28px] sm:p-7">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-10 -z-10 rounded-[36px] bg-gradient-to-br from-[#EFE9FF]/60 via-transparent to-[#FFF3C4]/50 blur-[52px]"
          />

          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8C7A16] sm:text-[11px]">
            The Build
          </p>

          <p className="mt-3 max-w-[720px] text-[16px] font-medium leading-[1.6] tracking-[-0.01em] text-[#111217] sm:text-[19px] lg:text-[21px]">
            Build an agent that grows revenue for a merchant on Razorpay test-mode
            APIs, or that makes a merchant transactable by an AI buyer end to
            end.
            <span
              aria-hidden="true"
              className="caret-blink ml-[3px] inline-block h-[1em] w-[2px] translate-y-[2px] bg-[#B9BAC1] align-middle"
            />
          </p>
        </div>

        {/* ---------------------------------------------------------- */}
        {/* Why now                                                     */}
        {/* ---------------------------------------------------------- */}
        <div className="track-why relative mt-5 overflow-hidden rounded-[24px] border border-black/[0.06] bg-gradient-to-br from-[#F1EDFF] to-[#FFF6DC] p-5 sm:mt-6 sm:rounded-[28px] sm:p-7">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white/70 shadow-[0_1px_2px_rgba(17,18,23,0.05)] backdrop-blur-sm">
              <Radio className="h-4 w-4 text-[#7461D5]" strokeWidth={2} />
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#77777E] sm:text-[11px]">
                Why Now
              </p>

              <p className="mt-2 max-w-[620px] text-[13px] leading-[1.65] text-[#4B4C53] sm:text-[14.5px]">
                NPCI&rsquo;s UAP and the global protocol race make agent-to-agent
                commerce the open problem of the year, and Razorpay&rsquo;s
                in-app pilots are already live.
              </p>

              <div className="mt-4 flex flex-wrap gap-1.5 sm:mt-5">
                {PROTOCOLS.map((protocol) => (
                  <span
                    key={protocol}
                    className="track-pill inline-flex items-center rounded-full border border-black/[0.06] bg-white/80 px-2.5 py-1 text-[10.5px] font-medium text-[#4B4C53] shadow-[0_1px_2px_rgba(17,18,23,0.04)] backdrop-blur-sm sm:text-[11px]"
                  >
                    {protocol}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------------- */}
        {/* Example directions                                          */}
        {/* ---------------------------------------------------------- */}
        <div className="mt-10 sm:mt-12">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8A8B92] sm:text-[11px]">
            Example Directions
          </p>

          <div className="track-grid mt-4 grid grid-cols-1 gap-3 sm:mt-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
            {DIRECTIONS.map(({ icon: Icon, label, iconBg, iconColor }) => (
              <div
                key={label}
                className="track-direction-card group relative overflow-hidden rounded-[18px] border border-black/[0.06] bg-[#FCFCFB] p-4 shadow-[0_16px_40px_-20px_rgba(20,20,30,0.14)] transition-all duration-300 hover:-translate-y-1 hover:border-black/[0.09] hover:shadow-[0_22px_48px_-18px_rgba(20,20,30,0.2)] sm:p-5"
              >
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-[10px] transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105"
                  style={{ backgroundColor: iconBg }}
                >
                  <Icon className="h-4 w-4" style={{ color: iconColor }} strokeWidth={2} />
                </div>

                <p className="mt-3.5 text-[13.5px] font-semibold leading-[1.35] tracking-[-0.01em] text-[#111217] sm:text-[14px]">
                  {label}
                </p>

                <ArrowUpRight
                  size={14}
                  strokeWidth={2}
                  className="absolute right-4 top-4 text-[#B9BAC1] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                />
              </div>
            ))}
          </div>
        </div>

        {/* ---------------------------------------------------------- */}
        {/* The bar — closing requirement panel                        */}
        {/* ---------------------------------------------------------- */}
        <div className="track-bar relative mt-10 overflow-hidden rounded-[24px] bg-[#111217] p-6 shadow-[0_32px_70px_-24px_rgba(17,18,23,0.5)] sm:mt-12 sm:rounded-[28px] sm:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              background:
                "radial-gradient(40% 60% at 10% 0%, rgba(140,123,224,0.22) 0%, rgba(140,123,224,0) 70%), " +
                "radial-gradient(35% 50% at 100% 100%, rgba(255,214,110,0.16) 0%, rgba(255,214,110,0) 70%)",
            }}
          />

          <div className="relative">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9A9BA2] sm:text-[11px]">
              The Bar
            </p>

            <span className="track-bar-rule mt-3 block h-px w-full origin-left bg-gradient-to-r from-white/30 via-white/10 to-transparent sm:mt-4" />

            <p className="mt-4 max-w-[600px] text-[18px] font-medium italic leading-[1.5] tracking-[-0.01em] text-white sm:mt-5 sm:text-[22px] lg:text-[25px]">
              Every money action explainable, bounded and gated.
            </p>

            <div className="mt-5 flex flex-wrap gap-2 sm:mt-6">
              {BAR_ITEMS.map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="track-bar-badge inline-flex items-center gap-1.5 rounded-full border border-white/[0.12] bg-white/[0.06] px-3 py-1.5 text-[11.5px] font-medium text-white/90 backdrop-blur-sm sm:text-[12.5px]"
                >
                  <Icon size={12.5} strokeWidth={2.2} className="text-[#C9BEFF]" />
                  {label}
                </span>
              ))}
            </div>

            <p className="track-bar-footnote mt-5 flex items-center gap-1.5 text-[12.5px] leading-[1.6] text-white/50 sm:mt-6 sm:text-[13.5px]">
              <ShieldCheck size={13} strokeWidth={2} className="shrink-0 text-white/40" />
              Show the audit trail and one failure handled gracefully.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Coins,
  LayoutGrid,
  LifeBuoy,
  Mail,
  MessageCircle,
  Send,
  Settings2,
  Users,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/lib/useReducedMotion";

/* ------------------------------------------------------------------ */
/*  Animated count-up — used for every headline metric on this panel   */
/* ------------------------------------------------------------------ */

function AnimatedCounter({
  value,
  suffix = "",
  duration = 1.3,
  delay = 0,
}: {
  value: number;
  suffix?: string;
  duration?: number;
  delay?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reducedMotion = useReducedMotion();
  const [display, setDisplay] = useState(reducedMotion ? value : 0);

  useEffect(() => {
    if (!inView) return;

    if (reducedMotion) {
      setDisplay(value);
      return;
    }

    let frame: number;
    const start = performance.now() + delay * 1000;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);

    const tick = (now: number) => {
      const elapsed = (now - start) / (duration * 1000);
      if (elapsed < 0) {
        frame = requestAnimationFrame(tick);
        return;
      }
      const progress = Math.min(elapsed, 1);
      setDisplay(Math.round(ease(progress) * value));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value, duration, delay, reducedMotion]);

  return (
    <span ref={ref} className="tabular-nums">
      {display.toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Metric row — the little pill cards inside the "For COOs" card      */
/* ------------------------------------------------------------------ */

interface MetricRowProps {
  icon: LucideIcon;
  label: string;
  value: number;
  trend: number;
  iconBg: string;
  iconColor: string;
  featured?: boolean;
  index: number;
}

function MetricRow({
  icon: Icon,
  label,
  value,
  trend,
  iconBg,
  iconColor,
  featured,
  index,
}: MetricRowProps) {
  const up = trend >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -14 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.12 * index }}
      whileHover={{ x: featured ? 0 : 3, transition: { duration: 0.25, ease: "easeOut" } }}
      className={cn(
        "relative flex items-center justify-between gap-3 rounded-[16px] border px-3.5 py-3 transition-colors",
        featured
          ? "z-10 border-black/[0.07] bg-white shadow-[0_16px_36px_-14px_rgba(210,160,40,0.4)] sm:scale-[1.035]"
          : "border-black/[0.045] bg-[#FAFAFA] hover:border-black/[0.08] hover:bg-white"
      )}
    >
      <div className="flex items-center gap-3">
        <motion.div
          whileHover={{ rotate: -8, scale: 1.08 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
          style={{ backgroundColor: iconBg }}
        >
          <Icon className="h-4 w-4" style={{ color: iconColor }} strokeWidth={2} />
        </motion.div>

        <div>
          <p className="text-[10.5px] font-medium text-[#8A8B92] sm:text-[11px]">{label}</p>
          <p className="mt-0.5 text-[16px] font-bold tracking-[-0.02em] text-[#111217] sm:text-[17px]">
            <AnimatedCounter value={value} delay={0.1 * index} />
          </p>
        </div>
      </div>

      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-1 text-[10.5px] font-semibold sm:text-[11px]",
          up ? "bg-[#E4F7EE] text-[#1F9D6C]" : "bg-[#FDE8E9] text-[#E14F55]"
        )}
      >
        {up ? (
          <ArrowUpRight size={12} strokeWidth={2.4} />
        ) : (
          <ArrowDownRight size={12} strokeWidth={2.4} />
        )}
        {Math.abs(trend).toFixed(1)}%
      </span>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  SLA donut — the radial progress ring in the "For CX Leaders" card  */
/* ------------------------------------------------------------------ */

function SlaDonut({ percent = 98 }: { percent?: number }) {
  const size = 176;
  const stroke = 15;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const reducedMotion = useReducedMotion();

  return (
    <div className="relative flex h-[176px] w-[176px] items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#EFEEF4"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#8C7BE0"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          whileInView={{
            strokeDashoffset: circumference - (circumference * percent) / 100,
          }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: reducedMotion ? 0 : 1.6, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[30px] font-extrabold tracking-[-0.03em] text-[#111217]">
          <AnimatedCounter value={percent} suffix="%" duration={1.6} delay={0.15} />
        </span>
        <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.10em] text-[#9A9BA2]">
          SLA Met
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Floating channel badges around the donut                           */
/* ------------------------------------------------------------------ */

interface ChannelBadgeProps {
  icon: LucideIcon;
  bg: string;
  color: string;
  className: string;
  floatClassName: string;
  delay: number;
}

function ChannelBadge({ icon: Icon, bg, color, className, floatClassName, delay }: ChannelBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.5, ease: "easeOut", delay }}
      whileHover={{ scale: 1.16, y: -2, transition: { duration: 0.2, ease: "easeOut" } }}
      className={cn("absolute", className)}
    >
      <div
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full border border-black/[0.05] bg-white shadow-[0_10px_22px_rgba(20,20,30,0.10)] sm:h-10 sm:w-10",
          floatClassName
        )}
      >
        <span
          className="flex h-6 w-6 items-center justify-center rounded-full sm:h-[26px] sm:w-[26px]"
          style={{ backgroundColor: bg }}
        >
          <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" style={{ color }} strokeWidth={2.2} />
        </span>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Metric data                                                        */
/* ------------------------------------------------------------------ */

const METRICS: Omit<MetricRowProps, "index">[] = [
  {
    icon: Settings2,
    label: "Operations",
    value: 2542,
    trend: 24.5,
    iconBg: "#EDE8FF",
    iconColor: "#7461D5",
  },
  {
    icon: Coins,
    label: "Collections",
    value: 2542,
    trend: 28.4,
    iconBg: "#FFF3C4",
    iconColor: "#A9860F",
    featured: true,
  },
  {
    icon: LifeBuoy,
    label: "Support Resolutions",
    value: 2542,
    trend: -10.2,
    iconBg: "#E8E4FB",
    iconColor: "#6C57C9",
  },
];

/* ------------------------------------------------------------------ */
/*  Section                                                             */
/* ------------------------------------------------------------------ */

export function OperationalLeaders() {
  return (
    <section id="product" className="relative overflow-hidden bg-gradient-to-b from-[#FAFAF8] via-[#FDFDFC] to-white px-5 pb-20 pt-16 scroll-mt-24 sm:pb-24 sm:pt-20 lg:pt-24">
      {/* Faint ambient glows, echoing the hero palette but much softer */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(30% 34% at 90% 6%, rgba(140,123,224,0.10) 0%, rgba(140,123,224,0) 70%), " +
              "radial-gradient(28% 30% at 4% 90%, rgba(255,214,110,0.14) 0%, rgba(255,214,110,0) 70%)",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <motion.h2
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-[520px] text-[32px] font-extrabold leading-[1.05] tracking-[-0.03em] text-[#111217] sm:text-[42px] lg:text-[50px]"
        >
          Created for
          <br />
          Operational <span className="font-serif italic font-medium">Leaders</span>
        </motion.h2>

        <div className="mt-10 grid gap-5 sm:mt-12 lg:grid-cols-2 lg:gap-6">
          {/* ---------------------------------------------------------- */}
          {/* For COOs                                                    */}
          {/* ---------------------------------------------------------- */}
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -4, transition: { duration: 0.3, ease: "easeOut" } }}
            className="group relative overflow-hidden rounded-[26px] border border-black/[0.06] bg-[#FCFCFB] p-5 shadow-[0_24px_60px_-24px_rgba(20,20,30,0.14)] sm:rounded-[28px] sm:p-6"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-8 -z-10 rounded-[36px] bg-gradient-to-br from-[#EFE9FF]/0 via-transparent to-[#FFF3C4]/0 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-70"
            />

            <div className="flex flex-col gap-2.5">
              {METRICS.map((metric, index) => (
                <MetricRow key={metric.label} {...metric} index={index} />
              ))}
            </div>

            <div className="mt-7 sm:mt-8">
              <h3 className="text-[17px] font-bold tracking-[-0.01em] text-[#111217] sm:text-[18px]">
                For COOs
              </h3>
              <p className="mt-2 max-w-[420px] text-[13px] leading-[1.65] text-[#5F6067] sm:text-[14px]">
                Scale operations without scaling headcount. Agents run onboarding,
                collections, and support end-to-end, and keep your unit economics
                under control.
              </p>
            </div>
          </motion.div>

          {/* ---------------------------------------------------------- */}
          {/* For CX Leaders                                              */}
          {/* ---------------------------------------------------------- */}
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            whileHover={{ y: -4, transition: { duration: 0.3, ease: "easeOut" } }}
            className="group relative overflow-hidden rounded-[26px] border border-black/[0.06] bg-[#FCFCFB] p-5 shadow-[0_24px_60px_-24px_rgba(20,20,30,0.14)] sm:rounded-[28px] sm:p-6"
          >
            <div className="relative flex h-[210px] items-center justify-center sm:h-[224px]">
              {/* Ambient glow behind the ring */}
              <div
                aria-hidden="true"
                className="absolute h-[190px] w-[190px] rounded-full bg-gradient-to-br from-[#EFE9FF] via-transparent to-[#FFF3C4] opacity-60 blur-2xl"
              />

              <SlaDonut percent={98} />

              <ChannelBadge
                icon={Mail}
                bg="#FFE7D2"
                color="#D9822B"
                className="left-[6%] top-[8%]"
                floatClassName="hero-float-slow"
                delay={0.15}
              />
              <ChannelBadge
                icon={MessageCircle}
                bg="#DAF3E6"
                color="#249A67"
                className="right-[4%] top-[2%]"
                floatClassName="hero-float"
                delay={0.25}
              />
              <ChannelBadge
                icon={Send}
                bg="#FFE0E8"
                color="#E0537A"
                className="right-[-2%] top-[52%] sm:right-[0%]"
                floatClassName="hero-float-slow"
                delay={0.35}
              />
              <ChannelBadge
                icon={Users}
                bg="#DCEBFF"
                color="#3E7BD9"
                className="bottom-[4%] right-[10%]"
                floatClassName="hero-float"
                delay={0.45}
              />
              <ChannelBadge
                icon={LayoutGrid}
                bg="#FFF3C4"
                color="#A9860F"
                className="bottom-[2%] left-[2%]"
                floatClassName="hero-float-slow"
                delay={0.55}
              />
            </div>

            <div className="mt-2 sm:mt-3">
              <h3 className="text-[17px] font-bold tracking-[-0.01em] text-[#111217] sm:text-[18px]">
                For CX Leaders
              </h3>
              <p className="mt-2 max-w-[420px] text-[13px] leading-[1.65] text-[#5F6067] sm:text-[14px]">
                Reach every customer through their preferred channel, with
                real-time visibility into service quality and resolution.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

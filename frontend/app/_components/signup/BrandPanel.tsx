"use client";

import { useEffect, useState } from "react";
import {
  Bot,
  History,
  Layers,
  MessageSquare,
  RefreshCcw,
  Scale,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { SectionBadge } from "../SectionBadge";
import { BrandLogo } from "../BrandLogo";

const FEATURES = [
  {
    icon: TrendingUp,
    title: "AI Revenue Opportunities",
    description: "Cross-sell, upsell, and drop-off signals — scored and explained.",
    rotate: "-rotate-1",
  },
  {
    icon: MessageSquare,
    title: "Conversational Commerce",
    description: "A shopping agent that ranks products and explains every pick.",
    rotate: "rotate-1",
  },
  {
    icon: RefreshCcw,
    title: "Payment Recovery",
    description: "Failed and stalled payments retried automatically, safely.",
    rotate: "rotate-1",
  },
  {
    icon: Bot,
    title: "Agent-Readable Catalog",
    description: "Your catalog, structured for AI shopping agents to buy from.",
    rotate: "-rotate-1",
  },
];

const TRUST_PILLS = [
  { icon: ShieldCheck, label: "Razorpay Ready" },
  { icon: Layers, label: "Multi-Tenant Secure" },
  { icon: Scale, label: "Policy Controlled AI" },
  { icon: History, label: "Audit Trail Enabled" },
];

export interface StatTileProps {
  label: string;
  value: number;
  format: (value: number) => string;
}

/** Exported so LoginBrandPanel's "sample workspace" preview can reuse the
 * exact same count-up behavior instead of a second implementation. */
export function useCountUp(target: number, durationMs = 1400) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setValue(target);
      return;
    }

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return value;
}

export function StatTile({ label, value, format }: StatTileProps) {
  const animated = useCountUp(value);
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-3">
      <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">{label}</span>
      <span className="font-mono text-lg font-semibold text-white">{format(animated)}</span>
    </div>
  );
}

/**
 * Left storytelling panel for the signup split-layout. Feature cards and
 * the mini dashboard preview are desktop-only (lg:) — real estate a
 * phone screen doesn't have to spare before reaching the actual form —
 * so mobile gets logo, heading, description, and the trust strip, then
 * drops straight into the signup card below it.
 */
export function BrandPanel() {
  return (
    <div className="flex flex-col gap-10">
      <div data-signup-reveal className="flex items-center gap-2.5">
        <BrandLogo className="h-9 w-[80px]" />
        <span className="text-lg font-semibold tracking-tight text-white">PayPilot AI</span>
      </div>

      <div data-signup-reveal>
        <SectionBadge label="AI Growth & Agentic Commerce" />
        <h1 className="mt-4 max-w-md text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Create your <span className="text-gradient-ai">AI commerce</span> workspace.
        </h1>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-zinc-400 sm:text-base">
          Turn your products, payments, and customers into an intelligent revenue
          workspace — built to recover revenue and sell to shopping agents, with every
          action policy-checked and logged.
        </p>
      </div>

      {/* Feature cards — desktop only */}
      <div data-signup-reveal className="hidden gap-3 lg:grid lg:grid-cols-2">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className={`animate-float-slow glass-panel rounded-2xl p-4 transition-transform duration-300 hover:-translate-y-1 ${feature.rotate}`}
          >
            <feature.icon className="h-4 w-4 text-blue-400" strokeWidth={2} />
            <p className="mt-2.5 text-sm font-medium text-white">{feature.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">{feature.description}</p>
          </div>
        ))}
      </div>

      {/* Mini dashboard preview — desktop only, illustrative sample data */}
      <div data-signup-reveal className="glass-panel hidden flex-col gap-3 rounded-2xl p-4 lg:flex">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">Sample workspace</span>
          <span className="flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
            <TrendingUp className="h-3 w-3" />
            +18% this month
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          <StatTile
            label="Revenue Recovered"
            value={428600}
            format={(v) => `₹${v.toLocaleString("en-IN")}`}
          />
          <StatTile label="Orders" value={1284} format={(v) => v.toLocaleString("en-IN")} />
          <StatTile label="AI Opportunities" value={37} format={(v) => v.toLocaleString("en-IN")} />
        </div>
      </div>

      <div data-signup-reveal className="flex flex-wrap gap-2">
        {TRUST_PILLS.map((pill) => (
          <span
            key={pill.label}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-zinc-400 transition-colors duration-200 hover:border-white/20 hover:text-white"
          >
            <pill.icon className="h-3.5 w-3.5" />
            {pill.label}
          </span>
        ))}
      </div>

      <div data-signup-reveal className="flex items-center gap-2 font-mono text-xs text-zinc-600">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
        Built for Agentic Commerce
      </div>
    </div>
  );
}

"use client";

import {
  Activity,
  History,
  Layers,
  Radar,
  RefreshCcw,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { SectionBadge } from "../SectionBadge";
import { BrandLogo } from "../BrandLogo";
import { StatTile } from "../signup/BrandPanel";

const FEATURES = [
  {
    icon: TrendingUp,
    title: "Today's Revenue",
    description: "Live totals the moment you're back at your desk.",
    rotate: "-rotate-1",
  },
  {
    icon: Radar,
    title: "AI Opportunity Found",
    description: "New cross-sell and drop-off signals, scored and ready.",
    rotate: "rotate-1",
  },
  {
    icon: RefreshCcw,
    title: "Payment Recovery Ready",
    description: "Failed payments queued for a safe, automatic retry.",
    rotate: "rotate-1",
  },
  {
    icon: Activity,
    title: "Customer Journey Insight",
    description: "Where shoppers are dropping off, explained in plain terms.",
    rotate: "-rotate-1",
  },
];

const TRUST_PILLS = [
  { icon: ShieldCheck, label: "Secure JWT Authentication" },
  { icon: Layers, label: "Organization Protected" },
  { icon: History, label: "Audit Trail Active" },
  { icon: Wallet, label: "Razorpay Connected" },
];

const ACTIVITY_FEED = [
  { label: "Payment recovered", detail: "₹4,200 · UPI retry", tone: "emerald" as const },
  { label: "AI opportunity flagged", detail: "Cart drop-off · 12 shoppers", tone: "blue" as const },
  { label: "New order placed", detail: "#8841 · ₹1,860", tone: "cyan" as const },
];

const TONE_DOT: Record<(typeof ACTIVITY_FEED)[number]["tone"], string> = {
  emerald: "bg-emerald-400",
  blue: "bg-blue-400",
  cyan: "bg-cyan-400",
};

/**
 * Left storytelling panel for the login split-layout — the returning-
 * merchant counterpart to signup/BrandPanel. Same visual language (glass
 * cards, count-up stat tiles, trust pill strip) but copy and iconography
 * are about coming back to a live workspace rather than creating one, and
 * the sample workspace card adds a small animated activity feed since a
 * returning merchant is here to see what changed since they left.
 */
export function LoginBrandPanel() {
  return (
    <div className="flex flex-col gap-10">
      <div data-login-reveal className="flex items-center gap-2.5">
        <BrandLogo className="h-9 w-[80px]" />
        <span className="text-lg font-semibold tracking-tight text-white">PayPilot AI</span>
      </div>

      <div data-login-reveal>
        <SectionBadge label="Welcome Back" />
        <h1 className="mt-4 max-w-md text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Your <span className="text-gradient-ai">AI commerce workspace</span> is exactly
          where you left it.
        </h1>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-zinc-400 sm:text-base">
          Monitor revenue, recover payments, and act on AI-scored opportunities —
          every action still policy-checked and logged, just as you left it.
        </p>
      </div>

      {/* Feature cards — desktop only */}
      <div data-login-reveal className="hidden gap-3 lg:grid lg:grid-cols-2">
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
      <div data-login-reveal className="glass-panel hidden flex-col gap-4 rounded-2xl p-4 lg:flex">
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

        <div className="flex flex-col gap-1.5 border-t border-white/10 pt-3">
          {ACTIVITY_FEED.map((item) => (
            <div key={item.label} className="flex items-center gap-2.5 text-xs">
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${TONE_DOT[item.tone]}`} />
              <span className="text-zinc-300">{item.label}</span>
              <span className="ml-auto font-mono text-[11px] text-zinc-600">{item.detail}</span>
            </div>
          ))}
        </div>
      </div>

      <div data-login-reveal className="flex flex-wrap gap-2">
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

      <div data-login-reveal className="flex items-center gap-2 font-mono text-xs text-zinc-600">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
        Built for Agentic Commerce
      </div>
    </div>
  );
}

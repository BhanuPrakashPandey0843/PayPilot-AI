"use client";

import { motion } from "motion/react";
import { ArrowRight, Coins, ShoppingCart, TrendingDown, TrendingUp } from "lucide-react";

import type { MockOpportunity, OpportunityType } from "@/lib/mock/opportunities";
import { cn } from "@/lib/utils";

const TYPE_META: Record<OpportunityType, { label: string; icon: typeof TrendingUp; bg: string; color: string }> = {
  CROSS_SELL: { label: "Cross-sell", icon: ShoppingCart, bg: "#EDE8FF", color: "#7461D5" },
  UPSELL: { label: "Upsell", icon: TrendingUp, bg: "#DAF3E6", color: "#249A67" },
  PAYMENT_RECOVERY: { label: "Payment recovery", icon: Coins, bg: "#FFF3C4", color: "#A9860F" },
  ABANDONED_CHECKOUT: { label: "Abandoned checkout", icon: ShoppingCart, bg: "#FFE0E8", color: "#E0537A" },
  REVENUE_DROP: { label: "Revenue drop", icon: TrendingDown, bg: "#FDE8E9", color: "#E14F55" },
};

export function OpportunityCard({
  opportunity,
  selected,
  onSelect,
}: {
  opportunity: MockOpportunity;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const meta = TYPE_META[opportunity.type];
  const Icon = meta.icon;

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        "group relative w-full overflow-hidden rounded-[20px] border p-4 text-left transition-colors sm:p-5",
        selected
          ? "border-[#111217] bg-white shadow-[0_20px_44px_-20px_rgba(20,20,30,0.22)]"
          : "border-black/[0.06] bg-white/80 hover:border-black/[0.12]"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
            style={{ backgroundColor: meta.bg }}
          >
            <Icon className="h-4 w-4" style={{ color: meta.color }} strokeWidth={2} />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8A8B92]">
              {meta.label}
            </p>
            <p className="mt-0.5 text-[13.5px] font-semibold leading-[1.3] text-[#111217]">
              {opportunity.title}
            </p>
          </div>
        </div>

        <span className="shrink-0 rounded-full bg-[#111217] px-2 py-1 text-[10.5px] font-semibold text-white">
          {opportunity.score}
        </span>
      </div>

      <div className="mt-3.5 flex items-center justify-between text-[11.5px] text-[#8A8B92]">
        <span>
          {opportunity.customer} · {opportunity.order}
        </span>
        <span className="font-semibold text-[#111217]">
          +₹{opportunity.estimatedImpact.toLocaleString("en-IN")}
        </span>
      </div>

      <div
        className={cn(
          "mt-3 flex items-center gap-1 text-[11.5px] font-medium text-[#8C7BE0] opacity-0 transition-opacity",
          selected ? "opacity-100" : "group-hover:opacity-100"
        )}
      >
        View reasoning <ArrowRight className="h-3 w-3" strokeWidth: {2} />
      </div>
    </motion.button>
  );
}

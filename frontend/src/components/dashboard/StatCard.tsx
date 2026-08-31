import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/** Compact KPI card used across dashboard overview/analytics/revenue pages. */
export function StatCard({
  label,
  value,
  trend,
  icon: Icon,
}: {
  label: string;
  value: string;
  trend?: number;
  icon?: LucideIcon;
}) {
  return (
    <div className="rounded-[18px] border border-black/[0.06] bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11.5px] text-[#8A8B92]">{label}</p>
        {Icon && <Icon className="h-3.5 w-3.5 text-[#A9AAB1]" strokeWidth={1.75} />}
      </div>
      <p className="mt-1.5 text-[20px] font-bold tracking-[-0.02em] text-[#111217]">{value}</p>
      {trend !== undefined && (
        <p className={cn("mt-1 text-[11px] font-medium", trend >= 0 ? "text-[#1F9D6C]" : "text-[#E14F55]")}>
          {trend >= 0 ? "+" : ""}
          {trend}%
        </p>
      )}
    </div>
  );
}

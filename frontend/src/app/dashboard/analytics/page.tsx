import { DollarSign, ShoppingCart, AlertTriangle, RefreshCw } from "lucide-react";

import { DashboardPageHeader } from "@/components/dashboard/PageHeader";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { MOCK_ANALYTICS_KPIS, MOCK_TOP_PRODUCTS, MOCK_ORDER_STATUS_BREAKDOWN } from "@/lib/mock/analytics";
import { MOCK_REVENUE_TREND } from "@/lib/mock/revenue";

export default function AnalyticsPage() {
  const maxTrend = Math.max(...MOCK_REVENUE_TREND.map((d) => d.value));

  return (
    <div>
      <DashboardPageHeader
        title="Analytics"
        description="Revenue, product and payment performance. Illustrative demo data — not the live backend."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {MOCK_ANALYTICS_KPIS.map((kpi, i) => (
          <StatCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            trend={kpi.trend}
            icon={[DollarSign, ShoppingCart, AlertTriangle, RefreshCw][i]}
          />
        ))}
      </div>

      <div className="mt-8">
        <SectionHeader title="Revenue, last 7 days" />
        <div className="flex h-40 items-end gap-3 rounded-[18px] border border-black/[0.06] bg-white p-5">
          {MOCK_REVENUE_TREND.map((d) => (
            <div key={d.label} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className="w-full rounded-[6px] bg-[#8C7BE0]"
                style={{ height: `${(d.value / maxTrend) * 100}%` }}
              />
              <span className="text-[10.5px] text-[#A9AAB1]">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <div>
          <SectionHeader title="Top products" />
          <div className="overflow-hidden rounded-[16px] border border-black/[0.06] bg-white">
            {MOCK_TOP_PRODUCTS.map((p) => (
              <div key={p.name} className="flex items-center justify-between border-b border-black/[0.04] px-4 py-2.5 text-[12.5px] last:border-0">
                <span className="truncate font-medium text-[#111217]">{p.name}</span>
                <span className="text-[#8A8B92]">₹{p.revenue.toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <SectionHeader title="Order status" />
          <div className="space-y-2 rounded-[16px] border border-black/[0.06] bg-white p-4">
            {MOCK_ORDER_STATUS_BREAKDOWN.map((s) => (
              <div key={s.status} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-[11.5px] font-medium capitalize text-[#5F6067]">{s.status}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/[0.05]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(s.count / MOCK_ORDER_STATUS_BREAKDOWN.reduce((sum, x) => sum + x.count, 0)) * 100}%`,
                      backgroundColor: s.tone,
                    }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right text-[11.5px] text-[#8A8B92]">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import { Package, Users, CreditCard, TrendingUp } from "lucide-react";
import Link from "next/link";

import { DashboardPageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { EmptyState } from "@/components/states/EmptyState";
import { MOCK_ANALYTICS_KPIS } from "@/lib/mock/analytics";
import { MOCK_OPPORTUNITIES } from "@/lib/mock/opportunities";

export default function DashboardOverviewPage() {
  return (
    <div>
      <DashboardPageHeader title="Overview" description="A snapshot of revenue, orders and open opportunities." />

      <SectionHeader title="This month (illustrative demo data)" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {MOCK_ANALYTICS_KPIS.map((kpi, i) => (
          <StatCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            trend={kpi.trend}
            icon={[Package, Users, CreditCard, TrendingUp][i]}
          />
        ))}
      </div>

      <div className="mt-8">
        <SectionHeader
          title="Open revenue opportunities"
          action={
            <Link href="/dashboard/revenue" className="text-[12px] font-medium text-[#111217] underline underline-offset-4">
              View all
            </Link>
          }
        />
        {MOCK_OPPORTUNITIES.length === 0 ? (
          <EmptyState title="No open opportunities" description="Run detection from the Revenue page to surface new ones." />
        ) : (
          <div className="overflow-hidden rounded-[16px] border border-black/[0.06] bg-white">
            {MOCK_OPPORTUNITIES.slice(0, 4).map((opp) => (
              <div
                key={opp.id}
                className="flex items-center justify-between gap-3 border-b border-black/[0.05] px-4 py-3 text-[12.5px] last:border-0"
              >
                <div>
                  <p className="font-medium text-[#111217]">{opp.title}</p>
                  <p className="mt-0.5 text-[11.5px] text-[#8A8B92]">
                    {opp.customer} · {opp.order}
                  </p>
                </div>
                <span className="shrink-0 font-semibold text-[#111217]">
                  +₹{opp.estimatedImpact.toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { LineChart, PieChart, AlertTriangle, Info } from "lucide-react";

import { ProductFeaturePage } from "@/components/marketing/ProductFeaturePage";
import { Section } from "@/components/layout/Section";
import { FadeIn } from "@/components/animations/FadeIn";
import { MOCK_ANALYTICS_KPIS, MOCK_TOP_PRODUCTS } from "@/lib/mock/analytics";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Analytics — PayPilot AI",
  description: "Honest, explainable revenue and payment analytics for merchants — with an admitted proxy metric, not a mislabeled one.",
};

export default function AnalyticsProductPage() {
  return (
    <ProductFeaturePage
      eyebrow="Product · Analytics"
      title="Numbers you can"
      accent="actually trust."
      description="Revenue, product and payment performance — every figure traces to a real query, and where a metric is a proxy (like conversion, without pre-checkout tracking), the API says so explicitly instead of guessing."
      highlights={[
        {
          icon: LineChart,
          title: "Revenue overview",
          body: "Total revenue, order count, payment success rate, average order value and growth — all computed from the same date-range resolver so \"last 7 days\" never drifts between two endpoints.",
        },
        {
          icon: PieChart,
          title: "Product performance",
          body: "Revenue, units sold and average selling price per product, sortable and paginated — the same data the revenue engine's cross-sell and upsell detectors read from.",
        },
        {
          icon: AlertTriangle,
          title: "Payment health",
          body: "Success/failure/pending breakdown, failure reasons, and a recovery-opportunity signal computed from the exact same query the PAYMENT_RECOVERY detector uses — the two numbers can never disagree.",
        },
        {
          icon: Info,
          title: "Honesty built into the API",
          body: "Conversion rate is disclosed as a proxy (paid orders ÷ orders created), not true funnel conversion — because there's no pre-checkout event tracking yet. The response includes a literal note explaining the limitation.",
        },
      ]}
    >
      <Section tone="light">
        <div className="mx-auto max-w-4xl">
          <p className="mb-4 text-center text-[11px] font-medium uppercase tracking-[0.1em] text-[#A9AAB1]">
            Illustrative demo figures
          </p>
          <div className="grid gap-3 sm:grid-cols-4">
            {MOCK_ANALYTICS_KPIS.map((kpi, i) => (
              <FadeIn key={kpi.label} delay={i * 0.05}>
                <div className="rounded-[18px] border border-black/[0.06] bg-white p-4">
                  <p className="text-[11px] text-[#8A8B92]">{kpi.label}</p>
                  <p className="mt-1.5 text-[19px] font-bold tracking-[-0.02em] text-[#111217]">
                    {kpi.value}
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-[11px] font-medium",
                      kpi.trend >= 0 ? "text-[#1F9D6C]" : "text-[#E14F55]"
                    )}
                  >
                    {kpi.trend >= 0 ? "+" : ""}
                    {kpi.trend}%
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>

          <div className="mt-4 overflow-hidden rounded-[18px] border border-black/[0.06] bg-white">
            <div className="grid grid-cols-3 gap-2 border-b border-black/[0.06] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A8B92]">
              <span>Product</span>
              <span className="text-right">Units</span>
              <span className="text-right">Revenue</span>
            </div>
            {MOCK_TOP_PRODUCTS.map((product) => (
              <div
                key={product.name}
                className="grid grid-cols-3 gap-2 border-b border-black/[0.04] px-4 py-2.5 text-[12.5px] text-[#3F424C] last:border-0"
              >
                <span className="truncate font-medium text-[#111217]">{product.name}</span>
                <span className="text-right">{product.units}</span>
                <span className="text-right font-medium">
                  ₹{product.revenue.toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Section>
    </ProductFeaturePage>
  );
}

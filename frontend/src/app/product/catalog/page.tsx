import type { Metadata } from "next";
import { Tags, Search, Boxes, Bot } from "lucide-react";

import { ProductFeaturePage } from "@/components/marketing/ProductFeaturePage";
import { Section } from "@/components/layout/Section";
import { FadeIn } from "@/components/animations/FadeIn";
import { MOCK_PRODUCTS } from "@/lib/mock/products";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Catalog — PayPilot AI",
  description: "One catalog, two shapes: a full merchant view and a stripped, agent-readable view an AI buyer can act on.",
};

export default function CatalogProductPage() {
  return (
    <ProductFeaturePage
      eyebrow="Product · Catalog"
      title="One catalog,"
      accent="two audiences."
      description="Your team gets full CRUD with search, filters and tags. AI buyers get a stripped, machine-friendly shape — structured price and availability, no internal or tenant fields, ever."
      highlights={[
        {
          icon: Boxes,
          title: "Full merchant catalog",
          body: "Search by name/description, filter by category, price range, tags (all must match) and availability, sort by price/name/date — the same filters power both the merchant view and the agent view.",
        },
        {
          icon: Bot,
          title: "Agent-shaped catalog",
          body: "A read-only endpoint reshapes price into { amount, currency, unit } and availability into { available, inventoryQuantity } — defaulting to sellable-only, unlike the merchant view which shows everything.",
        },
        {
          icon: Tags,
          title: "Deterministic recommendations",
          body: "Upsell = same category, strictly higher price. Cross-sell = shares a tag, different category. No ML, no black box — every recommendation ships with its reasons.",
        },
        {
          icon: Search,
          title: "Agent search intent",
          body: "A structured search endpoint accepts the same filter shape a merchant would use — query, category, price bounds, tags, availability — so an AI buyer's request maps cleanly onto real catalog fields.",
        },
      ]}
    >
      <Section tone="light">
        <div className="mx-auto max-w-4xl">
          <p className="mb-4 text-center text-[11px] font-medium uppercase tracking-[0.1em] text-[#A9AAB1]">
            Illustrative catalog sample
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {MOCK_PRODUCTS.map((product, i) => (
              <FadeIn key={product.id} delay={i * 0.05}>
                <div className="flex items-start justify-between gap-3 rounded-[16px] border border-black/[0.06] bg-white p-4">
                  <div>
                    <p className="text-[13.5px] font-semibold text-[#111217]">{product.name}</p>
                    <p className="mt-1 text-[12px] leading-[1.5] text-[#8A8B92]">{product.description}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {product.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-black/[0.05] px-2 py-0.5 text-[10px] font-medium text-[#5F6067]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[13px] font-semibold text-[#111217]">
                      ₹{(product.price / 100).toLocaleString("en-IN")}
                    </p>
                    <p className={cn("mt-1 text-[10.5px] font-medium", product.inventory > 0 ? "text-[#1F9D6C]" : "text-[#E14F55]")}>
                      {product.inventory > 0 ? `${product.inventory} in stock` : "Out of stock"}
                    </p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </Section>
    </ProductFeaturePage>
  );
}

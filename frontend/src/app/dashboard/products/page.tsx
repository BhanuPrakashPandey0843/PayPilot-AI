import Link from "next/link";
import { Plus, Search } from "lucide-react";

import { DashboardPageHeader } from "@/components/dashboard/PageHeader";
import { MOCK_PRODUCTS } from "@/lib/mock/products";
import { cn } from "@/lib/utils";

export default function ProductsPage() {
  return (
    <div>
      <DashboardPageHeader
        title="Products"
        description="Your catalog — search, filter and manage what's sellable."
        action={
          <Link
            href="/dashboard/products/new"
            className="inline-flex h-9 items-center gap-1.5 rounded-[11px] bg-[#111217] px-3.5 text-[13px] font-medium text-white outline-none transition-opacity hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.25} />
            New product
          </Link>
        }
      />

      <div className="mb-4 flex items-center gap-2 rounded-[12px] border border-black/[0.1] bg-white px-3.5 py-2.5">
        <Search className="h-4 w-4 shrink-0 text-[#A9AAB1]" strokeWidth={1.75} />
        <input
          type="search"
          placeholder="Search products…"
          disabled
          className="w-full bg-transparent text-[13px] text-[#111217] outline-none placeholder:text-[#A9AAB1] disabled:cursor-not-allowed"
        />
      </div>

      <div className="overflow-hidden rounded-[16px] border border-black/[0.06] bg-white">
        <div className="grid grid-cols-[1fr_100px_100px_90px] gap-3 border-b border-black/[0.06] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8A8B92]">
          <span>Name</span>
          <span className="text-right">Price</span>
          <span className="text-right">Stock</span>
          <span className="text-right">Status</span>
        </div>
        {MOCK_PRODUCTS.map((product) => (
          <Link
            key={product.id}
            href={`/dashboard/products/${product.id}`}
            className="grid grid-cols-[1fr_100px_100px_90px] gap-3 border-b border-black/[0.04] px-4 py-3 text-[12.5px] text-[#3F424C] transition-colors last:border-0 hover:bg-black/[0.02]"
          >
            <span className="truncate font-medium text-[#111217]">{product.name}</span>
            <span className="text-right">₹{(product.price / 100).toLocaleString("en-IN")}</span>
            <span className="text-right">{product.inventory}</span>
            <span className={cn("text-right font-medium", product.inventory > 0 ? "text-[#1F9D6C]" : "text-[#E14F55]")}>
              {product.inventory > 0 ? "Active" : "Out of stock"}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

import { DashboardBreadcrumbs } from "@/components/dashboard/DashboardBreadcrumbs";
import { DashboardPageHeader } from "@/components/dashboard/PageHeader";
import { AuthField } from "@/components/auth/AuthField";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";

export default function NewProductPage() {
  return (
    <div>
      <DashboardBreadcrumbs items={[{ label: "Products", href: "/dashboard/products" }, { label: "New" }]} />
      <DashboardPageHeader title="New product" description="Add a product to your catalog." />

      {/* UI shell only — not wired to POST /api/v1/products yet. */}
      <form className="max-w-xl space-y-4 rounded-[20px] border border-black/[0.06] bg-white p-6">
        <AuthField id="name" label="Name" placeholder="Trailrunner Mesh Sneaker" />
        <div className="grid grid-cols-2 gap-3">
          <AuthField id="price" label="Price (₹)" type="number" placeholder="4499" />
          <AuthField id="inventory" label="Inventory" type="number" placeholder="128" />
        </div>
        <AuthField id="category" label="Category" placeholder="Footwear" />
        <div>
          <label htmlFor="description" className="text-[12.5px] font-medium text-[#111217]">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            className="mt-1.5 w-full resize-none rounded-[12px] border border-black/[0.1] bg-white px-3.5 py-2.5 text-[13.5px] text-[#111217] outline-none transition-colors placeholder:text-[#A9AAB1] focus:border-[#111217]/30 focus-visible:ring-2 focus-visible:ring-[#111217]/15"
          />
        </div>
        <AuthSubmitButton type="button" className="w-fit px-6">
          Create product
        </AuthSubmitButton>
      </form>
    </div>
  );
}

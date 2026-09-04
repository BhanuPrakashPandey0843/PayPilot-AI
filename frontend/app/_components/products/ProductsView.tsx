"use client";

import { useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useSession } from "@/hooks/useSession";
import { useProductList, useProductCount } from "@/hooks/useProducts";
import { roleHasPermission } from "@/lib/permissions";
import type { Product } from "@/lib/api/products";
import { majorToMinor } from "@/lib/api/products";
import { ProductsHero } from "./ProductsHero";
import { ProductsSummaryCards } from "./ProductsSummaryCards";
import { AiCatalogNote } from "./AiCatalogNote";
import { ProductsToolbar, DEFAULT_PRODUCT_FILTERS, type ProductFilterValues } from "./ProductsToolbar";
import { ProductsTable } from "./ProductsTable";
import { ProductFormModal } from "./ProductFormModal";
import { ProductDetailsModal } from "./ProductDetailsModal";
import { DeleteProductModal } from "./DeleteProductModal";

const PAGE_SIZE = 20;

type ModalState =
  | { kind: "none" }
  | { kind: "create" }
  | { kind: "edit"; product: Product }
  | { kind: "details"; product: Product }
  | { kind: "delete"; product: Product };

/**
 * Products / Catalog (/products) — assembled entirely from the real
 * GET/POST/PATCH/DELETE /products routes (see lib/api/products.ts),
 * same structural pattern as AuditLogsView / RevenueOpportunitiesView:
 * owns filter/pagination/modal state, each section owns its own
 * loading/error/empty rendering.
 *
 * Create/edit/delete controls are hidden (not just disabled) for roles
 * without catalog.create / catalog.update / catalog.delete — the same
 * permissions the backend enforces on those routes — so a read-only
 * role (VIEWER, or SUPPORT which only has catalog.read) never sees a
 * control that would 403.
 */
export function ProductsView() {
  const { session } = useSession();
  const canRead = roleHasPermission(session?.role, "catalog.read");
  const canCreate = roleHasPermission(session?.role, "catalog.create");
  const canUpdate = roleHasPermission(session?.role, "catalog.update");
  const canDelete = roleHasPermission(session?.role, "catalog.delete");

  const [filters, setFilters] = useState<ProductFilterValues>(DEFAULT_PRODUCT_FILTERS);
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<ModalState>({ kind: "none" });
  const [notice, setNotice] = useState<string | null>(null);

  function updateFilters(next: ProductFilterValues) {
    setFilters(next);
    setPage(1);
  }

  const listFilters = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: filters.search.trim() || undefined,
      category: filters.category.trim() || undefined,
      isActive: filters.isActive === "" ? undefined : filters.isActive === "true",
      available: filters.available === "" ? undefined : filters.available === "true",
      minPrice: filters.minPrice.trim() ? majorToMinor(Number(filters.minPrice)) : undefined,
      maxPrice: filters.maxPrice.trim() ? majorToMinor(Number(filters.maxPrice)) : undefined,
      sort: filters.sort,
      order: filters.order,
    }),
    [page, filters]
  );

  const listResult = useProductList(listFilters);
  const totalCount = useProductCount({});
  const activeCount = useProductCount({ isActive: true });
  const inactiveCount = useProductCount({ isActive: false });
  const outOfStockCount = useProductCount({ available: false });

  function refetchAll() {
    listResult.refetch();
    totalCount.refetch();
    activeCount.refetch();
    inactiveCount.refetch();
    outOfStockCount.refetch();
  }

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice((current) => (current === message ? null : current)), 4000);
  }

  const hasActiveFilters = Boolean(
    filters.search ||
      filters.isActive ||
      filters.available ||
      filters.category ||
      filters.minPrice ||
      filters.maxPrice
  );

  // Placed after every hook above (never before) so hooks still run
  // unconditionally on every render — only the returned JSX branches.
  // Same pattern and copy shape as CustomersView's canRead guard: a role
  // without catalog.read (e.g. FINANCE, which has no catalog.* permission
  // at all) gets a clean blocked-access screen instead of the list +
  // 4 count requests all firing and failing with a 403.
  if (session && !canRead) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
        <p className="text-sm font-medium text-zinc-200">You don&apos;t have access to Products</p>
        <p className="max-w-xs text-xs text-zinc-500">
          Ask an organization admin to grant you the catalog.read permission.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <ProductsHero
        organizationName={session?.organization.name ?? "your workspace"}
        totalProducts={totalCount}
        canCreate={canCreate}
        onAddProduct={() => setModal({ kind: "create" })}
      />

      <ProductsSummaryCards
        totalProducts={totalCount}
        activeProducts={activeCount}
        outOfStockProducts={outOfStockCount}
        inactiveProducts={inactiveCount}
      />

      <AiCatalogNote />

      {notice && (
        <div className="flex items-center gap-2 rounded-2xl border border-[var(--accent-emerald)]/25 bg-[var(--accent-emerald)]/[0.06] p-3.5 text-sm text-[var(--accent-emerald)]">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> {notice}
        </div>
      )}

      <ProductsToolbar
        value={filters}
        onChange={updateFilters}
        onRefresh={refetchAll}
        isRefreshing={listResult.isLoading}
      />

      <ProductsTable
        result={listResult}
        page={page}
        onPageChange={setPage}
        canUpdate={canUpdate}
        canDelete={canDelete}
        canCreate={canCreate}
        hasActiveFilters={hasActiveFilters}
        onView={(product) => setModal({ kind: "details", product })}
        onEdit={(product) => setModal({ kind: "edit", product })}
        onDelete={(product) => setModal({ kind: "delete", product })}
        onAddProduct={() => setModal({ kind: "create" })}
      />

      {(modal.kind === "create" || modal.kind === "edit") && (
        <ProductFormModal
          mode={modal.kind}
          product={modal.kind === "edit" ? modal.product : undefined}
          onClose={() => setModal({ kind: "none" })}
          onSaved={(product, mode) => {
            setModal({ kind: "none" });
            refetchAll();
            showNotice(mode === "create" ? `"${product.name}" was added to your catalog.` : `"${product.name}" was updated.`);
          }}
        />
      )}

      {modal.kind === "details" && (
        <ProductDetailsModal
          product={modal.product}
          canUpdate={canUpdate}
          canDelete={canDelete}
          onClose={() => setModal({ kind: "none" })}
          onEdit={() => setModal({ kind: "edit", product: modal.product })}
          onDelete={() => setModal({ kind: "delete", product: modal.product })}
        />
      )}

      {modal.kind === "delete" && (
        <DeleteProductModal
          product={modal.product}
          onClose={() => setModal({ kind: "none" })}
          onDeleted={() => {
            const name = modal.kind === "delete" ? modal.product.name : "Product";
            setModal({ kind: "none" });
            refetchAll();
            showNotice(`"${name}" was deleted.`);
          }}
        />
      )}
    </div>
  );
}

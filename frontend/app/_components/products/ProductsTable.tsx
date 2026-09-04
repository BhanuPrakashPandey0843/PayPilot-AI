"use client";

import { Package, Eye, Pencil, Trash2, ChevronLeft, ChevronRight, PlusCircle, FilterX } from "lucide-react";
import type { UseApiResourceResult } from "@/hooks/useApiResource";
import type { Product, ProductListResult } from "@/lib/api/products";
import { formatMoney, relativeTime } from "../dashboard/home/formatters";
import { ErrorNote } from "../dashboard/home/Skeletons";
import { getProductStatus, isAiCatalogReady } from "./productMeta";

interface ProductsTableProps {
  result: UseApiResourceResult<ProductListResult>;
  page: number;
  onPageChange: (page: number) => void;
  canUpdate: boolean;
  canDelete: boolean;
  canCreate: boolean;
  hasActiveFilters: boolean;
  onView: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onAddProduct: () => void;
}

function StatusBadge({ product }: { product: Product }) {
  const meta = getProductStatus(product);
  const Icon = meta.icon;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ background: `color-mix(in srgb, ${meta.color} 16%, transparent)`, color: meta.color }}
    >
      <Icon className="h-3 w-3" /> {meta.label}
    </span>
  );
}

function AiReadyBadge({ product }: { product: Product }) {
  if (!isAiCatalogReady(product)) return null;
  return (
    <span
      title="Discoverable by PayPilot's commerce agent"
      className="inline-flex items-center gap-1 rounded-full border border-[var(--accent-violet)]/30 bg-[var(--accent-violet)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--accent-violet)]"
    >
      AI-ready
    </span>
  );
}

function Thumbnail({ product }: { product: Product }) {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[var(--accent-violet)]/15 via-white/[0.02] to-[var(--accent-cyan)]/10">
      {product.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
      ) : (
        <Package className="h-4 w-4 text-zinc-600" />
      )}
    </div>
  );
}

function RowActions({
  product,
  canUpdate,
  canDelete,
  onView,
  onEdit,
  onDelete,
}: {
  product: Product;
  canUpdate: boolean;
  canDelete: boolean;
  onView: (p: Product) => void;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        onClick={() => onView(product)}
        aria-label="View details"
        title="View details"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white"
      >
        <Eye className="h-3.5 w-3.5" />
      </button>
      {canUpdate && (
        <button
          type="button"
          onClick={() => onEdit(product)}
          aria-label="Edit product"
          title="Edit product"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}
      {canDelete && (
        <button
          type="button"
          onClick={() => onDelete(product)}
          aria-label="Delete product"
          title="Delete product"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-[var(--accent-rose)]/10 hover:text-[var(--accent-rose)]"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

/**
 * Full searchable/filterable/paginated products table. Desktop renders
 * a real <table>; below `sm` it switches to a stacked card list instead
 * of letting the table overflow (same responsive pattern the brief
 * calls for). Every row comes straight from GET /products — no
 * client-side filtering of a fetched page and no invented columns.
 */
export function ProductsTable({
  result,
  page,
  onPageChange,
  canUpdate,
  canDelete,
  canCreate,
  hasActiveFilters,
  onView,
  onEdit,
  onDelete,
  onAddProduct,
}: ProductsTableProps) {
  const rows = result.data?.rows ?? [];
  const pageMeta = result.data?.meta;
  const isEmpty = !result.isLoading && !result.error && rows.length === 0;

  return (
    <div className="rounded-3xl border border-[var(--border-subtle)] bg-white/[0.02] p-6">
      <p className="text-sm font-medium text-white">All products</p>

      {result.error && (
        <div className="mt-4">
          <ErrorNote message={result.error} onRetry={result.refetch} />
        </div>
      )}

      {!result.error && result.isLoading && (
        <div className="mt-4 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-shimmer h-14 w-full rounded-xl bg-white/[0.03]" />
          ))}
        </div>
      )}

      {isEmpty && !hasActiveFilters && (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--border-subtle)] py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04]">
            <Package className="h-5 w-5 text-zinc-500" />
          </span>
          <div>
            <p className="text-sm font-medium text-zinc-200">Your catalog is empty</p>
            <p className="mt-1 max-w-sm text-xs text-zinc-500">
              Add your first product to start selling through PayPilot — and make it discoverable to AI buyers.
            </p>
          </div>
          {canCreate && (
            <button
              type="button"
              onClick={onAddProduct}
              className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-cyan)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              <PlusCircle className="h-4 w-4" /> Add Product
            </button>
          )}
        </div>
      )}

      {isEmpty && hasActiveFilters && (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--border-subtle)] py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04]">
            <FilterX className="h-5 w-5 text-zinc-500" />
          </span>
          <div>
            <p className="text-sm font-medium text-zinc-200">No products match these filters</p>
            <p className="mt-1 max-w-sm text-xs text-zinc-500">
              Try a different search term, or clear filters to see your full catalog.
            </p>
          </div>
        </div>
      )}

      {!result.isLoading && !result.error && rows.length > 0 && (
        <>
          {/* Desktop table */}
          <div className="mt-4 hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] text-xs uppercase tracking-wide text-zinc-500">
                  <th className="py-2 pr-4 font-medium">Product</th>
                  <th className="py-2 pr-4 font-medium">Price</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Category / Tags</th>
                  <th className="py-2 pr-4 font-medium">Updated</th>
                  <th className="py-2 pr-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((product) => (
                  <tr
                    key={product.id}
                    className="cursor-pointer border-b border-[var(--border-subtle)]/60 transition-colors hover:bg-white/[0.03]"
                    onClick={() => onView(product)}
                  >
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <Thumbnail product={product} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white" title={product.name}>
                            {product.name}
                          </p>
                          {product.description && (
                            <p className="truncate text-xs text-zinc-500" title={product.description}>
                              {product.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-zinc-200">{formatMoney(product.price, product.currency)}</td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <StatusBadge product={product} />
                        <AiReadyBadge product={product} />
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-zinc-400">
                      {product.category ? <span className="text-zinc-300">{product.category}</span> : "—"}
                      {product.tags.length > 0 && (
                        <span className="ml-1.5 text-zinc-600">
                          · {product.tags.slice(0, 2).join(", ")}
                          {product.tags.length > 2 ? ` +${product.tags.length - 2}` : ""}
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-zinc-500">{relativeTime(product.updatedAt)}</td>
                    <td className="py-3 pr-2" onClick={(e) => e.stopPropagation()}>
                      <RowActions
                        product={product}
                        canUpdate={canUpdate}
                        canDelete={canDelete}
                        onView={onView}
                        onEdit={onEdit}
                        onDelete={onDelete}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="mt-4 flex flex-col gap-3 sm:hidden">
            {rows.map((product) => (
              <div
                key={product.id}
                onClick={() => onView(product)}
                className="cursor-pointer rounded-2xl border border-[var(--border-subtle)] bg-white/[0.015] p-4"
              >
                <div className="flex items-start gap-3">
                  <Thumbnail product={product} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{product.name}</p>
                    <p className="mt-0.5 text-sm text-zinc-200">{formatMoney(product.price, product.currency)}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <StatusBadge product={product} />
                      <AiReadyBadge product={product} />
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <RowActions
                      product={product}
                      canUpdate={canUpdate}
                      canDelete={canDelete}
                      onView={onView}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-[var(--border-subtle)] pt-2 text-[11px] text-zinc-500">
                  <span>{product.category ?? "Uncategorized"}</span>
                  <span>Updated {relativeTime(product.updatedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {pageMeta && pageMeta.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
          <span>
            Page {pageMeta.page} of {pageMeta.totalPages} · {pageMeta.total} products
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] px-2.5 py-1.5 font-medium text-zinc-300 hover:border-[var(--border-strong)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </button>
            <button
              type="button"
              disabled={page >= pageMeta.totalPages}
              onClick={() => onPageChange(page + 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] px-2.5 py-1.5 font-medium text-zinc-300 hover:border-[var(--border-strong)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

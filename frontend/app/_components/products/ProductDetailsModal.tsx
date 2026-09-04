"use client";

import { X, Package, Pencil, Trash2, Bot, Sparkles } from "lucide-react";
import type { Product } from "@/lib/api/products";
import { formatMoney } from "../dashboard/home/formatters";
import { getProductStatus, isAiCatalogReady } from "./productMeta";

interface ProductDetailsModalProps {
  product: Product;
  canUpdate: boolean;
  canDelete: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Read-only detail view for a single product — everything
 * GET /products/:id actually returns, formatted for a merchant rather
 * than dumped as raw JSON. Includes the AI catalog readiness indicator
 * (see productMeta.ts's isAiCatalogReady, mirroring GET /agent/catalog's
 * real filter) since the brief calls out this connection specifically.
 */
export function ProductDetailsModal({ product, canUpdate, canDelete, onClose, onEdit, onDelete }: ProductDetailsModalProps) {
  const statusMeta = getProductStatus(product);
  const StatusIcon = statusMeta.icon;
  const aiReady = isAiCatalogReady(product);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="glass-panel relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-[var(--border-subtle)] bg-[var(--background-elevated)] p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-zinc-500 hover:bg-white/5 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--accent-violet)]/15 via-white/[0.02] to-[var(--accent-cyan)]/10">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <Package className="h-6 w-6 text-zinc-600" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Product details</p>
            <h2 className="mt-0.5 truncate text-lg font-semibold text-white">{product.name}</h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                style={{ background: `color-mix(in srgb, ${statusMeta.color} 16%, transparent)`, color: statusMeta.color }}
              >
                <StatusIcon className="h-3 w-3" /> {statusMeta.label}
              </span>
              {aiReady && (
                <span className="inline-flex items-center gap-1 rounded-full border border-[var(--accent-violet)]/30 bg-[var(--accent-violet)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--accent-violet)]">
                  AI-ready
                </span>
              )}
            </div>
          </div>
        </div>

        {product.description && <p className="mt-4 text-sm text-zinc-400">{product.description}</p>}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <DetailCard label="Price" value={formatMoney(product.price, product.currency)} />
          <DetailCard label="Inventory" value={`${product.inventoryQuantity} unit${product.inventoryQuantity === 1 ? "" : "s"}`} />
          <DetailCard label="Category" value={product.category ?? "Uncategorized"} />
          <DetailCard label="Currency" value={product.currency} />
        </div>

        {product.tags.length > 0 && (
          <div className="mt-4">
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {product.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-[var(--border-subtle)] px-2 py-0.5 text-[11px] text-zinc-400">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-[var(--border-subtle)] bg-white/[0.02] p-3.5">
          <Bot className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-violet)]" />
          <p className="text-xs text-zinc-400">
            {aiReady ? (
              <>
                <span className="text-[var(--accent-violet)]">Discoverable now</span> — this product is active and
                in stock, so PayPilot&apos;s commerce agent can recommend and sell it. <Sparkles className="inline h-3 w-3" />
              </>
            ) : (
              <>
                Not currently discoverable by the AI buyer catalog — it requires the product to be{" "}
                <span className="text-zinc-300">active</span> and <span className="text-zinc-300">in stock</span>.
              </>
            )}
          </p>
        </div>

        <div className="mt-5 grid gap-3 border-t border-[var(--border-subtle)] pt-4 text-xs text-zinc-500 sm:grid-cols-2">
          <Detail label="Product ID" value={product.id} mono />
          <Detail label="Slug" value={product.slug} mono />
          <Detail label="Created" value={new Date(product.createdAt).toLocaleString("en-IN")} />
          <Detail label="Last updated" value={new Date(product.updatedAt).toLocaleString("en-IN")} />
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--border-subtle)] px-4 py-2 text-sm font-medium text-zinc-300 hover:border-[var(--border-strong)] hover:text-white"
          >
            Close
          </button>
          {canDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--accent-rose)]/30 px-4 py-2 text-sm font-medium text-[var(--accent-rose)] hover:bg-[var(--accent-rose)]/10"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          )}
          {canUpdate && (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-cyan)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-white/[0.02] p-3">
      <p className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-zinc-200">{value}</p>
    </div>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</p>
      <p className={`mt-0.5 break-all text-zinc-300 ${mono ? "font-mono text-[11px]" : ""}`}>{value}</p>
    </div>
  );
}

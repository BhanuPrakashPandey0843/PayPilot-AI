"use client";

import { useState } from "react";
import { X, Trash2, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { deleteProduct, type Product } from "@/lib/api/products";

interface DeleteProductModalProps {
  product: Product;
  onClose: () => void;
  /** Called once the backend confirms the delete, so the parent can
   * refetch the list and show success feedback. */
  onDeleted: (id: string) => void;
}

type ModalState = { phase: "confirm" } | { phase: "deleting" } | { phase: "error"; message: string } | { phase: "done" };

/**
 * Confirmation UI before DELETE /products/:id actually runs. Never
 * removes the row from the list optimistically — onDeleted() is only
 * called once the backend has confirmed, same "never assume success"
 * pattern as ExecuteConfirmModal.
 */
export function DeleteProductModal({ product, onClose, onDeleted }: DeleteProductModalProps) {
  const [state, setState] = useState<ModalState>({ phase: "confirm" });
  const isBusy = state.phase === "deleting";

  async function handleConfirm() {
    setState({ phase: "deleting" });
    try {
      const result = await deleteProduct(product.id);
      setState({ phase: "done" });
      onDeleted(result.id);
    } catch (err) {
      setState({
        phase: "error",
        message: err instanceof ApiError ? err.message : "Could not delete this product. Please try again.",
      });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={isBusy ? undefined : onClose} />
      <div className="glass-panel relative w-full max-w-md rounded-3xl border border-[var(--border-subtle)] bg-[var(--background-elevated)] p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          disabled={isBusy}
          className="absolute right-4 top-4 rounded-lg p-1 text-zinc-500 hover:bg-white/5 hover:text-white disabled:opacity-40"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-rose)]/12">
            <Trash2 className="h-5 w-5 text-[var(--accent-rose)]" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Delete product</p>
            <h2 className="mt-0.5 truncate text-lg font-semibold text-white">{product.name}</h2>
          </div>
        </div>

        {state.phase === "confirm" && (
          <div className="mt-5 space-y-4">
            <div className="flex items-start gap-2 rounded-2xl border border-[var(--accent-amber)]/25 bg-[var(--accent-amber)]/[0.06] p-4 text-xs text-[var(--accent-amber)]">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                This permanently removes &quot;{product.name}&quot; from your catalog and from PayPilot&apos;s AI
                buyer catalog. This can&apos;t be undone.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-[var(--border-subtle)] px-4 py-2 text-sm font-medium text-zinc-300 hover:border-[var(--border-strong)] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent-rose)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                <Trash2 className="h-4 w-4" /> Delete product
              </button>
            </div>
          </div>
        )}

        {state.phase === "deleting" && (
          <div className="mt-6 flex flex-col items-center gap-3 py-6 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--accent-rose)]" />
            <p className="text-sm text-zinc-300">Deleting…</p>
          </div>
        )}

        {state.phase === "error" && (
          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-[var(--accent-rose)]/25 bg-[var(--accent-rose)]/[0.06] p-4 text-sm text-[var(--accent-rose)]">
              {state.message}
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-[var(--border-subtle)] px-4 py-2 text-sm font-medium text-zinc-300 hover:border-[var(--border-strong)] hover:text-white"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="rounded-xl bg-[var(--accent-rose)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {state.phase === "done" && (
          <div className="mt-5 space-y-3">
            <div className="flex items-start gap-2 rounded-2xl border border-[var(--accent-emerald)]/25 bg-[var(--accent-emerald)]/[0.06] p-4">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-emerald)]" />
              <p className="text-sm font-medium text-[var(--accent-emerald)]">Product deleted</p>
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-[var(--border-subtle)] px-4 py-2 text-sm font-medium text-zinc-300 hover:border-[var(--border-strong)] hover:text-white"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

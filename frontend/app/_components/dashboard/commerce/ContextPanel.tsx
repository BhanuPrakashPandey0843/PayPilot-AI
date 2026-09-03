"use client";

import { useEffect, useState } from "react";
import { Brain, ShoppingCart, Tag, Wallet, Trash2, Receipt, User2 } from "lucide-react";
import { getCommerceSession, type CartItem, type CommerceIntent, type SessionSummary } from "@/lib/api/commerce";
import { useOrderPreview } from "@/hooks/useOrderPreview";
import { formatMoney } from "../home/formatters";
import { CustomerPicker } from "./CustomerPicker";
import { PaymentRecoveryCard } from "./PaymentRecoveryCard";

const INTENT_LABELS: Record<string, string> = {
  PRODUCT_SEARCH: "Searching products",
  PRODUCT_COMPARE: "Comparing products",
  PRODUCT_DETAILS: "Viewing details",
  ADD_TO_CART: "Adding to cart",
  REMOVE_FROM_CART: "Removing from cart",
  ORDER_PREVIEW: "Reviewing order",
  UNKNOWN: "Idle",
};

interface ContextPanelProps {
  sessionId: string;
  cart: CartItem[];
  lastIntent?: CommerceIntent;
  version: number;
  selectedCustomerId: string | null;
  onSelectCustomer: (id: string, name: string) => void;
  onClearMemory: () => void;
  onRequestOrderPreview: () => void;
  role: string | undefined;
}

export function ContextPanel({
  sessionId,
  cart,
  lastIntent,
  version,
  selectedCustomerId,
  onSelectCustomer,
  onClearMemory,
  onRequestOrderPreview,
  role,
}: ContextPanelProps) {
  const [session, setSession] = useState<SessionSummary | null>(null);
  const { preview, isLoading: previewLoading } = useOrderPreview(sessionId, cart);

  useEffect(() => {
    let cancelled = false;
    getCommerceSession(sessionId)
      .then((s) => {
        if (!cancelled) setSession(s);
      })
      .catch(() => {
        /* best-effort context refresh — chat still works without it */
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, version]);

  const filters = session?.lastFilters;
  const hasFilters =
    filters && (filters.category || filters.maxPrice || filters.minPrice || (filters.tags && filters.tags.length > 0) || filters.color);

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-1">
      {/* Current intent */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-white/[0.02] p-4">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500">
          <Brain className="h-3.5 w-3.5" /> AI Confidence
        </p>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-emerald)]" />
          <p className="text-sm text-white">{INTENT_LABELS[lastIntent ?? "UNKNOWN"]}</p>
        </div>
        <p className="mt-1 text-[11px] text-zinc-500">
          Deterministic, rule-based intent detection — every classification traces back to a plain-text pattern, never a black box.
        </p>
      </div>

      {/* Detected filters */}
      {hasFilters && (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-white/[0.02] p-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500">
            <Tag className="h-3.5 w-3.5" /> Detected filters
          </p>
          <div className="flex flex-wrap gap-1.5">
            {filters?.category && (
              <span className="rounded-full border border-[var(--border-subtle)] px-2 py-1 text-[11px] text-zinc-300">{filters.category}</span>
            )}
            {filters?.maxPrice !== undefined && (
              <span className="rounded-full border border-[var(--border-subtle)] px-2 py-1 text-[11px] text-zinc-300">
                Under {formatMoney(filters.maxPrice)}
              </span>
            )}
            {filters?.minPrice !== undefined && (
              <span className="rounded-full border border-[var(--border-subtle)] px-2 py-1 text-[11px] text-zinc-300">
                Over {formatMoney(filters.minPrice)}
              </span>
            )}
            {filters?.color && (
              <span className="rounded-full border border-[var(--border-subtle)] px-2 py-1 text-[11px] text-zinc-300">{filters.color}</span>
            )}
            {filters?.tags?.map((tag) => (
              <span key={tag} className="rounded-full border border-[var(--border-subtle)] px-2 py-1 text-[11px] text-zinc-300">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Cart summary */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-white/[0.02] p-4">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500">
          <ShoppingCart className="h-3.5 w-3.5" /> Cart summary
        </p>
        {cart.length === 0 ? (
          <p className="text-xs text-zinc-500">Your cart is empty. Ask the assistant to add something.</p>
        ) : previewLoading && !preview ? (
          <div className="h-16 animate-shimmer rounded-xl" />
        ) : preview ? (
          <div className="space-y-1.5">
            {preview.items.map((item) => (
              <div key={item.productId} className="flex items-center justify-between text-xs">
                <span className="truncate text-zinc-300">
                  {item.name} × {item.quantity}
                </span>
                <span className="text-zinc-400">{formatMoney(item.totalAmount, preview.currency)}</span>
              </div>
            ))}
            <div className="mt-1.5 flex items-center justify-between border-t border-[var(--border-subtle)] pt-1.5 text-sm font-medium text-white">
              <span>Total</span>
              <span>{formatMoney(preview.total, preview.currency)}</span>
            </div>
            <button
              type="button"
              onClick={onRequestOrderPreview}
              className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--border-subtle)] px-3 py-1.5 text-[11px] text-zinc-300 transition-colors hover:border-[var(--border-strong)] hover:text-white"
            >
              <Receipt className="h-3.5 w-3.5" /> Review full order preview
            </button>
          </div>
        ) : (
          <p className="text-xs text-zinc-500">Cart can&apos;t be priced right now — see policy notes in chat.</p>
        )}
      </div>

      {/* Customer selector for checkout */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-white/[0.02] p-4">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500">
          <User2 className="h-3.5 w-3.5" /> Buyer
        </p>
        <p className="mb-2 text-[11px] text-zinc-500">Checkout is tied to a real customer record — select who&apos;s buying.</p>
        <CustomerPicker selectedCustomerId={selectedCustomerId} onSelect={onSelectCustomer} />
      </div>

      {/* Payment recovery (real revenue opportunity) */}
      <PaymentRecoveryCard role={role} />

      {/* Remembered preferences / memory */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-white/[0.02] p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500">
            <Wallet className="h-3.5 w-3.5" /> Conversation memory
          </p>
          <button
            type="button"
            onClick={onClearMemory}
            className="inline-flex items-center gap-1 text-[10px] text-zinc-500 hover:text-[var(--accent-rose)]"
          >
            <Trash2 className="h-3 w-3" /> Clear
          </button>
        </div>
        <p className="text-[11px] text-zinc-500">
          {session ? (
            <>
              Session <span className="text-zinc-400">{session.sessionId.slice(0, 18)}…</span> · expires 30 min after the last message.
            </>
          ) : (
            "Nothing remembered yet — start a conversation."
          )}
        </p>
        {(session?.recentSearchProductIds.length ?? 0) > 0 && (
          <p className="mt-1 text-[11px] text-zinc-500">{session?.recentSearchProductIds.length} product(s) in recent search context.</p>
        )}
      </div>
    </div>
  );
}

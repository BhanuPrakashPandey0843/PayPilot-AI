"use client";

import { Receipt, ShieldCheck, Lock } from "lucide-react";
import type { OrderPreview, PolicyResult } from "@/lib/api/commerce";
import { formatMoney } from "../home/formatters";
import { PolicyChecklist } from "./PolicyChecklist";

interface OrderPreviewWidgetProps {
  preview?: OrderPreview;
  policy?: PolicyResult;
  onCheckout?: () => void;
  checkoutDisabledReason?: string;
  isCheckingOut?: boolean;
}

/**
 * Renders POST /commerce/order-preview's output exactly — a QUOTE, not
 * an order (order-preview.service.ts never writes to `orders`/
 * `order_items`, and PLACEHOLDER_TAX_RATE/PLACEHOLDER_SHIPPING_AMOUNT
 * are shown as-is rather than hidden, per that module's own doc
 * comment about never silently hiding a placeholder).
 */
export function OrderPreviewWidget({
  preview,
  policy,
  onCheckout,
  checkoutDisabledReason,
  isCheckingOut,
}: OrderPreviewWidgetProps) {
  if (!preview) {
    return (
      <div className="rounded-2xl border border-[var(--accent-rose)]/25 bg-[var(--accent-rose)]/[0.05] p-4">
        <p className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--accent-rose)]">
          <ShieldCheck className="h-4 w-4" /> Can&apos;t build an order preview yet
        </p>
        {policy && <PolicyChecklist policy={policy} />}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-white/[0.02]">
      <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] px-4 py-3">
        <Receipt className="h-4 w-4 text-[var(--accent-cyan)]" />
        <p className="text-sm font-medium text-white">Order Preview</p>
      </div>

      <div className="space-y-2 px-4 py-3">
        {preview.items.map((item) => (
          <div key={item.productId} className="flex items-center justify-between text-sm">
            <span className="text-zinc-300">
              {item.name} <span className="text-zinc-500">× {item.quantity}</span>
            </span>
            <span className="text-zinc-200">{formatMoney(item.totalAmount, preview.currency)}</span>
          </div>
        ))}
      </div>

      <div className="space-y-1.5 border-t border-[var(--border-subtle)] px-4 py-3 text-sm">
        <div className="flex items-center justify-between text-zinc-400">
          <span>Subtotal</span>
          <span>{formatMoney(preview.subtotal, preview.currency)}</span>
        </div>
        <div className="flex items-center justify-between text-zinc-400">
          <span>Tax</span>
          <span>{formatMoney(preview.tax, preview.currency)}</span>
        </div>
        <div className="flex items-center justify-between text-zinc-400">
          <span>Shipping</span>
          <span>{preview.shipping === 0 ? "Free" : formatMoney(preview.shipping, preview.currency)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between border-t border-[var(--border-subtle)] pt-2 text-base font-semibold text-white">
          <span>Total</span>
          <span>{formatMoney(preview.total, preview.currency)}</span>
        </div>
      </div>

      {policy && policy.checks.some((c) => c.status !== "PASS") && (
        <div className="border-t border-[var(--border-subtle)] px-4 py-3">
          <PolicyChecklist policy={policy} />
        </div>
      )}

      {onCheckout && (
        <div className="border-t border-[var(--border-subtle)] px-4 py-3">
          <button
            type="button"
            onClick={onCheckout}
            disabled={Boolean(checkoutDisabledReason) || isCheckingOut}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-cyan)] px-4 py-2.5 text-sm font-medium text-white transition-opacity disabled:opacity-40"
          >
            <Lock className="h-4 w-4" />
            {isCheckingOut ? "Starting secure checkout…" : "Secure Checkout with Razorpay"}
          </button>
          {checkoutDisabledReason && <p className="mt-1.5 text-center text-[11px] text-zinc-500">{checkoutDisabledReason}</p>}
        </div>
      )}
    </div>
  );
}

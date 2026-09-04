"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  Copy,
  CreditCard,
  Loader2,
  Receipt,
  ShoppingCart,
  X,
} from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { getPayment, type PaymentRecord } from "@/lib/api/payments";
import { formatMoney } from "../dashboard/home/formatters";
import { PAYMENT_STATUS_META } from "./paymentMeta";

interface PaymentDetailModalProps {
  paymentId: string;
  /** The row already on screen — shown immediately while the fresh
   * GET /payments/:id response loads behind it, so opening details never
   * flashes empty. Same pattern as OrderDetailModal / ProductDetailsModal. */
  initialPayment: PaymentRecord;
  onClose: () => void;
}

function DetailCard({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-white/[0.02] p-3">
      <p className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</p>
      <p
        className={`mt-0.5 truncate text-sm font-medium text-zinc-200 ${mono ? "font-mono text-[11px]" : ""}`}
        title={value}
      >
        {value}
      </p>
    </div>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--border-subtle)]/60 py-1.5 last:border-0">
      <span className="text-zinc-500">{label}</span>
      <span
        className={`truncate text-zinc-300 ${mono ? "font-mono text-[11px]" : ""}`}
        title={value}
      >
        {value}
      </span>
    </div>
  );
}

function CopyIdButton({ id, label }: { id: string; label: string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Convenience-only — no-op if clipboard access is unavailable.
    }
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-zinc-500 transition-colors hover:bg-white/5 hover:text-white"
      title={`Copy ${label}`}
      aria-label={`Copy ${label}`}
    >
      {copied ? <Check className="h-3 w-3 text-[var(--accent-emerald)]" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

/**
 * Payment detail modal. Shows only fields the real GET /payments/:id
 * endpoint actually returns — no invented fields like card brand, last
 * four, customer location, refund amount, fee, net revenue, settlement
 * status, or fraud score (none of which exist on the backend schema).
 *
 * The order relationship is shown as a copyable UUID, NOT a navigable
 * link — currently there is no GET /orders/:id route that accepts a raw
 * UUID and returns orderNumber, and no route that would render an order
 * detail page from a UUID query param. Clicking to /orders with a UUID
 * as a search term also would not work since the orders search matches
 * orderNumber/customer name/email only, not raw UUIDs. Keeping the
 * orderId as a copyable reference is honest and does not fake navigation
 * that would silently fail.
 *
 * No actions (refund, retry, cancel) are exposed here — the backend has
 * no such endpoints. The only available operations are view + copy IDs.
 */
export function PaymentDetailModal({ paymentId, initialPayment, onClose }: PaymentDetailModalProps) {
  const [detail, setDetail] = useState<PaymentRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    getPayment(paymentId)
      .then((fresh) => {
        if (cancelled) return;
        setDetail(fresh);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Couldn't load this payment's details.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [paymentId]);

  const payment = detail ?? initialPayment;
  const statusMeta = PAYMENT_STATUS_META[payment.status];
  const StatusIcon = statusMeta.icon;
  const providerLabel = payment.provider === "razorpay" ? "Razorpay" : payment.provider;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="payment-detail-title">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="glass-panel relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl border border-[var(--border-subtle)] bg-[var(--background-elevated)] shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between border-b border-[var(--border-subtle)] p-6">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-gradient-to-br from-[var(--accent-emerald)]/15 via-white/[0.02] to-[var(--accent-violet)]/10">
              <CreditCard className="h-6 w-6 text-zinc-300" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Payment details</p>
              <h2 id="payment-detail-title" className="mt-0.5 flex items-center gap-1 truncate text-lg font-semibold text-white">
                <span className="font-mono text-sm text-zinc-400">PAY</span>
                <span className="font-mono text-sm">{payment.id.slice(0, 8)}…{payment.id.slice(-6)}</span>
                <CopyIdButton id={payment.id} label="payment ID" />
              </h2>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                  style={{
                    background: `color-mix(in srgb, ${statusMeta.color} 16%, transparent)`,
                    color: statusMeta.color,
                  }}
                >
                  <StatusIcon className="h-3 w-3" aria-hidden="true" /> {statusMeta.label}
                </span>
                {isLoading && <Loader2 className="h-3 w-3 animate-spin text-zinc-600" aria-label="Loading" />}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close payment details"
            className="rounded-lg p-1 text-zinc-500 transition-colors hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {error && (
            <div className="flex items-start gap-2 rounded-2xl border border-[var(--accent-amber)]/25 bg-[var(--accent-amber)]/[0.06] p-3 text-xs text-[var(--accent-amber)]" role="alert">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {/* Payment information */}
          <section>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500">
              <Receipt className="h-3.5 w-3.5" aria-hidden="true" /> Payment information
            </p>
            <div className="grid grid-cols-2 gap-3">
              <DetailCard label="Amount" value={formatMoney(payment.amount, payment.currency)} />
              <DetailCard label="Currency" value={payment.currency.toUpperCase()} />
            </div>
            <div className="mt-3 space-y-1.5 text-xs">
              <div className="flex items-center justify-between gap-3 border-b border-[var(--border-subtle)]/60 py-1.5">
                <span className="text-zinc-500">Payment ID</span>
                <span className="inline-flex items-center gap-1 min-w-0">
                  <span className="truncate font-mono text-[11px] text-zinc-300" title={payment.id}>{payment.id}</span>
                  <CopyIdButton id={payment.id} label="payment ID" />
                </span>
              </div>
              <DetailRow
                label="Provider payment ID"
                value={payment.providerPaymentId}
                mono
              />
              <DetailRow label="Payment provider" value={providerLabel} />
              <DetailRow
                label="Captured at"
                value={
                  payment.capturedAt
                    ? new Date(payment.capturedAt).toLocaleString("en-IN")
                    : "Not captured"
                }
              />
              <DetailRow
                label="Created"
                value={new Date(payment.createdAt).toLocaleString("en-IN")}
              />
              <DetailRow
                label="Last updated"
                value={new Date(payment.updatedAt).toLocaleString("en-IN")}
              />
            </div>
          </section>

          {/* Linked order */}
          <section>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500">
              <ShoppingCart className="h-3.5 w-3.5" aria-hidden="true" /> Linked order
            </p>
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-white/[0.02] p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wide text-zinc-500">Order ID</p>
                  <div className="mt-0.5 flex items-center gap-1 min-w-0">
                    <span className="truncate font-mono text-[12px] text-zinc-200" title={payment.orderId}>
                      {payment.orderId.slice(0, 10)}…{payment.orderId.slice(-8)}
                    </span>
                    <CopyIdButton id={payment.orderId} label="order ID" />
                  </div>
                </div>
                <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-600">
                  Finance → Orders
                </span>
              </div>
              <p className="mt-3 text-[11px] text-zinc-500">
                Order number, customer, and items are available on the Orders page. Use the{" "}
                <span className="font-mono">order ID</span> above to correlate records across systems.
              </p>
            </div>
          </section>

          {/* Provider info note */}
          <section>
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-white/[0.02] p-4">
              <div className="flex items-start gap-2 text-xs text-zinc-400">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent-amber)]" aria-hidden="true" />
                <div>
                  <p>
                    <span className="font-medium text-zinc-200">Security notice:</span> This view
                    never exposes Razorpay secrets, webhook signatures, or internal credentials.
                    Refunds, retries, and cancellations are not yet available in this dashboard
                    release — please use the Razorpay dashboard directly for operational payment
                    actions until in-product support lands.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

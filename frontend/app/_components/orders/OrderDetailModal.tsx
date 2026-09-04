"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  Clock,
  Copy,
  CreditCard,
  Loader2,
  Package,
  Receipt,
  ShoppingCart,
  User,
  X,
} from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { getOrder, type OrderDetail, type OrderListRow } from "@/lib/api/orders";
import { listAudit, type AuditEvent } from "@/lib/api/audit";
import { formatMoney } from "../dashboard/home/formatters";
import { ORDER_STATUS_META, PAYMENT_ATTEMPT_STATUS_META, PAYMENT_RECORD_STATUS_META } from "./orderMeta";

interface OrderDetailModalProps {
  orderId: string;
  /** The row already on screen — shown immediately while the fresh
   * GET /orders/:id response loads behind it, so opening details never
   * flashes empty. Same pattern as ProductDetailsModal's initialProduct. */
  initialOrder: OrderListRow;
  onClose: () => void;
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-white/[0.02] p-3">
      <p className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-0.5 truncate text-sm font-medium text-zinc-200">{value}</p>
    </div>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--border-subtle)]/60 py-1.5 last:border-0">
      <span className="text-zinc-500">{label}</span>
      <span className={`truncate text-zinc-300 ${mono ? "font-mono text-[11px]" : ""}`}>{value}</span>
    </div>
  );
}

function CopyIdButton({ id }: { id: string }) {
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
      className="inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-zinc-500 hover:bg-white/5 hover:text-white"
      title="Copy order ID"
    >
      {copied ? <Check className="h-3 w-3 text-[var(--accent-emerald)]" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

/** Human phrasing for an ORDER_STATUS_CHANGED audit event's target.extras (from/to) — the only timeline events this backend actually emits for an order (see orders.service.ts's transitionOrderStatus). */
function timelineLabel(event: AuditEvent): string {
  const extras = event.metadata as { from?: string; to?: string } | undefined;
  if (event.action === "ORDER_STATUS_CHANGED" && extras?.from && extras?.to) {
    return `Order moved from ${extras.from} to ${extras.to}`;
  }
  return event.action.replaceAll("_", " ").toLowerCase();
}

export function OrderDetailModal({ orderId, initialOrder, onClose }: OrderDetailModalProps) {
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [timeline, setTimeline] = useState<AuditEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    Promise.all([
      getOrder(orderId),
      listAudit({ resourceType: "order", resourceId: orderId, limit: 20 }).catch(() => null),
    ])
      .then(([fresh, auditResult]) => {
        if (cancelled) return;
        setDetail(fresh);
        if (auditResult) setTimeline(auditResult.rows);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Couldn't load this order's details.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const order = detail?.order ?? initialOrder;
  const customer = detail?.customer ?? initialOrder.customer;
  const items = detail?.items ?? [];
  const attempts = detail?.attempts ?? (initialOrder.latestPaymentAttempt ? [initialOrder.latestPaymentAttempt] : []);
  const payment = detail?.payment ?? null;

  const statusMeta = ORDER_STATUS_META[order.status];
  const StatusIcon = statusMeta.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="glass-panel relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl border border-[var(--border-subtle)] bg-[var(--background-elevated)] shadow-2xl">
        <div className="flex shrink-0 items-start justify-between border-b border-[var(--border-subtle)] p-6">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-gradient-to-br from-[var(--accent-violet)]/15 via-white/[0.02] to-[var(--accent-cyan)]/10">
              <ShoppingCart className="h-6 w-6 text-zinc-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Order details</p>
              <h2 className="mt-0.5 truncate text-lg font-semibold text-white">{order.orderNumber}</h2>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                  style={{ background: `color-mix(in srgb, ${statusMeta.color} 16%, transparent)`, color: statusMeta.color }}
                >
                  <StatusIcon className="h-3 w-3" /> {statusMeta.label}
                </span>
                {isLoading && <Loader2 className="h-3 w-3 animate-spin text-zinc-600" />}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-500 hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {error && (
            <div className="flex items-start gap-2 rounded-2xl border border-[var(--accent-amber)]/25 bg-[var(--accent-amber)]/[0.06] p-3 text-xs text-[var(--accent-amber)]">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
            </div>
          )}

          {/* Order info */}
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500">
              <Receipt className="h-3.5 w-3.5" /> Order information
            </p>
            <div className="grid grid-cols-2 gap-3">
              <DetailCard label="Total amount" value={formatMoney(order.totalAmount, order.currency)} />
              <DetailCard label="Subtotal" value={formatMoney(order.subtotalAmount, order.currency)} />
              <DetailCard label="Discount" value={formatMoney(order.discountAmount, order.currency)} />
              <DetailCard label="Tax" value={formatMoney(order.taxAmount, order.currency)} />
            </div>
            <div className="mt-3 space-y-1.5 text-xs">
              <div className="flex items-center justify-between gap-3 border-b border-[var(--border-subtle)]/60 py-1.5">
                <span className="text-zinc-500">Order ID</span>
                <span className="inline-flex items-center gap-1">
                  <span className="truncate font-mono text-[11px] text-zinc-300">{order.id}</span>
                  <CopyIdButton id={order.id} />
                </span>
              </div>
              <DetailRow label="Created" value={new Date(order.createdAt).toLocaleString("en-IN")} />
              <DetailRow label="Last updated" value={new Date(order.updatedAt).toLocaleString("en-IN")} />
            </div>
          </div>

          {/* Customer */}
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500">
              <User className="h-3.5 w-3.5" /> Customer
            </p>
            {customer ? (
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-white/[0.02] p-4">
                <p className="text-sm font-medium text-zinc-200">{customer.name}</p>
                {customer.email && <p className="mt-0.5 text-xs text-zinc-500">{customer.email}</p>}
                {customer.phone && <p className="text-xs text-zinc-500">{customer.phone}</p>}
              </div>
            ) : (
              <p className="text-xs text-zinc-600">No customer information available.</p>
            )}
          </div>

          {/* Items */}
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500">
              <Package className="h-3.5 w-3.5" /> Items
            </p>
            {items.length > 0 ? (
              <div className="overflow-hidden rounded-2xl border border-[var(--border-subtle)]">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border-subtle)] bg-white/[0.02] text-zinc-500">
                      <th className="px-3 py-2 font-medium">Product</th>
                      <th className="px-3 py-2 font-medium">Qty</th>
                      <th className="px-3 py-2 font-medium">Unit price</th>
                      <th className="px-3 py-2 text-right font-medium">Line total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-b border-[var(--border-subtle)]/60 last:border-0">
                        <td className="px-3 py-2 text-zinc-200">{item.productName}</td>
                        <td className="px-3 py-2 text-zinc-400">{item.quantity}</td>
                        <td className="px-3 py-2 text-zinc-400">{formatMoney(item.unitAmount, order.currency)}</td>
                        <td className="px-3 py-2 text-right font-medium text-zinc-200">
                          {formatMoney(item.totalAmount, order.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-zinc-600">{isLoading ? "Loading items…" : "No line items on this order."}</p>
            )}
          </div>

          {/* Payment */}
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500">
              <CreditCard className="h-3.5 w-3.5" /> Payment
            </p>

            {payment && (
              <div className="mb-3 rounded-2xl border border-[var(--border-subtle)] bg-white/[0.02] p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Captured payment</span>
                  {(() => {
                    const meta = PAYMENT_RECORD_STATUS_META[payment.status];
                    const Icon = meta.icon;
                    return (
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                        style={{ background: `color-mix(in srgb, ${meta.color} 16%, transparent)`, color: meta.color }}
                      >
                        <Icon className="h-3 w-3" /> {meta.label}
                      </span>
                    );
                  })()}
                </div>
                <div className="mt-2 space-y-1 text-xs">
                  <DetailRow label="Amount" value={formatMoney(payment.amount, payment.currency)} />
                  <DetailRow label="Provider payment ID" value={payment.providerPaymentId} mono />
                  {payment.capturedAt && (
                    <DetailRow label="Captured at" value={new Date(payment.capturedAt).toLocaleString("en-IN")} />
                  )}
                </div>
              </div>
            )}

            {attempts.length > 0 ? (
              <div className="space-y-2">
                {attempts.map((attempt) => {
                  const meta = PAYMENT_ATTEMPT_STATUS_META[attempt.status];
                  const Icon = meta.icon;
                  return (
                    <div
                      key={attempt.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-white/[0.02] px-3 py-2 text-xs"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 font-medium"
                          style={{ background: `color-mix(in srgb, ${meta.color} 16%, transparent)`, color: meta.color }}
                        >
                          <Icon className="h-3 w-3" /> {meta.label}
                        </span>
                        <span className="truncate text-zinc-500">Attempt #{attempt.attemptNumber}</span>
                        {attempt.failureMessage && (
                          <span className="truncate text-[var(--accent-rose)]">{attempt.failureMessage}</span>
                        )}
                      </div>
                      <span className="shrink-0 text-zinc-500">
                        {new Date(attempt.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-zinc-600">
                {isLoading ? "Loading payment history…" : "No payment attempts recorded for this order."}
              </p>
            )}
          </div>

          {/* Timeline */}
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500">
              <Clock className="h-3.5 w-3.5" /> Timeline
            </p>
            {timeline && timeline.length > 0 ? (
              <ol className="space-y-2 border-l border-[var(--border-subtle)] pl-4">
                {[...timeline].reverse().map((event) => (
                  <li key={event.id} className="relative text-xs">
                    <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-[var(--accent-cyan)]" />
                    <p className="capitalize text-zinc-300">{timelineLabel(event)}</p>
                    <p className="mt-0.5 text-zinc-500">{new Date(event.createdAt).toLocaleString("en-IN")}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-xs text-zinc-600">
                {isLoading ? "Loading timeline…" : "No recorded status changes for this order yet."}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

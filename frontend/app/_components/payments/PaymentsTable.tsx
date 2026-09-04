"use client";

import { useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  CreditCard,
  Eye,
  ShoppingCart,
} from "lucide-react";
import type { UseApiResourceResult } from "@/hooks/useApiResource";
import type { PaymentListResult, PaymentRecord } from "@/lib/api/payments";
import { formatMoney } from "../dashboard/home/formatters";
import { ErrorNote } from "../dashboard/home/Skeletons";
import { PAYMENT_STATUS_META } from "./paymentMeta";

interface PaymentsTableProps {
  result: UseApiResourceResult<PaymentListResult>;
  page: number;
  onPageChange: (page: number) => void;
  onView: (payment: PaymentRecord) => void;
}

function PaymentStatusBadge({ status }: { status: PaymentRecord["status"] }) {
  const meta = PAYMENT_STATUS_META[status];
  const Icon = meta.icon;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ background: `color-mix(in srgb, ${meta.color} 16%, transparent)`, color: meta.color }}
    >
      <Icon className="h-3 w-3" aria-hidden="true" /> {meta.label}
    </span>
  );
}

function CopyIdButton({ id, label }: { id: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable — this is a convenience-only action,
      // never block the merchant on it.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copy ${label}`}
      title={`Copy ${label}`}
      className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
    >
      {copied ? <Check className="h-3 w-3 text-[var(--accent-emerald)]" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

function TruncatedId({ id, chars = 8 }: { id: string; chars?: number }) {
  if (!id) return <span className="text-zinc-600">—</span>;
  const start = id.slice(0, chars);
  const end = id.slice(-chars);
  return (
    <span className="font-mono text-[12px] text-zinc-200" title={id}>
      {start}…{end}
    </span>
  );
}

function ProviderBadge({ provider }: { provider: PaymentRecord["provider"] }) {
  const label = provider === "razorpay" ? "Razorpay" : provider;
  return (
    <span className="inline-flex items-center rounded-full border border-[var(--border-subtle)] bg-white/[0.02] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
      {label}
    </span>
  );
}

function RowActions({
  payment,
  onView,
}: {
  payment: PaymentRecord;
  onView: (p: PaymentRecord) => void;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onView(payment);
        }}
        aria-label="View payment details"
        title="View details"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
      >
        <Eye className="h-3.5 w-3.5" />
      </button>
      <CopyIdButton id={payment.id} label="payment ID" />
    </div>
  );
}

export function PaymentsTable({ result, page, onPageChange, onView }: PaymentsTableProps) {
  const rows = result.data?.rows ?? [];
  const pageMeta = result.data?.meta;
  const isEmpty = !result.isLoading && !result.error && rows.length === 0;

  return (
    <div className="rounded-3xl border border-[var(--border-subtle)] bg-white/[0.02] p-6">
      <p className="text-sm font-medium text-white">Payment history</p>
      {pageMeta && (
        <p className="mt-0.5 text-xs text-zinc-500" aria-live="polite">
          Showing {(pageMeta.page - 1) * pageMeta.limit + 1}–
          {Math.min(pageMeta.page * pageMeta.limit, pageMeta.total)} of {pageMeta.total} payments
        </p>
      )}

      {result.error && (
        <div className="mt-4">
          <ErrorNote message={result.error} onRetry={result.refetch} />
        </div>
      )}

      {!result.error && result.isLoading && (
        <div className="mt-4 space-y-2" aria-busy="true" aria-label="Loading payments">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-shimmer h-14 w-full rounded-xl bg-white/[0.03]" />
          ))}
        </div>
      )}

      {isEmpty && !result.isLoading && !result.error && (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--border-subtle)] py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04]">
            <CreditCard className="h-5 w-5 text-zinc-500" />
          </span>
          <p className="text-sm font-medium text-zinc-200">No captured payments yet</p>
          <p className="max-w-xs text-xs text-zinc-500">
            Payments will appear here as soon as a checkout is successfully captured through
            Razorpay.
          </p>
        </div>
      )}

      {!result.isLoading && !result.error && rows.length > 0 && (
        <>
          {/* Desktop table */}
          <div className="mt-4 hidden overflow-x-auto md:block">
            <table
              className="w-full min-w-[960px] border-collapse text-left text-sm"
              role="table"
              aria-label="Payments table"
            >
              <thead>
                <tr
                  className="border-b border-[var(--border-subtle)] text-xs uppercase tracking-wide text-zinc-500"
                  role="row"
                >
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Payment
                  </th>
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Order
                  </th>
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Amount
                  </th>
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Status
                  </th>
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Provider
                  </th>
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Captured
                  </th>
                  <th scope="col" className="py-2 pl-4 text-right font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((payment) => (
                  <tr
                    key={payment.id}
                    role="row"
                    className="cursor-pointer border-b border-[var(--border-subtle)]/60 transition-colors hover:bg-white/[0.03]"
                    onClick={() => onView(payment)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onView(payment);
                      }
                    }}
                    tabIndex={0}
                    aria-label={`Payment ${payment.id}, ${formatMoney(payment.amount, payment.currency)}`}
                  >
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <TruncatedId id={payment.id} chars={6} />
                        <CopyIdButton id={payment.id} label="payment ID" />
                      </div>
                      <p className="mt-0.5 text-[10px] font-mono text-zinc-600" title={payment.providerPaymentId}>
                        RP {payment.providerPaymentId.slice(0, 10)}…
                      </p>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="h-3.5 w-3.5 text-zinc-600" aria-hidden="true" />
                        <TruncatedId id={payment.orderId} chars={6} />
                        <CopyIdButton id={payment.orderId} label="order ID" />
                      </div>
                    </td>
                    <td className="py-3 pr-4 font-medium text-zinc-200">
                      {formatMoney(payment.amount, payment.currency)}
                    </td>
                    <td className="py-3 pr-4">
                      <PaymentStatusBadge status={payment.status} />
                    </td>
                    <td className="py-3 pr-4">
                      <ProviderBadge provider={payment.provider} />
                    </td>
                    <td className="py-3 pr-4 text-xs text-zinc-500">
                      {payment.capturedAt
                        ? new Date(payment.capturedAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="py-3 pl-4" onClick={(e) => e.stopPropagation()}>
                      <RowActions payment={payment} onView={onView} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards — same responsive pattern as OrdersTable. */}
          <div className="mt-4 flex flex-col gap-3 md:hidden">
            {rows.map((payment) => (
              <div
                key={payment.id}
                onClick={() => onView(payment)}
                className="cursor-pointer rounded-2xl border border-[var(--border-subtle)] bg-white/[0.02] p-4 transition-colors hover:border-[var(--border-strong)]"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onView(payment);
                  }
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-zinc-500">PAY</span>
                      <TruncatedId id={payment.id} chars={4} />
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <ShoppingCart className="h-3 w-3 text-zinc-600" aria-hidden="true" />
                      <span className="text-[11px] font-mono text-zinc-500">ORD</span>
                      <TruncatedId id={payment.orderId} chars={4} />
                    </div>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-white">
                    {formatMoney(payment.amount, payment.currency)}
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <PaymentStatusBadge status={payment.status} />
                  <ProviderBadge provider={payment.provider} />
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-[var(--border-subtle)] pt-3">
                  <span className="text-[11px] text-zinc-500">
                    {payment.capturedAt
                      ? `Captured ${new Date(payment.capturedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}`
                      : new Date(payment.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                  </span>
                  <div onClick={(e) => e.stopPropagation()}>
                    <RowActions payment={payment} onView={onView} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {pageMeta && pageMeta.totalPages > 1 && (
        <nav
          className="mt-5 flex items-center justify-between text-xs text-zinc-500"
          aria-label="Payment pagination"
        >
          <span>
            Page {pageMeta.page} of {pageMeta.totalPages} · {pageMeta.total} payments
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              aria-label="Previous page"
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] px-2.5 py-1.5 font-medium text-zinc-300 transition-colors hover:border-[var(--border-strong)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" /> Prev
            </button>
            <button
              type="button"
              disabled={page >= pageMeta.totalPages}
              onClick={() => onPageChange(page + 1)}
              aria-label="Next page"
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] px-2.5 py-1.5 font-medium text-zinc-300 transition-colors hover:border-[var(--border-strong)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Clock,
  IndianRupee,
  Loader2,
  Mail,
  Pencil,
  Phone,
  Receipt,
  ShoppingBag,
  User,
  X,
  type LucideIcon,
} from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { getCustomer, type Customer } from "@/lib/api/customers";
import { listOrders, type OrderListRow } from "@/lib/api/orders";
import { listAudit, type AuditEvent } from "@/lib/api/audit";
import { formatMoney } from "../dashboard/home/formatters";
import { ORDER_STATUS_META } from "../orders/orderMeta";
import { OrderDetailModal } from "../orders/OrderDetailModal";
import { CUSTOMER_STATUS_META } from "./customerMeta";

interface CustomerDetailModalProps {
  customerId: string;
  /** The row already on screen — shown immediately while the fresh
   * GET /customers/:id response loads behind it, so opening details
   * never flashes empty. Same pattern as ProductDetailsModal's
   * initialProduct / OrderDetailModal's initialOrder. */
  initialCustomer: Customer;
  onClose: () => void;
  canUpdate: boolean;
  onEdit: (customer: Customer) => void;
}

/** The order-list page size used to build this customer's summary. The
 * backend caps `limit` at 100 (utils/pagination.ts), so a customer with
 * more than 100 orders won't have every order counted toward "Total
 * spent" below — see the isComplete guard where that figure is computed. */
const ORDER_HISTORY_LIMIT = 100;

function DetailCard({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-white/[0.02] p-3">
      <p className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-zinc-500">
        <Icon className="h-3 w-3" /> {label}
      </p>
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

/** Human phrasing for an audit event on this customer — same fallback
 * style as OrderDetailModal's timelineLabel, since no CUSTOMER_* audit
 * event types are emitted by this backend yet (customers.service.ts
 * never calls emitAudit) — this renders whatever, if anything, actually
 * comes back rather than assuming a rich event history exists. */
function timelineLabel(event: AuditEvent): string {
  return event.action.replaceAll("_", " ").toLowerCase();
}

export function CustomerDetailModal({
  customerId,
  initialCustomer,
  onClose,
  canUpdate,
  onEdit,
}: CustomerDetailModalProps) {
  const [customer, setCustomer] = useState<Customer>(initialCustomer);
  const [orders, setOrders] = useState<OrderListRow[]>([]);
  const [ordersTotal, setOrdersTotal] = useState<number | null>(null);
  const [timeline, setTimeline] = useState<AuditEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewOrder, setViewOrder] = useState<OrderListRow | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    Promise.all([
      getCustomer(customerId),
      listOrders({ customerId, limit: ORDER_HISTORY_LIMIT, sort: "createdAt", order: "desc" }),
      listAudit({ resourceType: "customer", resourceId: customerId, limit: 20 }).catch(() => null),
    ])
      .then(([freshCustomer, orderResult, auditResult]) => {
        if (cancelled) return;
        setCustomer(freshCustomer);
        setOrders(orderResult.rows);
        setOrdersTotal(orderResult.meta.total);
        if (auditResult) setTimeline(auditResult.rows);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Couldn't load this customer's details.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [customerId]);

  const statusMeta = CUSTOMER_STATUS_META[customer.status];
  const StatusIcon = statusMeta.icon;

  // "Total spent" is only shown once we've actually fetched every one of
  // this customer's orders (meta.total <= the page we asked for) — a
  // partial sum over just the most recent ORDER_HISTORY_LIMIT orders
  // would be a real but misleading number, so it's omitted entirely
  // rather than labelled as a total it isn't. Order count and last
  // order date are always exact regardless.
  const hasCompleteOrderHistory = ordersTotal !== null && ordersTotal <= orders.length;
  const totalSpentMinor = hasCompleteOrderHistory
    ? orders.filter((o) => o.status === "paid").reduce((sum, o) => sum + o.totalAmount, 0)
    : null;
  const currency = orders[0]?.currency ?? "INR";
  const lastOrder = orders[0] ?? null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="glass-panel relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl border border-[var(--border-subtle)] bg-[var(--background-elevated)] shadow-2xl">
        <div className="flex shrink-0 items-start justify-between border-b border-[var(--border-subtle)] p-6">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-gradient-to-br from-[var(--accent-violet)]/15 via-white/[0.02] to-[var(--accent-cyan)]/10">
              <User className="h-6 w-6 text-zinc-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Customer details</p>
              <h2 className="mt-0.5 truncate text-lg font-semibold text-white">{customer.name}</h2>
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

          {/* Profile */}
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500">
              <User className="h-3.5 w-3.5" /> Profile
            </p>
            <div className="space-y-1 text-xs">
              {customer.email && (
                <div className="flex items-center justify-between gap-3 border-b border-[var(--border-subtle)]/60 py-1.5">
                  <span className="flex items-center gap-1.5 text-zinc-500">
                    <Mail className="h-3 w-3" /> Email
                  </span>
                  <span className="truncate text-zinc-300">{customer.email}</span>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center justify-between gap-3 border-b border-[var(--border-subtle)]/60 py-1.5">
                  <span className="flex items-center gap-1.5 text-zinc-500">
                    <Phone className="h-3 w-3" /> Phone
                  </span>
                  <span className="truncate text-zinc-300">{customer.phone}</span>
                </div>
              )}
              {customer.externalCustomerId && (
                <DetailRow label="External ID" value={customer.externalCustomerId} mono />
              )}
              <div className="flex items-center justify-between gap-3 border-b border-[var(--border-subtle)]/60 py-1.5">
                <span className="text-zinc-500">Customer ID</span>
                <span className="truncate font-mono text-[11px] text-zinc-300">{customer.id}</span>
              </div>
              <DetailRow label="Created" value={new Date(customer.createdAt).toLocaleString("en-IN")} />
              <DetailRow label="Last updated" value={new Date(customer.updatedAt).toLocaleString("en-IN")} />
            </div>
          </div>

          {/* Summary */}
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500">
              <Receipt className="h-3.5 w-3.5" /> Summary
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <DetailCard
                label="Total orders"
                icon={ShoppingBag}
                value={isLoading ? "…" : ordersTotal !== null ? String(ordersTotal) : "—"}
              />
              {totalSpentMinor !== null && (
                <DetailCard label="Total spent" icon={IndianRupee} value={formatMoney(totalSpentMinor, currency)} />
              )}
              <DetailCard
                label="Last order"
                icon={Clock}
                value={lastOrder ? new Date(lastOrder.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
              />
            </div>
            {ordersTotal !== null && ordersTotal > orders.length && (
              <p className="mt-2 text-[11px] text-zinc-600">
                Showing the {orders.length} most recent orders — total spent isn&apos;t shown once a customer has
                more orders than fit in one page.
              </p>
            )}
          </div>

          {/* Order history */}
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500">
              <ShoppingBag className="h-3.5 w-3.5" /> Order history
            </p>
            {orders.length > 0 ? (
              <div className="space-y-2">
                {orders.map((order) => {
                  const meta = ORDER_STATUS_META[order.status];
                  const Icon = meta.icon;
                  return (
                    <button
                      key={order.id}
                      type="button"
                      onClick={() => setViewOrder(order)}
                      className="flex w-full items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-white/[0.02] px-3 py-2 text-left text-xs transition-colors hover:border-[var(--border-strong)] hover:bg-white/[0.04]"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-zinc-200">{order.orderNumber}</p>
                        <p className="mt-0.5 text-zinc-500">
                          {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium"
                          style={{ background: `color-mix(in srgb, ${meta.color} 16%, transparent)`, color: meta.color }}
                        >
                          <Icon className="h-3 w-3" /> {meta.label}
                        </span>
                        <span className="font-medium text-zinc-200">{formatMoney(order.totalAmount, order.currency)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-zinc-600">
                {isLoading ? "Loading order history…" : "This customer hasn't placed any orders yet."}
              </p>
            )}
          </div>

          {/* Activity */}
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500">
              <Clock className="h-3.5 w-3.5" /> Activity
            </p>
            {timeline && timeline.length > 0 ? (
              <ol className="space-y-2 border-l border-[var(--border-subtle)] pl-4">
                {timeline.map((event) => (
                  <li key={event.id} className="relative text-xs">
                    <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-[var(--accent-cyan)]" />
                    <p className="capitalize text-zinc-300">{timelineLabel(event)}</p>
                    <p className="mt-0.5 text-zinc-500">{new Date(event.createdAt).toLocaleString("en-IN")}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-xs text-zinc-600">
                {isLoading ? "Loading activity…" : "No recorded activity for this customer yet."}
              </p>
            )}
          </div>
        </div>

        {canUpdate && (
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[var(--border-subtle)] p-5">
            <button
              type="button"
              onClick={() => onEdit(customer)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-cyan)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit customer
            </button>
          </div>
        )}
      </div>

      {viewOrder && (
        <OrderDetailModal orderId={viewOrder.id} initialOrder={viewOrder} onClose={() => setViewOrder(null)} />
      )}
    </div>
  );
}

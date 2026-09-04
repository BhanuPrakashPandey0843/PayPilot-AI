/**
 * Typed API functions for the Order Management page (/orders).
 *
 * Mirrors backend/src/modules/orders exactly — see orders.routes.ts,
 * orders.schemas.ts, db/schema/orders.ts, and db/schema/payments.ts for
 * the server-side source of truth this file has to respect:
 *
 *  - Money (subtotalAmount/discountAmount/taxAmount/totalAmount,
 *    payment attempt `amount`) is always an integer in minor units
 *    (paise for INR) — never a float.
 *  - "Order Status" (pending/paid/partially_paid/cancelled/failed/
 *    refunded, orders.status) and "Payment Status" (created/pending/
 *    authorized/captured/failed/cancelled, the latest payment_attempt's
 *    status) are two DIFFERENT state machines — see orders.types.ts /
 *    payment.constants.ts on the backend. Never conflate them.
 *  - There is no refund/cancel/retry-payment endpoint anywhere in this
 *    backend (checkout.routes.ts only exposes create-order/verify-payment,
 *    payment.routes.ts is read-only) — so no such actions are exposed
 *    here or in the UI built on top of this file.
 *  - Order summary counts + total revenue come from the real
 *    GET /orders/summary aggregate endpoint (exact counts, no client-side
 *    estimation) rather than the products-page-style "meta.total on a
 *    limit:1 request" trick, since a per-status count still needs its
 *    own request either way and the backend already computes all of
 *    them (plus the revenue sum) in one round trip.
 */
import { apiClient } from "./client";
import type { PaginatedMeta } from "./dashboard";

// --- Shared sub-shapes ---------------------------------------------------

export type OrderStatus = "pending" | "paid" | "partially_paid" | "cancelled" | "failed" | "refunded";
export type PaymentAttemptStatus = "created" | "pending" | "authorized" | "captured" | "failed" | "cancelled";
export type PaymentStatus = "captured" | "partially_refunded" | "refunded" | "failed";

export interface OrderCustomerSummary {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

export interface PaymentAttempt {
  id: string;
  orderId: string;
  provider: string;
  providerOrderId: string | null;
  providerPaymentId: string | null;
  /** Integer minor units. */
  amount: number;
  currency: string;
  status: PaymentAttemptStatus;
  failureCode: string | null;
  failureMessage: string | null;
  attemptNumber: number;
  createdAt: string;
  updatedAt: string;
}

export interface CapturedPayment {
  id: string;
  orderId: string;
  provider: string;
  providerPaymentId: string;
  /** Integer minor units. */
  amount: number;
  currency: string;
  status: PaymentStatus;
  capturedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string | null;
  productName: string;
  quantity: number;
  /** Integer minor units. */
  unitAmount: number;
  /** Integer minor units. */
  totalAmount: number;
  createdAt: string;
}

// --- Order (list row) -----------------------------------------------------

export interface Order {
  id: string;
  organizationId: string;
  customerId: string;
  orderNumber: string;
  status: OrderStatus;
  currency: string;
  /** Integer minor units. */
  subtotalAmount: number;
  /** Integer minor units. */
  discountAmount: number;
  /** Integer minor units. */
  taxAmount: number;
  /** Integer minor units. */
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderListRow extends Order {
  customer: OrderCustomerSummary | null;
  latestPaymentAttempt: PaymentAttempt | null;
}

export interface OrderListResult {
  rows: OrderListRow[];
  meta: PaginatedMeta;
}

export const ORDER_SORT_FIELDS = ["createdAt", "updatedAt", "totalAmount", "orderNumber"] as const;
export type OrderSortField = (typeof ORDER_SORT_FIELDS)[number];
export type OrderSortOrder = "asc" | "desc";

export interface OrderListFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: OrderStatus;
  customerId?: string;
  /** ISO date/timestamp, inclusive lower bound on createdAt. */
  dateFrom?: string;
  /** ISO date/timestamp, inclusive upper bound on createdAt. */
  dateTo?: string;
  /** Integer minor units. */
  minAmount?: number;
  /** Integer minor units. */
  maxAmount?: number;
  sort?: OrderSortField;
  order?: OrderSortOrder;
}

function buildListParams(filters: OrderListFilters): URLSearchParams {
  const { page = 1, limit = 20, search, status, customerId, dateFrom, dateTo, minAmount, maxAmount, sort, order } =
    filters;
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.set("search", search);
  if (status) params.set("status", status);
  if (customerId) params.set("customerId", customerId);
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);
  if (minAmount !== undefined) params.set("minAmount", String(minAmount));
  if (maxAmount !== undefined) params.set("maxAmount", String(maxAmount));
  if (sort) params.set("sort", sort);
  if (order) params.set("order", order);
  return params;
}

export function listOrders(filters: OrderListFilters = {}): Promise<OrderListResult> {
  const params = buildListParams(filters);
  return apiClient.getPaginated<OrderListRow[]>(`/orders?${params.toString()}`).then((res) => ({
    rows: res.data,
    meta: res.meta ?? {
      page: filters.page ?? 1,
      limit: filters.limit ?? 20,
      total: res.data.length,
      totalPages: 1,
    },
  }));
}

// --- Summary (real per-status counts + real revenue sum) ------------------

export interface OrdersSummary {
  totalOrders: number;
  pendingOrders: number;
  paidOrders: number;
  partiallyPaidOrders: number;
  failedOrders: number;
  cancelledOrders: number;
  refundedOrders: number;
  /** Integer minor units. Sum of totalAmount across "paid" orders only. */
  totalRevenueMinor: number;
  currency: string;
}

export function getOrdersSummary(): Promise<OrdersSummary> {
  return apiClient.get<OrdersSummary>("/orders/summary");
}

// --- Order detail -----------------------------------------------------

export interface OrderDetail {
  order: Order;
  items: OrderItem[];
  customer: OrderCustomerSummary;
  /** Full attempt history (retries included), newest attemptNumber first. */
  attempts: PaymentAttempt[];
  /** The captured payment record, or null if none exists yet. */
  payment: CapturedPayment | null;
}

export function getOrder(id: string): Promise<OrderDetail> {
  return apiClient.get<OrderDetail>(`/orders/${id}`);
}

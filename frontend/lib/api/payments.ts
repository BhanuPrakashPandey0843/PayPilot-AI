/**
 * Typed API functions for the Payments management page (/payments).
 *
 * Mirrors backend/src/modules/payments exactly — see payment.routes.ts,
 * payment.schemas.ts, and db/schema/payments.ts for the server-side
 * source of truth this file has to respect:
 *
 *  - Money (amount) is always an integer in minor units (paise for INR) —
 *    never a float. Frontend divides by 100 only at the display boundary
 *    via formatMoney().
 *  - Payment status enum: captured | partially_refunded | refunded | failed
 *    (payments.ts's paymentStatusEnum on the backend). This is DIFFERENT
 *    from both the payment_attempt status machine AND the order lifecycle
 *    — see lib/api/orders.ts for those.
 *  - The /payments/history endpoint only supports page + limit today
 *    (check payment.schemas.ts: paymentHistoryQuerySchema = paginationQuerySchema
 *    — no search, no filters, no sort). No filter/search UI is exposed
 *    on top of this page until the backend actually supports those params.
 *  - No refund/cancel/retry endpoint exists in payment.routes.ts — the
 *    route file is strictly read-only. Only "view details" and
 *    "copy payment ID" are exposed as actions.
 *  - KPI summary numbers come from GET /analytics/payments (real aggregate
 *    counts: successCount / failureCount / pendingCount, plus a success
 *    rate percentage) — never from client-side tallying of one paginated
 *    page of rows.
 */
import { apiClient } from "./client";
import type { PaginatedMeta } from "./dashboard";
import type { DateRange, PaymentAnalytics } from "./dashboard";

// --- Shared sub-shapes ---------------------------------------------------

export type PaymentStatus = "captured" | "partially_refunded" | "refunded" | "failed";
export type PaymentProvider = "razorpay";

export interface PaymentRecord {
  id: string;
  orderId: string;
  provider: PaymentProvider;
  providerPaymentId: string;
  /** Integer minor units (paise for INR). Never a float. */
  amount: number;
  currency: string;
  status: PaymentStatus;
  capturedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentListResult {
  rows: PaymentRecord[];
  meta: PaginatedMeta;
}

export interface PaymentListFilters {
  page?: number;
  limit?: number;
}

// --- Payment list ---------------------------------------------------------

function buildListParams(filters: PaymentListFilters): URLSearchParams {
  const { page = 1, limit = 20 } = filters;
  return new URLSearchParams({ page: String(page), limit: String(limit) });
}

/**
 * GET /payments/history — organization-scoped captured payment records,
 * paginated. Today ONLY page + limit are wired on the backend (see
 * paymentHistoryQuerySchema = paginationQuerySchema). Any future
 * search/status/date/sort support on the server must be added to both
 * the Zod schema HERE and buildListParams above before the UI exposes it.
 */
export function listPayments(filters: PaymentListFilters = {}): Promise<PaymentListResult> {
  const params = buildListParams(filters);
  return apiClient.getPaginated<PaymentRecord[]>(`/payments/history?${params.toString()}`).then((res) => ({
    rows: res.data,
    meta: res.meta ?? {
      page: filters.page ?? 1,
      limit: filters.limit ?? 20,
      total: res.data.length,
      totalPages: 1,
    },
  }));
}

// --- Payment detail -------------------------------------------------------

/**
 * GET /payments/:id — a single captured payment record, scoped to the
 * authenticated organization. A cross-tenant id 404s rather than leaking
 * existence (repository layer eq(organizationId, ...) + limit(1)).
 */
export function getPayment(id: string): Promise<PaymentRecord> {
  return apiClient.get<PaymentRecord>(`/payments/${id}`);
}

// --- Analytics-backed payment summary ------------------------------------

/**
 * Re-export of the payment analytics aggregate from the analytics API
 * module. Used directly by the summary KPI cards — never compute these
 * client-side from one paginated list page.
 */
export type { PaymentAnalytics } from "./dashboard";
export { getPaymentAnalytics } from "./dashboard";
export type { DateRange } from "./dashboard";

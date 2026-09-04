"use client";

import { useApiResource } from "./useApiResource";
import type { UseApiResourceResult } from "./useApiResource";
import {
  listPayments,
  getPayment,
  getPaymentAnalytics,
  type PaymentListFilters,
  type PaymentListResult,
  type PaymentRecord,
  type PaymentAnalytics,
  type DateRange,
} from "@/lib/api/payments";

/**
 * Main paginated list backing the Payments table, via GET /payments/history.
 *
 * IMPORTANT — today the backend ONLY accepts page + limit on this endpoint
 * (see payment.schemas.ts: paymentHistoryQuerySchema = paginationQuerySchema,
 * and listPayments() in lib/api/payments.ts). Any future search/status/
 * date-range/sort capability must be added to the backend first and the
 * filter keys here expanded only after server support is verified.
 */
export function usePaymentList(filters: PaymentListFilters): UseApiResourceResult<PaymentListResult> {
  return useApiResource(() => listPayments(filters), [filters.page, filters.limit]);
}

/**
 * Single payment detail — GET /payments/:id. Used by the PaymentDetailModal
 * to refresh a row beyond what the list response already contains (the list
 * shape is already the full PaymentRecord, but detail view still goes to the
 * server for a fresh copy, same pattern as OrderDetailModal).
 */
export function usePayment(id: string | null): UseApiResourceResult<PaymentRecord | null> {
  return useApiResource(async () => (id ? getPayment(id) : null), [id]);
}

/**
 * Real per-status payment counts + real KPIs, via GET /analytics/payments.
 * Backed by the analytics repository's aggregate queries — never a
 * client-side count over one paginated slice of history.
 */
export function usePaymentAnalytics(range: DateRange = "30d"): UseApiResourceResult<PaymentAnalytics> {
  return useApiResource(() => getPaymentAnalytics(range), [range]);
}

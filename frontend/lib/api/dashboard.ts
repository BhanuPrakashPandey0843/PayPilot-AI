/**
 * Typed API functions for the Dashboard Home page.
 *
 * Deliberately scoped to what the backend actually exposes — there is
 * no GET /orders route in this codebase (see backend/src/modules/orders:
 * repository/service/types only, no orders.routes.ts, and index.ts
 * never registers one). "Orders" on this page are therefore derived
 * from /analytics (aggregate counts) and /payments/history (each
 * payment carries its orderId), never from a dedicated orders list —
 * see RecentActivity's doc comment for how that trade-off is surfaced
 * in the UI rather than hidden behind a fabricated table.
 */
import { apiClient } from "./client";

export type DateRange = "today" | "7d" | "30d" | "90d";

function rangeQuery(range: DateRange) {
  return `range=${range}`;
}

// --- Analytics: Overview ---

export interface TopProduct {
  productId: string | null;
  productName: string;
  revenueMinor: number;
}

export interface AnalyticsOverview {
  period: { from: string; to: string };
  totalRevenueMinor: number;
  currency: string;
  orderCount: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
  paymentSuccessRatePercent: number | null;
  averageOrderValueMinor: number | null;
  conversionRatePercent: number | null;
  conversionRateNote: string;
  revenueGrowthPercent: number | null;
  topProduct: TopProduct | null;
  revenueAtRiskMinor: number;
  revenueAtRiskOrderCount: number;
}

export function getOverview(range: DateRange = "30d"): Promise<AnalyticsOverview> {
  return apiClient.get<AnalyticsOverview>(`/analytics/overview?${rangeQuery(range)}`);
}

// --- Analytics: Revenue trend ---

export interface RevenueTrendPoint {
  bucket: string;
  revenueMinor: number;
  orderCount: number;
}

export interface RevenueTrend {
  period: { from: string; to: string };
  current: { revenueMinor: number; orders: number };
  previous: { revenueMinor: number; orders: number };
  change: { revenuePercent: number | null; ordersPercent: number | null };
  series: RevenueTrendPoint[];
}

export function getRevenueTrend(range: DateRange = "30d"): Promise<RevenueTrend> {
  return apiClient.get<RevenueTrend>(`/analytics/revenue?${rangeQuery(range)}`);
}

// --- Analytics: Product analytics ---

export interface ProductAnalyticsRow {
  productId: string | null;
  productName: string;
  revenueMinor: number;
  unitsSold: number;
  orderCount: number;
  averageSellingPriceMinor: number;
  isActive: boolean;
}

export interface PaginatedMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ProductAnalyticsResult {
  rows: ProductAnalyticsRow[];
  meta: PaginatedMeta;
}

export function getProductAnalytics(
  range: DateRange = "30d",
  opts: { page?: number; limit?: number; sort?: "revenue" | "unitsSold" | "orderCount" } = {}
): Promise<ProductAnalyticsResult> {
  const { page = 1, limit = 8, sort = "revenue" } = opts;
  return apiClient
    .getPaginated<ProductAnalyticsRow[]>(
      `/analytics/products?${rangeQuery(range)}&page=${page}&limit=${limit}&sort=${sort}&order=desc`
    )
    .then((res) => ({
      rows: res.data,
      meta: res.meta ?? { page, limit, total: res.data.length, totalPages: 1 },
    }));
}

// --- Analytics: Payment analytics ---

export interface FailureBucket {
  failureCode: string | null;
  count: number;
  valueMinor: number;
}

export interface PaymentAnalytics {
  period: { from: string; to: string };
  successCount: number;
  failureCount: number;
  pendingCount: number;
  paymentSuccessRatePercent: number | null;
  failedPaymentValueMinor: number;
  failuresByCode: FailureBucket[];
  recoveryOpportunitySignal: {
    repeatFailureCustomerCount: number;
    totalRecoverableValueMinor: number;
  };
}

export function getPaymentAnalytics(range: DateRange = "30d"): Promise<PaymentAnalytics> {
  return apiClient.get<PaymentAnalytics>(`/analytics/payments?${rangeQuery(range)}`);
}

// --- Revenue opportunities ---

export type OpportunityType = "CROSS_SELL" | "UPSELL" | "PAYMENT_RECOVERY" | "ABANDONED_CHECKOUT" | "REVENUE_DROP";
export type OpportunityStatus = "OPEN" | "APPROVED" | "REJECTED" | "EXECUTING" | "EXECUTED" | "FAILED" | "EXPIRED";
export type OpportunitySeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface RevenueOpportunity {
  id: string;
  organizationId: string;
  type: OpportunityType;
  title: string;
  description: string;
  status: OpportunityStatus;
  severity: OpportunitySeverity;
  score: number;
  confidence: number;
  estimatedRevenueImpact: number;
  currency: string;
  evidence: Record<string, unknown>;
  recommendedAction: Record<string, unknown> | null;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedReason: string | null;
  executedBy: string | null;
  executedAt: string | null;
  executionResult: Record<string, unknown> | null;
  executionFailureReason: string | null;
  /** Set by the backend for opportunities with a bounded approval window;
   * action-policy.service.ts's NOT_EXPIRED check fails execution once
   * this passes. Null when no expiry applies. */
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OpportunityListResult {
  rows: RevenueOpportunity[];
  meta: PaginatedMeta;
}

export function listOpportunities(opts: {
  type?: OpportunityType;
  status?: OpportunityStatus;
  page?: number;
  limit?: number;
  sort?: "score" | "createdAt" | "estimatedRevenueImpact";
} = {}): Promise<OpportunityListResult> {
  const { type, status, page = 1, limit = 10, sort = "score" } = opts;
  const params = new URLSearchParams({ page: String(page), limit: String(limit), sort, order: "desc" });
  if (type) params.set("type", type);
  if (status) params.set("status", status);
  return apiClient
    .getPaginated<RevenueOpportunity[]>(`/revenue/opportunities?${params.toString()}`)
    .then((res) => ({
      rows: res.data,
      meta: res.meta ?? { page, limit, total: res.data.length, totalPages: 1 },
    }));
}

export function approveOpportunity(id: string): Promise<RevenueOpportunity> {
  return apiClient.post<RevenueOpportunity>(`/revenue/opportunities/${id}/approve`);
}

export function rejectOpportunity(id: string, reason?: string): Promise<RevenueOpportunity> {
  return apiClient.post<RevenueOpportunity>(`/revenue/opportunities/${id}/reject`, reason ? { reason } : {});
}

export function executeOpportunity(id: string): Promise<RevenueOpportunity> {
  return apiClient.post<RevenueOpportunity>(`/revenue/opportunities/${id}/execute`);
}

// --- Payments history (also stands in for "recent orders" — see note
// at the top of this file) ---

export interface PaymentRecord {
  id: string;
  orderId: string;
  provider: string;
  providerPaymentId: string;
  amount: number;
  currency: string;
  status: "captured" | "partially_refunded" | "refunded" | "failed";
  capturedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentHistoryResult {
  rows: PaymentRecord[];
  meta: PaginatedMeta;
}

export function getPaymentsHistory(opts: { page?: number; limit?: number } = {}): Promise<PaymentHistoryResult> {
  const { page = 1, limit = 8 } = opts;
  return apiClient
    .getPaginated<PaymentRecord[]>(`/payments/history?page=${page}&limit=${limit}`)
    .then((res) => ({
      rows: res.data,
      meta: res.meta ?? { page, limit, total: res.data.length, totalPages: 1 },
    }));
}

// --- Customers ---

export interface CustomerRecord {
  id: string;
  organizationId: string;
  externalCustomerId: string;
  name: string;
  email: string;
  phone: string;
  status: "active" | "inactive" | "blocked";
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerListResult {
  rows: CustomerRecord[];
  meta: PaginatedMeta;
}

export function listCustomers(opts: {
  page?: number;
  limit?: number;
  status?: "active" | "inactive" | "blocked";
} = {}): Promise<CustomerListResult> {
  const { page = 1, limit = 20, status } = opts;
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) params.set("status", status);
  return apiClient
    .getPaginated<CustomerRecord[]>(`/customers?${params.toString()}`)
    .then((res) => ({
      rows: res.data,
      meta: res.meta ?? { page, limit, total: res.data.length, totalPages: 1 },
    }));
}

// --- Products (catalog, not analytics — used only for the "Active
// Products" KPI count) ---

export function getProductCatalogCount(isActive?: boolean): Promise<number> {
  const params = new URLSearchParams({ limit: "1" });
  if (isActive !== undefined) params.set("isActive", String(isActive));
  return apiClient
    .getPaginated<unknown[]>(`/products?${params.toString()}`)
    .then((res) => res.meta?.total ?? res.data.length);
}

export function getActiveProductCount(): Promise<number> {
  return getProductCatalogCount(true);
}

// --- Audit ---

export interface AuditEvent {
  id: string;
  organizationId: string;
  actorType: "USER" | "AI_AGENT" | "SYSTEM";
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  reason: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface AuditListResult {
  rows: AuditEvent[];
  meta: PaginatedMeta;
}

export function getAuditLog(opts: { page?: number; limit?: number } = {}): Promise<AuditListResult> {
  const { page = 1, limit = 10 } = opts;
  return apiClient
    .getPaginated<AuditEvent[]>(`/audit?page=${page}&limit=${limit}`)
    .then((res) => ({
      rows: res.data,
      meta: res.meta ?? { page, limit, total: res.data.length, totalPages: 1 },
    }));
}

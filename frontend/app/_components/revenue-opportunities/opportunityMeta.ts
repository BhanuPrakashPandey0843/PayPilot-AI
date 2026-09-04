/**
 * Presentation metadata for revenue opportunities — mirrors the
 * approach in app/_components/audit/eventMeta.ts (classification maps,
 * not hardcoded per-row styling) and reuses the exact TYPE_META/
 * SEVERITY_COLOR pairing already established in
 * app/_components/dashboard/home/OpportunitiesPanel.tsx so the two
 * surfaces (Dashboard Home's panel and this full page) read as the
 * same product.
 */
import { CreditCard, TrendingUp, TrendingDown, Layers, ShoppingBag, type LucideIcon } from "lucide-react";
import type { OpportunityType, OpportunityStatus, OpportunitySeverity } from "@/lib/api/dashboard";

// LucideIcon (not a narrower ComponentType<{className}>) — callers in
// this page pass both className and style (for the per-type accent
// color), and LucideIcon's props cover both.
export const TYPE_META: Record<OpportunityType, { label: string; icon: LucideIcon; color: string }> = {
  PAYMENT_RECOVERY: { label: "Payment Recovery", icon: CreditCard, color: "var(--accent-gold)" },
  UPSELL: { label: "Upsell", icon: TrendingUp, color: "var(--accent-violet)" },
  CROSS_SELL: { label: "Cross-Sell", icon: Layers, color: "var(--accent-cyan)" },
  ABANDONED_CHECKOUT: { label: "Abandoned Checkout", icon: ShoppingBag, color: "var(--accent-blue)" },
  REVENUE_DROP: { label: "Revenue Drop", icon: TrendingDown, color: "var(--accent-rose)" },
};

export const SEVERITY_COLOR: Record<OpportunitySeverity, string> = {
  LOW: "var(--muted)",
  MEDIUM: "var(--accent-amber)",
  HIGH: "var(--accent-rose)",
  CRITICAL: "var(--accent-rose)",
};

export const STATUS_META: Record<OpportunityStatus, { label: string; color: string }> = {
  OPEN: { label: "Open", color: "var(--accent-cyan)" },
  APPROVED: { label: "Approved", color: "var(--accent-blue)" },
  REJECTED: { label: "Rejected", color: "var(--muted)" },
  EXECUTING: { label: "Executing", color: "var(--accent-amber)" },
  EXECUTED: { label: "Executed", color: "var(--accent-emerald)" },
  FAILED: { label: "Failed", color: "var(--accent-rose)" },
  EXPIRED: { label: "Expired", color: "var(--muted)" },
};

export const ALL_TYPES: OpportunityType[] = [
  "CROSS_SELL",
  "UPSELL",
  "PAYMENT_RECOVERY",
  "ABANDONED_CHECKOUT",
  "REVENUE_DROP",
];

export const ALL_STATUSES: OpportunityStatus[] = [
  "OPEN",
  "APPROVED",
  "REJECTED",
  "EXECUTING",
  "EXECUTED",
  "FAILED",
  "EXPIRED",
];

/** Mirrors backend/src/modules/revenue/action-policy.service.ts's
 * EXECUTABLE_ACTION_TYPES exactly — the only recommendedAction types
 * with a real automated execution path (revenue.execution.ts). Used
 * only as an honest, non-authoritative UI hint ("this will likely be
 * blocked") before the user clicks Execute; the actual ALLOWED/BLOCKED
 * decision always comes from the backend's response, never guessed
 * here. */
const EXECUTABLE_ACTION_TYPES = new Set(["review_failed_payments", "follow_up_abandoned_checkout"]);

export function isLikelyExecutable(recommendedAction: Record<string, unknown> | null): boolean {
  const actionType = recommendedAction?.actionType;
  return typeof actionType === "string" && EXECUTABLE_ACTION_TYPES.has(actionType);
}

/** evidence.customers is an array on PAYMENT_RECOVERY / ABANDONED_CHECKOUT
 * opportunities only (see revenue.engine.ts) — these are aggregate,
 * multi-customer patterns, not single-customer records, so there is no
 * real "customer" field to show for every row. Returns null when the
 * evidence shape doesn't carry one, rather than fabricating a value. */
export function evidenceCustomerCount(evidence: Record<string, unknown>): number | null {
  const customers = evidence?.customers;
  return Array.isArray(customers) ? customers.length : null;
}

export function evidenceProductNames(evidence: Record<string, unknown>): string[] {
  const products = evidence?.products;
  if (!Array.isArray(products)) return [];
  return products
    .map((p) => (p && typeof p === "object" ? (p as Record<string, unknown>).productName : null))
    .filter((name): name is string => typeof name === "string");
}

export interface PolicyCheck {
  name: string;
  status: "PASS" | "FAIL";
  message: string;
}

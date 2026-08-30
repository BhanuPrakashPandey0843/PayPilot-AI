import type {
  RevenueOpportunityType,
  RevenueOpportunitySeverity,
} from "../../db/schema/revenue_opportunities.js";

/**
 * Structured, machine-readable evidence for a detected opportunity.
 * This is the ONLY thing the AI copilot is allowed to read/cite when
 * explaining an opportunity (Phase 6/7) — it never sees raw DB rows.
 */
export interface OpportunityEvidence {
  period?: { from: string; to: string };
  metrics: Record<string, number | string | null>;
  products?: { productId: string; productName: string; [key: string]: unknown }[];
  customers?: { customerId: string; [key: string]: unknown }[];
  comparison?: Record<string, number | string | null>;
  /** Plain-language explanation of the assumption(s) behind any estimate. */
  methodologyNote?: string;
}

export interface RecommendedAction {
  actionType:
    | "recommend_product_pairing"
    | "recommend_upsell"
    | "review_failed_payments"
    | "follow_up_abandoned_checkout"
    | "investigate_revenue_drop";
  description: string;
  targetProductIds?: string[];
  targetCustomerIds?: string[];
  targetOrderIds?: string[];
}

/** Output of a single detector function, before scoring/persistence. */
export interface DetectedOpportunity {
  type: RevenueOpportunityType;
  dedupeKey: string;
  title: string;
  description: string;
  severity: RevenueOpportunitySeverity;
  estimatedRevenueImpactMinor: number;
  currency: string;
  evidence: OpportunityEvidence;
  recommendedAction: RecommendedAction;
  /** Sample size behind the pattern (customers, orders, failures...) — feeds confidence. */
  sampleSize: number;
  /** Most recent evidence timestamp — feeds the recency scoring factor. */
  mostRecentEvidenceAt: Date;
}

export interface ScoreResult {
  score: number;
  confidence: number;
  factors: { name: string; value: number; description: string }[];
}

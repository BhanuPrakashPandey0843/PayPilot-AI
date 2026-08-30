/**
 * MOCK DATA — for the interactive /demo experience only. Shapes mirror
 * the real `revenue_opportunities` table and `revenue.engine.ts` output
 * shape, but every record here is synthetic demo content, generated
 * client-side, and never sent to or read from the live backend.
 */

export type OpportunityType =
  | "CROSS_SELL"
  | "UPSELL"
  | "PAYMENT_RECOVERY"
  | "ABANDONED_CHECKOUT"
  | "REVENUE_DROP";

export type MockOpportunity = {
  id: string;
  type: OpportunityType;
  title: string;
  customer: string;
  order: string;
  score: number;
  estimatedImpact: number; // INR
  evidence: string[];
  recommendedAction: string;
  policyChecks: { label: string; passed: boolean }[];
};

export const MOCK_OPPORTUNITIES: MockOpportunity[] = [
  {
    id: "opp_01",
    type: "CROSS_SELL",
    title: "Bundle hydration vest with trailrunner sneakers",
    customer: "Ananya R.",
    order: "ORD-8841",
    score: 87,
    estimatedImpact: 798,
    evidence: [
      "Customer viewed Trailrunner Mesh Sneaker and Hydration Vest 5L in the same session",
      "68% of buyers who purchased both items together in the last 30 days rated 5 stars",
      "Vest is in stock (54 units) with no active promotion conflict",
    ],
    recommendedAction: "Offer 12% bundle discount on Hydration Vest 5L at checkout",
    policyChecks: [
      { label: "Discount within merchant policy (≤15%)", passed: true },
      { label: "Product active and in stock", passed: true },
      { label: "No conflicting promotion", passed: true },
    ],
  },
  {
    id: "opp_02",
    type: "PAYMENT_RECOVERY",
    title: "Retry failed payment for high-intent order",
    customer: "Rohit K.",
    order: "ORD-8790",
    score: 74,
    estimatedImpact: 4499,
    evidence: [
      "Payment attempt failed with bank_decline, order still in pending state",
      "Customer completed a successful payment on this account 3 weeks ago",
      "No prior recovery attempt has been made on this order",
    ],
    recommendedAction: "Send a one-tap retry link via the existing payment_attempts idempotency key",
    policyChecks: [
      { label: "Attempt count under max retries (1/3)", passed: true },
      { label: "Order not expired", passed: true },
      { label: "Amount under auto-approval ceiling", passed: true },
    ],
  },
  {
    id: "opp_03",
    type: "ABANDONED_CHECKOUT",
    title: "Recover abandoned cart with recovery-tier offer",
    customer: "Meera S.",
    order: "ORD-8802",
    score: 61,
    estimatedImpact: 1299,
    evidence: [
      "Cart created 6 hours ago, never reached checkout",
      "Cart contains one item with 12% MoM demand growth",
      "Customer has an active, verified email on file",
    ],
    recommendedAction: "Trigger a single recovery email with a 5% incentive, capped once per order",
    policyChecks: [
      { label: "Recovery email not already sent", passed: true },
      { label: "Incentive within merchant cap", passed: true },
      { label: "Customer marketing consent on file", passed: false },
    ],
  },
  {
    id: "opp_04",
    type: "UPSELL",
    title: "Suggest premium tier for repeat sock buyer",
    customer: "Devansh P.",
    order: "ORD-8710",
    score: 52,
    estimatedImpact: 320,
    evidence: [
      "Third purchase of Compression Runner Socks in 60 days",
      "Premium merino variant priced 24% higher, same category",
      "Category retention rate for repeat buyers: 71%",
    ],
    recommendedAction: "Surface premium variant as the default recommendation on next visit",
    policyChecks: [
      { label: "Price delta within upsell threshold", passed: true },
      { label: "Premium variant in stock", passed: true },
      { label: "No recent price-sensitivity signal", passed: true },
    ],
  },
];

/**
 * MOCK DATA — synthetic revenue/analytics series for marketing pages
 * (`/product/revenue-engine`, `/product/analytics`, `/demo`). Never
 * sourced from or written to the live backend.
 */

export const MOCK_REVENUE_TREND = [
  { label: "Mon", value: 42000 },
  { label: "Tue", value: 48500 },
  { label: "Wed", value: 45200 },
  { label: "Thu", value: 61800 },
  { label: "Fri", value: 58300 },
  { label: "Sat", value: 73100 },
  { label: "Sun", value: 69700 },
];

export const MOCK_REVENUE_SUMMARY = {
  totalOpportunities: 42,
  approved: 27,
  executed: 21,
  estimatedImpact: 186400,
  recoveryRate: 0.64,
};

export const MOCK_OPPORTUNITY_TYPES = [
  { type: "CROSS_SELL", count: 14, share: 0.33 },
  { type: "UPSELL", count: 9, share: 0.21 },
  { type: "PAYMENT_RECOVERY", count: 11, share: 0.26 },
  { type: "ABANDONED_CHECKOUT", count: 6, share: 0.14 },
  { type: "REVENUE_DROP", count: 2, share: 0.06 },
];

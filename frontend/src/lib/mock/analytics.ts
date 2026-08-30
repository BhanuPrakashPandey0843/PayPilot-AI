/**
 * MOCK DATA — merchant analytics dashboard figures for `/product/analytics`
 * and `/demo`. All synthetic, illustrative only.
 */

export const MOCK_ANALYTICS_KPIS = [
  { label: "Gross revenue (30d)", value: "₹18,42,900", trend: 12.4 },
  { label: "Orders (30d)", value: "2,542", trend: 8.1 },
  { label: "Payment failure rate", value: "3.2%", trend: -1.6 },
  { label: "Recovered revenue", value: "₹1,86,400", trend: 24.5 },
];

export const MOCK_TOP_PRODUCTS = [
  { name: "Trailrunner Mesh Sneaker", revenue: 412300, units: 92 },
  { name: "Hydration Vest 5L", revenue: 268900, units: 41 },
  { name: "Compression Runner Socks", revenue: 141200, units: 177 },
  { name: "Recovery Slide", revenue: 98700, units: 52 },
];

export const MOCK_ORDER_STATUS_BREAKDOWN = [
  { status: "paid", count: 1980, tone: "#2BC48A" },
  { status: "pending", count: 214, tone: "#FFB020" },
  { status: "failed", count: 118, tone: "#FF5A5F" },
  { status: "refunded", count: 34, tone: "#8C7BE0" },
];

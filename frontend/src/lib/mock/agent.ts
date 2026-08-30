/**
 * MOCK DATA — sample conversation turns for the AI Agent demo/marketing
 * pages. Purely illustrative; the real commerce agent's intent
 * extraction is deterministic pattern-matching today (see
 * `commerce-agent/intent.service.ts` in the backend), not an LLM.
 */

export type MockAgentTurn = {
  role: "buyer" | "agent";
  text: string;
  meta?: string;
};

export const MOCK_AGENT_CONVERSATION: MockAgentTurn[] = [
  { role: "buyer", text: "Looking for running shoes under ₹5,000, something breathable." },
  {
    role: "agent",
    text: "Found 3 matches. Top pick: Trailrunner Mesh Sneaker — ₹4,499, 94% match on breathability and price.",
    meta: "matchScore 0.94 · intent: PRODUCT_SEARCH",
  },
  { role: "buyer", text: "Does it come with socks?" },
  {
    role: "agent",
    text: "Not bundled by default, but I can add Compression Runner Socks (3-pack) for ₹799 — 68% of buyers pair these two.",
    meta: "intent: CROSS_SELL_SUGGESTION · bounded to catalog data only",
  },
  { role: "buyer", text: "Yes, add both to cart." },
  {
    role: "agent",
    text: "Added. Subtotal ₹5,298. Ready to preview checkout whenever you are — nothing is charged yet.",
    meta: "intent: ADD_TO_CART · session-scoped, no payment action taken",
  },
];

export const AGENT_CAPABILITIES = [
  "Conversational product discovery",
  "Deterministic intent extraction (swappable for an LLM later)",
  "Cart and session state management",
  "Match scoring with explainable reasons[]",
  "Checkout preview — never calls Razorpay directly",
];

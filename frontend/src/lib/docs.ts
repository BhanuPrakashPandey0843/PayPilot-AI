/**
 * Documentation nav config — single source of truth for both the docs
 * index (`/docs`) and each article page (`/docs/[slug]`). Sections
 * mirror the real backend module boundaries (see
 * `documentation/Backend_API_Reference.md`) rather than a generic
 * "buyer/seller" split, since PayPilot AI is a merchant-facing product.
 */

export type DocEntry = {
  slug: string;
  title: string;
  description: string;
};

export type DocGroup = {
  heading: string;
  entries: DocEntry[];
};

export const DOCS_NAV: DocGroup[] = [
  {
    heading: "Getting Started",
    entries: [
      { slug: "introduction", title: "Introduction", description: "What PayPilot AI is and how the pieces fit together." },
      { slug: "quickstart", title: "Quickstart", description: "Register an organization and make your first API call." },
    ],
  },
  {
    heading: "Core Platform",
    entries: [
      { slug: "auth", title: "Auth", description: "Register, log in, and organization-scoped sessions." },
      { slug: "catalog", title: "Products & Catalog", description: "Manage your product catalog." },
      { slug: "customers", title: "Customers", description: "Track the people who buy from you." },
    ],
  },
  {
    heading: "Agentic Commerce",
    entries: [
      { slug: "agent-catalog", title: "Agent Catalog", description: "The machine-readable view of your catalog." },
      { slug: "commerce-agent", title: "Commerce Agent", description: "Conversational search, cart and order preview." },
      { slug: "checkout", title: "Checkout", description: "Creating orders and verifying payments." },
    ],
  },
  {
    heading: "Money & Trust",
    entries: [
      { slug: "payments", title: "Payments", description: "Payment history and reconciliation." },
      { slug: "webhooks", title: "Webhooks", description: "Razorpay webhook delivery and idempotency." },
      { slug: "audit-trail", title: "Audit Trail", description: "Every money action, explainable and reviewable." },
      { slug: "security", title: "Security", description: "How PayPilot AI bounds and gates automated actions." },
    ],
  },
  {
    heading: "Growth",
    entries: [
      { slug: "analytics", title: "Analytics", description: "Revenue, product and payment-performance reporting." },
      { slug: "revenue-opportunities", title: "Revenue Opportunities", description: "Detection, scoring, and the approval workflow." },
      { slug: "ai-copilot", title: "AI Copilot", description: "A bounded, read-only assistant for merchants." },
    ],
  },
];

export const ALL_DOC_ENTRIES: DocEntry[] = DOCS_NAV.flatMap((group) => group.entries);

export function getDocEntry(slug: string): DocEntry | undefined {
  return ALL_DOC_ENTRIES.find((entry) => entry.slug === slug);
}

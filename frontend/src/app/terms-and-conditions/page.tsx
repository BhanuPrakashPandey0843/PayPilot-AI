import { LegalPage } from "@/components/legal/LegalPage";

const sections = [
  {
    heading: "About PayPilot",
    paragraphs: [
      "Welcome to PayPilot AI. These Terms & Conditions govern access to and use of the PayPilot website, application, AI features, merchant dashboard, demos, and related functionality.",
      "PayPilot is an AI-powered commerce prototype created for a technology hackathon. It demonstrates how AI can assist merchants and users with product discovery, recommendations, offers, revenue opportunities, conversational commerce, and controlled payment workflows.",
      "PayPilot is intended as a demonstration and evaluation project and should not be treated as a production financial service or a licensed payment provider.",
    ],
  },
  {
    heading: "Prototype and demonstration disclaimer",
    paragraphs: [
      "The application may change without notice, may contain incomplete features, may display synthetic or test data, and may be temporarily unavailable. PayPilot should not be relied on as a production finance, accounting, payment, or commerce system.",
      "Features may be experimental, limited in scope, and intentionally designed for demonstration only.",
    ],
  },
  {
    heading: "Test transactions and sandbox usage",
    paragraphs: [
      "Where Razorpay functionality is demonstrated, PayPilot uses Razorpay Test Mode. Test Mode is a sandbox environment intended for integration testing and does not use real money. Any amounts, orders, payment IDs, or revenue figures shown during the prototype may be synthetic or test data.",
      "No real payment should be considered completed through the PayPilot hackathon environment. Users should treat the demo as a safe testing workflow, not a real transaction system.",
    ],
  },
  {
    heading: "AI-generated recommendations",
    paragraphs: [
      "PayPilot uses AI to generate recommendations and assist with commerce workflows. AI outputs may include product suggestions, revenue opportunity summaries, intent classifications, campaign ideas, or other guidance.",
      "AI-generated information may be incomplete or inaccurate. You should independently review important information before relying on it for business, financial, or commercial decisions.",
    ],
  },
  {
    heading: "Bounded AI actions",
    paragraphs: [
      "PayPilot is designed around explainable, bounded, gated, and auditable AI actions. The system should not be treated as having unrestricted authority over financial actions or business decisions.",
      "Depending on the workflow, limits may be imposed by product rules, merchant policies, discount constraints, risk controls, approval requirements, or other safeguards. Human review remains important for important actions.",
    ],
  },
  {
    heading: "Merchant responsibilities",
    paragraphs: [
      "If you use PayPilot as a merchant, you are responsible for maintaining accurate information, protecting access and credentials, reviewing AI-generated recommendations, ensuring compliance with applicable laws, and using the application in a responsible manner.",
      "Never publish or expose secret API credentials, especially for secure payment providers. Appropriate credential management and access controls remain the responsibility of the user or team operating the project.",
    ],
  },
  {
    heading: "Prohibited use",
    paragraphs: [
      "You may not use PayPilot to conduct fraudulent transactions, misuse payment infrastructure, push unauthorized payments, expose or misuse credentials, manipulate records, or engage in unlawful activity. You may not interfere with the application's operation or attempt to access systems without authorization.",
    ],
  },
  {
    heading: "No financial advice and third-party services",
    paragraphs: [
      "PayPilot recommendations are not financial, investment, legal, tax, or accounting advice. Revenue projections or opportunity estimates are illustrative and should not be treated as guarantees of actual results.",
      "The service may rely on third-party AI providers, hosting providers, or payment integrations. PayPilot is not responsible for issues, changes, or interruptions caused by those third-party services.",
    ],
  },
  {
    heading: "Intellectual property and availability",
    paragraphs: [
      "The PayPilot name, visual design, interface, documentation, and project materials are protected to the extent applicable by intellectual-property law. Third-party names, trademarks, APIs, and services remain the property of their respective owners.",
      "PayPilot is provided as-is and may be modified, suspended, or discontinued at any time without notice. We do not guarantee uninterrupted availability, perfect accuracy, or complete compatibility with every device or third-party service.",
    ],
  },
  {
    heading: "Limitation of liability and changes",
    paragraphs: [
      "To the maximum extent permitted by applicable law, PayPilot and its project contributors shall not be liable for losses arising from reliance on AI-generated recommendations, demo data, simulated transactions, errors, or third-party service failures. These Terms may be updated as the project evolves, and continued use of the application after an update indicates acceptance of the revised Terms.",
    ],
  },
  {
    heading: "Contact",
    paragraphs: [
      "If you have questions about these Terms, the hackathon prototype, or the project’s usage limitations, please contact the project team through the contact information provided in the application or project repository.",
    ],
  },
];

export default function TermsAndConditionsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      intro="These terms explain the responsible, demo-first use of PayPilot AI and clarify the scope of the prototype, sandbox workflows, and AI-assisted commerce features."
      lastUpdated="August 22, 2026"
      sections={sections}
      ctaLabel="Back to home"
    />
  );
}

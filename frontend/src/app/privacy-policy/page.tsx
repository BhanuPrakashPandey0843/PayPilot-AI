import { LegalPage } from "@/components/legal/LegalPage";

const sections = [
  {
    heading: "Overview",
    paragraphs: [
      "PayPilot AI (\"PayPilot\", \"we\", \"our\", or \"us\") is an AI-powered agentic commerce prototype created for demonstration, testing, and hackathon evaluation. It is designed to help merchants discover revenue opportunities, understand customer intent, recommend products, and facilitate controlled commerce workflows.",
      "This Privacy Policy explains the information that may be processed when you use the PayPilot website, demo experience, AI features, merchant dashboard, and related prototype services.",
      "Important: PayPilot is a prototype and is not intended to be a production financial service. Any payment workflows shown in the application use test or sandbox environments where applicable and are not intended to process real customer funds.",
    ],
  },
  {
    heading: "Information we may collect",
    paragraphs: [
      "Depending on how you interact with PayPilot, the application may process information such as account details, merchant profile information, product and commerce context, recommendations, orders, customer preferences, and AI interaction data.",
      "This may include name, email address, merchant or store name, product information, cart details, order status, inventory context, purchase intent, offer history, and user prompts submitted to the AI system.",
    ],
    list: [
      "Account information: name, email address, preferences, merchant profile details, and authentication data.",
      "Commerce information: product names, prices, inventory states, order details, customer preferences, and purchase intent.",
      "AI interaction data: user instructions, product requests, merchant queries, and analytical prompts used to generate recommendations.",
    ],
  },
  {
    heading: "How we use information",
    paragraphs: [
      "We use information processed through PayPilot to provide the application, improve the prototype, generate recommendations, surface opportunity insights, improve audit trails, detect failures, and maintain security. PayPilot's AI suggestions are designed to assist users and merchants, but they should not be interpreted as guaranteed revenue, conversion, or financial outcomes.",
    ],
  },
  {
    heading: "AI processing",
    paragraphs: [
      "PayPilot may process natural-language prompts and related commerce context using AI models to generate product recommendations, insights, and workflow decisions. AI-generated outputs may contain errors or inaccuracies, and important decisions should always be reviewed before being relied on.",
      "The prototype is designed to keep important commerce actions bounded, explainable, and subject to user oversight rather than allowing unrestricted autonomous financial behavior.",
    ],
  },
  {
    heading: "Payment information",
    paragraphs: [
      "PayPilot's hackathon implementation is built around Razorpay Test Mode. Test Mode is a sandbox environment intended for testing integrations and does not process real payments. Razorpay documents that Test Mode is designed for development and validation rather than live money movement.",
      "Therefore, PayPilot does not intend to store or process real card numbers, CVV values, UPI PINs, banking credentials, or similar sensitive payment data. Where payment functionality is demonstrated, it should be handled through the relevant provider's supported test environment and secret management practices.",
      "Any API credentials, especially secret keys, should never be exposed in frontend code or public repositories. Payment providers typically require secret keys to remain protected in secure server-side environments.",
    ],
  },
  {
    heading: "Cookies, logs, and technical information",
    paragraphs: [
      "The application may process technical details such as browser type, device metadata, operating system information, approximate session data, IP address, logs, and error or performance information. This information supports reliability, debugging, and platform security.",
    ],
  },
  {
    heading: "Data sharing",
    paragraphs: [
      "PayPilot does not intend to sell personal information, but it may share information with service providers necessary to operate the prototype, such as hosting providers, AI model providers, analytics services, monitoring tools, or authentication systems. These services operate under their own privacy terms and policies.",
    ],
  },
  {
    heading: "Data security and retention",
    paragraphs: [
      "We take reasonable measures to protect information used by the application, such as server-side processing, restricted access, secure configuration, and environment-based secret management. However, no internet-based system can guarantee absolute security.",
      "We retain information only as long as reasonably necessary for testing, debugging, security, evaluation, and service functionality. Because PayPilot is a prototype, synthetic or test data may be periodically reset or removed.",
    ],
  },
  {
    heading: "Children and third-party services",
    paragraphs: [
      "PayPilot is not intended for children under the age of 18 and we do not knowingly collect personal information from children for commerce use cases. The application may integrate with third-party services whose privacy practices are governed by their own policies and terms.",
    ],
  },
  {
    heading: "Changes and contact",
    paragraphs: [
      "We may update this Privacy Policy as the project evolves. When changes are made, the updated version will be posted on this page with a revised last-updated date. For questions about this Privacy Policy or the PayPilot prototype, please contact the project team through the contact information provided in the application or project repository.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="PayPilot AI processes limited demo and prototype data to showcase secure, AI-assisted commerce workflows in a controlled environment."
      lastUpdated="August 22, 2026"
      sections={sections}
      ctaLabel="Back to home"
    />
  );
}

import type { Metadata } from "next";

import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Cookie Policy — PayPilot AI",
  description: "How PayPilot AI uses cookies and similar technologies across the website and prototype application.",
};

const sections = [
  {
    heading: "What cookies are",
    paragraphs: [
      "Cookies are small text files stored on your device when you visit a website. PayPilot AI uses cookies and similar technologies (such as local storage) to keep the application working correctly and to understand how the prototype is used.",
    ],
  },
  {
    heading: "How we use them",
    paragraphs: [
      "As a hackathon prototype, PayPilot AI keeps cookie usage minimal and functional rather than advertising-driven.",
    ],
    list: [
      "Essential cookies: session identifiers required for authentication and the commerce-agent chat session (`sessionId`) to work.",
      "Preference cookies: remembering interface choices such as a selected theme, where applicable.",
      "Analytics cookies: basic, aggregated usage information to help us understand and improve the prototype.",
    ],
  },
  {
    heading: "Third-party cookies",
    paragraphs: [
      "Where the application integrates with third-party services — such as Razorpay's test-mode checkout — those providers may set their own cookies governed by their own policies.",
    ],
  },
  {
    heading: "Managing cookies",
    paragraphs: [
      "Most browsers let you block or delete cookies through their settings. Disabling essential cookies may prevent parts of the application, such as sign-in or the commerce-agent demo, from working correctly.",
    ],
  },
  {
    heading: "Changes and contact",
    paragraphs: [
      "We may update this Cookie Policy as the project evolves. For questions, please contact the project team through the contact information provided on the Contact page.",
    ],
  },
];

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      intro="A short, plain-language explanation of the cookies PayPilot AI uses and why."
      lastUpdated="August 22, 2026"
      sections={sections}
      ctaLabel="Back to home"
    />
  );
}

import type { Metadata } from "next";
import { Bot, MessageSquare, GitBranch, ShieldCheck } from "lucide-react";

import { ProductFeaturePage } from "@/components/marketing/ProductFeaturePage";

export const metadata: Metadata = {
  title: "AI Agent — PayPilot AI",
  description: "A bounded commerce agent for conversational discovery, and a read-only copilot for merchant analytics.",
};

export default function AIAgentPage() {
  return (
    <ProductFeaturePage
      eyebrow="Product · AI Agent"
      title="Two agents,"
      accent="one policy."
      description="A commerce agent that talks to buyers, and an AI copilot that talks to your team — both bounded by the same explainability and permission rules."
      highlights={[
        {
          icon: MessageSquare,
          title: "Commerce Agent",
          body: "Handles product search, comparison, cart management and order preview through natural language. Intent extraction is deterministic pattern-matching today, deliberately isolated so an LLM can be swapped in later without touching the cart logic.",
        },
        {
          icon: Bot,
          title: "AI Copilot",
          body: "A read-only assistant for merchants that answers questions about revenue, products and payments — never invents a number, always cites a tool call, and caps itself at 4 tool iterations before giving an honest \"I don't know.\"",
        },
        {
          icon: GitBranch,
          title: "Bounded tool layer",
          body: "The copilot has exactly 6 tools, every one read-only and organization-scoped by the server — never by the model's own input — so it can discuss an opportunity but never approve or execute one.",
        },
        {
          icon: ShieldCheck,
          title: "Graceful fallback",
          body: "If the configured AI provider fails mid-conversation, PayPilot switches to a deterministic template provider for the rest of that conversation and logs the failure — no silent retries, no hallucinated recovery.",
        },
      ]}
    />
  );
}

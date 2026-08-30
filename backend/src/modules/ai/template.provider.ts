import { randomUUID } from "node:crypto";
import type { AIContentBlock, AIGenerateResult, AIProvider } from "./provider.types.js";

/**
 * Deterministic, no-API-key-required fallback provider (Milestone 6
 * Phase 12 — "AI unavailable -> analytics/opportunities still work, no
 * money action occurs"). Used automatically whenever neither
 * ANTHROPIC_API_KEY nor OPENAI_API_KEY is configured, and as the
 * documented behavior when a real provider call fails mid-conversation.
 *
 * This is NOT a language model: round 1 always requests a fixed,
 * deterministic pair of read-only tools (whichever of
 * getRevenueOverview/getRevenueOpportunities are available); round 2
 * formats whatever structured JSON those tools returned into plain
 * sentences — it never invents a number that isn't already present in
 * the tool result. If the requested tools aren't available it falls
 * back to a fixed "AI copilot is temporarily unavailable" message
 * pointing at the deterministic analytics endpoints instead.
 */
export function createTemplateProvider(): AIProvider {
  return {
    name: "template",
    async generate({ messages, tools }) {
      const lastMessage = messages[messages.length - 1];
      const hasToolResults =
        lastMessage?.role === "user" && lastMessage.content.some((b) => b.type === "tool_result");

      if (!hasToolResults) {
        const toolNames = tools.map((t) => t.name);
        const wanted = ["getRevenueOverview", "getRevenueOpportunities"].filter((n) => toolNames.includes(n));

        if (wanted.length === 0) {
          const content: AIContentBlock[] = [
            {
              type: "text",
              text:
                "The AI copilot is running in deterministic fallback mode (no AI provider configured) and no " +
                "compatible tools are available right now. You can still get full detail from " +
                "GET /api/v1/analytics/overview and GET /api/v1/revenue/opportunities directly.",
            },
          ];
          const result: AIGenerateResult = { content, stopReason: "end_turn" };
          return result;
        }

        const content: AIContentBlock[] = wanted.map((name) => ({
          type: "tool_use",
          id: `template_${randomUUID()}`,
          name,
          input: {},
        }));
        const result: AIGenerateResult = { content, stopReason: "tool_use" };
        return result;
      }

      // Round 2: format whatever tool_result JSON we were given. Never
      // fabricates a number — every figure below is read straight out
      // of the tool_result content string.
      const summaries: string[] = [];
      for (const block of lastMessage!.content) {
        if (block.type !== "tool_result") continue;
        try {
          const parsed = JSON.parse(block.content);
          summaries.push(summarizeToolResult(parsed));
        } catch {
          // Non-JSON tool result — skip rather than guess at its shape.
        }
      }

      const text =
        summaries.length > 0
          ? [
              "AI copilot running in deterministic fallback mode (no AI provider configured) — here is the " +
                "backend-calculated data directly, with no AI-generated interpretation:",
              ...summaries,
            ].join("\n\n")
          : "No data was available from the requested tools.";

      const content: AIContentBlock[] = [{ type: "text", text }];
      const result: AIGenerateResult = { content, stopReason: "end_turn" };
      return result;
    },
  };
}

function summarizeToolResult(data: unknown): string {
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if ("totalRevenueMinor" in obj) {
      return (
        `Revenue overview: total revenue ${obj.totalRevenueMinor} minor units (${obj.currency ?? ""}), ` +
        `${obj.orderCount ?? "?"} orders, ${obj.successfulPayments ?? "?"} successful payments, ` +
        `${obj.failedPayments ?? "?"} failed payments, revenue growth ${obj.revenueGrowthPercent ?? "n/a"}%.`
      );
    }
    if (Array.isArray(obj.opportunities ?? obj)) {
      const list = Array.isArray(obj.opportunities) ? obj.opportunities : (obj as unknown as unknown[]);
      if (list.length === 0) return "No open revenue opportunities were found.";
      const lines = (list as Record<string, unknown>[])
        .slice(0, 5)
        .map((o) => `- [${o.type}] ${o.title} (score ${o.score}, est. impact ${o.estimatedRevenueImpact} minor units)`);
      return ["Revenue opportunities:", ...lines].join("\n");
    }
  }
  return `Data: ${JSON.stringify(data)}`;
}

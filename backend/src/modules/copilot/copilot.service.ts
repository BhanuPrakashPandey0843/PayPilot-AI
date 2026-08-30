/**
 * Milestone 6 Phase 7 — AI Merchant Copilot orchestration.
 *
 * The bounded agentic loop: ask the provider -> if it wants a tool,
 * execute ONLY that bounded, validated, org-scoped tool -> feed the
 * result back -> repeat until the model produces a final text answer or
 * a hard iteration cap is hit. The model is never given direct database
 * or SQL access (Phase 7 hard rule) — it can only ever request one of
 * the named tools in copilot.tools.ts.
 */
import { randomUUID } from "node:crypto";
import { emitAudit } from "../../utils/audit.js";
import { resolveConfiguredProvider, getTemplateProvider, AIProviderError } from "../ai/provider.js";
import type { AICanonicalMessage, AIContentBlock, AIProvider } from "../ai/provider.types.js";
import { listToolSpecs, getTool } from "./copilot.tools.js";

const MAX_TOOL_ITERATIONS = 4;

const SYSTEM_PROMPT = `You are the PayPilot AI Merchant Copilot, helping a merchant understand and grow their revenue.

HARD RULES — you must follow these exactly:
1. You have NO direct database or SQL access. The ONLY way you can learn anything about this merchant's business is by calling one of the tools you've been given.
2. NEVER invent, estimate, or guess a number, percentage, customer name, product name, or transaction ID. Every figure in your answer must come directly from a tool result.
3. If the tools available don't give you enough information to answer confidently, say so plainly instead of guessing.
4. You cannot execute any financial action (approving an opportunity, issuing a refund, changing an order) — you can only explain data and suggest what the merchant might want to review or approve themselves through the product UI.
5. When you cite a number, it should be traceable to a specific tool call you made in this conversation.
6. Be concise and direct. Use the evidence to explain WHY something is happening, not just WHAT the numbers are.`;

export interface CopilotToolCallLog {
  name: string;
  input: Record<string, unknown>;
  ok: boolean;
}

export interface CopilotChatResult {
  reply: string;
  provider: "anthropic" | "openai" | "template";
  toolCalls: CopilotToolCallLog[];
}

async function generateWithFallback(
  provider: AIProvider,
  params: Parameters<AIProvider["generate"]>[0],
  actor: { userId: string; organizationId: string; roleId: string; role: string }
): Promise<{ result: Awaited<ReturnType<AIProvider["generate"]>>; providerUsed: AIProvider["name"] }> {
  try {
    const result = await provider.generate(params);
    return { result, providerUsed: provider.name };
  } catch (err) {
    if (provider.name === "template") throw err; // template must never fail

    emitAudit({
      type: "AI_PROVIDER_FAILED",
      actor: { userId: actor.userId, organizationId: actor.organizationId, roleId: actor.roleId, role: actor.role },
      target: { kind: "ai_action", extras: { provider: provider.name } },
      context: { reason: err instanceof AIProviderError ? err.message : "unknown error" },
    });

    // Phase 12 — AI failure handling: fall back to the deterministic
    // template provider rather than failing the whole request.
    const fallback = getTemplateProvider();
    const result = await fallback.generate(params);
    return { result, providerUsed: fallback.name };
  }
}

export async function runCopilotChat(
  organizationId: string,
  message: string,
  actor: { userId: string; roleId: string; role: string }
): Promise<CopilotChatResult> {
  emitAudit({
    type: "AI_COPILOT_REQUESTED",
    actor: { userId: actor.userId, organizationId, roleId: actor.roleId, role: actor.role },
    target: { kind: "ai_action" },
    context: { messageLength: message.length },
  });

  const provider = resolveConfiguredProvider();
  const tools = listToolSpecs();
  const toolCallLog: CopilotToolCallLog[] = [];

  const messages: AICanonicalMessage[] = [{ role: "user", content: [{ type: "text", text: message }] }];

  let finalText = "";
  let providerUsedName: CopilotChatResult["provider"] = provider.name;
  let activeProvider = provider;

  for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
    const { result, providerUsed } = await generateWithFallback(
      activeProvider,
      { system: SYSTEM_PROMPT, messages, tools },
      { userId: actor.userId, organizationId, roleId: actor.roleId, role: actor.role }
    );
    providerUsedName = providerUsed;
    // Once we've fallen back, stay on the template provider for the rest
    // of this conversation rather than re-attempting the failing one.
    if (providerUsed === "template" && activeProvider.name !== "template") {
      activeProvider = getTemplateProvider();
    }

    messages.push({ role: "assistant", content: result.content });

    const textBlocks = result.content.filter((b): b is Extract<AIContentBlock, { type: "text" }> => b.type === "text");
    if (textBlocks.length > 0) finalText = textBlocks.map((b) => b.text).join("\n");

    const toolUseBlocks = result.content.filter((b): b is Extract<AIContentBlock, { type: "tool_use" }> => b.type === "tool_use");
    if (result.stopReason !== "tool_use" || toolUseBlocks.length === 0) {
      break;
    }

    const toolResultBlocks: AIContentBlock[] = [];
    for (const call of toolUseBlocks) {
      const tool = getTool(call.name);
      if (!tool) {
        emitAudit({
          type: "AI_TOOL_CALL_REJECTED",
          actor: { userId: actor.userId, organizationId, roleId: actor.roleId, role: actor.role },
          target: { kind: "ai_action", extras: { toolName: call.name, reason: "unknown_tool" } },
          context: {},
        });
        toolCallLog.push({ name: call.name, input: call.input, ok: false });
        toolResultBlocks.push({ type: "tool_result", tool_use_id: call.id, content: `Unknown tool "${call.name}"`, is_error: true });
        continue;
      }

      try {
        const output = await tool.execute(organizationId, call.input);
        emitAudit({
          type: "AI_TOOL_CALLED",
          actor: { userId: actor.userId, organizationId, roleId: actor.roleId, role: actor.role },
          target: { kind: "ai_action", extras: { toolName: call.name } },
          context: {},
        });
        toolCallLog.push({ name: call.name, input: call.input, ok: true });
        toolResultBlocks.push({ type: "tool_result", tool_use_id: call.id, content: JSON.stringify(output) });
      } catch (err) {
        emitAudit({
          type: "AI_TOOL_CALL_REJECTED",
          actor: { userId: actor.userId, organizationId, roleId: actor.roleId, role: actor.role },
          target: { kind: "ai_action", extras: { toolName: call.name, reason: "execution_failed" } },
          context: {},
        });
        toolCallLog.push({ name: call.name, input: call.input, ok: false });
        const message = err instanceof Error ? err.message : "Tool execution failed";
        toolResultBlocks.push({ type: "tool_result", tool_use_id: call.id, content: message, is_error: true });
      }
    }

    messages.push({ role: "user", content: toolResultBlocks });
  }

  if (!finalText) {
    finalText =
      "I wasn't able to reach a final answer within the allowed number of tool calls. Try asking a more specific question, " +
      "or check GET /api/v1/analytics/overview and GET /api/v1/revenue/opportunities directly.";
  }

  emitAudit({
    type: "AI_RECOMMENDATION_GENERATED",
    actor: { userId: actor.userId, organizationId, roleId: actor.roleId, role: actor.role },
    target: { kind: "ai_action", extras: { provider: providerUsedName, toolCallCount: toolCallLog.length } },
    context: { id: randomUUID() },
  });

  return { reply: finalText, provider: providerUsedName, toolCalls: toolCallLog };
}

import { randomUUID } from "node:crypto";
import { env } from "../../config/env.js";
import type { AIContentBlock, AIGenerateResult, AIProvider, AIStopReason } from "./provider.types.js";
import { AIProviderError } from "./provider.types.js";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_TOKENS = 1024;

interface OpenAIChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_call_id?: string;
  tool_calls?: { id: string; type: "function"; function: { name: string; arguments: string } }[];
}

function mapFinishReason(raw: string | null | undefined): AIStopReason {
  if (raw === "tool_calls") return "tool_use";
  if (raw === "length") return "max_tokens";
  return "end_turn";
}

export function createOpenAIProvider(): AIProvider {
  return {
    name: "openai",
    async generate({ system, messages, tools }) {
      if (!env.OPENAI_API_KEY) {
        throw new AIProviderError("openai", "OPENAI_API_KEY is not configured");
      }

      // --- canonical (Anthropic-shaped) messages -> OpenAI chat messages ---
      const openaiMessages: OpenAIChatMessage[] = [{ role: "system", content: system }];
      for (const msg of messages) {
        if (msg.role === "assistant") {
          const textParts: string[] = [];
          const toolCalls: NonNullable<OpenAIChatMessage["tool_calls"]> = [];
          for (const block of msg.content) {
            if (block.type === "text") textParts.push(block.text);
            else if (block.type === "tool_use") {
              toolCalls.push({
                id: block.id,
                type: "function",
                function: { name: block.name, arguments: JSON.stringify(block.input) },
              });
            }
          }
          openaiMessages.push({
            role: "assistant",
            content: textParts.length > 0 ? textParts.join("\n") : null,
            tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
          });
        } else {
          // role === "user" — may contain plain text and/or tool_result blocks.
          for (const block of msg.content) {
            if (block.type === "text") {
              openaiMessages.push({ role: "user", content: block.text });
            } else if (block.type === "tool_result") {
              openaiMessages.push({ role: "tool", tool_call_id: block.tool_use_id, content: block.content });
            }
          }
        }
      }

      const openaiTools =
        tools.length > 0
          ? tools.map((t) => ({ type: "function" as const, function: { name: t.name, description: t.description, parameters: t.input_schema } }))
          : undefined;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      let response: Response;
      try {
        response = await fetch(OPENAI_API_URL, {
          method: "POST",
          signal: controller.signal,
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: env.OPENAI_MODEL,
            max_tokens: MAX_TOKENS,
            messages: openaiMessages,
            tools: openaiTools,
          }),
        });
      } catch (err) {
        throw new AIProviderError("openai", "Request to OpenAI API failed", err);
      } finally {
        clearTimeout(timeout);
      }

      if (!response.ok) {
        const bodyText = await response.text().catch(() => "");
        throw new AIProviderError("openai", `OpenAI API returned ${response.status}: ${bodyText.slice(0, 500)}`);
      }

      const data = (await response.json()) as {
        choices?: { message?: { content?: string | null; tool_calls?: OpenAIChatMessage["tool_calls"] }; finish_reason?: string }[];
      };

      const choice = data.choices?.[0];
      if (!choice?.message) {
        throw new AIProviderError("openai", "Malformed OpenAI API response: missing choices[0].message");
      }

      // --- OpenAI response -> canonical content blocks ---
      const content: AIContentBlock[] = [];
      if (choice.message.content) content.push({ type: "text", text: choice.message.content });
      for (const call of choice.message.tool_calls ?? []) {
        let input: Record<string, unknown> = {};
        try {
          input = JSON.parse(call.function.arguments || "{}");
        } catch {
          // Malformed tool-call arguments — surfaced as an empty input object;
          // the tool layer's own Zod validation will reject it cleanly.
        }
        content.push({ type: "tool_use", id: call.id || randomUUID(), name: call.function.name, input });
      }

      const result: AIGenerateResult = { content, stopReason: mapFinishReason(choice.finish_reason) };
      return result;
    },
  };
}

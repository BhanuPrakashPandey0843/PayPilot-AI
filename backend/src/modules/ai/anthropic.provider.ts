import { env } from "../../config/env.js";
import type { AICanonicalMessage, AIGenerateResult, AIProvider, AIStopReason, AIToolSpec } from "./provider.types.js";
import { AIProviderError } from "./provider.types.js";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_TOKENS = 1024;

function mapStopReason(raw: string | null | undefined): AIStopReason {
  if (raw === "tool_use") return "tool_use";
  if (raw === "max_tokens") return "max_tokens";
  return "end_turn";
}

export function createAnthropicProvider(): AIProvider {
  return {
    name: "anthropic",
    async generate({ system, messages, tools }) {
      if (!env.ANTHROPIC_API_KEY) {
        throw new AIProviderError("anthropic", "ANTHROPIC_API_KEY is not configured");
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      let response: Response;
      try {
        response = await fetch(ANTHROPIC_API_URL, {
          method: "POST",
          signal: controller.signal,
          headers: {
            "content-type": "application/json",
            "x-api-key": env.ANTHROPIC_API_KEY,
            "anthropic-version": ANTHROPIC_VERSION,
          },
          body: JSON.stringify({
            model: env.ANTHROPIC_MODEL,
            max_tokens: MAX_TOKENS,
            system,
            messages: messages as unknown,
            tools: tools.length > 0 ? (tools as unknown) : undefined,
          }),
        });
      } catch (err) {
        throw new AIProviderError("anthropic", "Request to Anthropic API failed", err);
      } finally {
        clearTimeout(timeout);
      }

      if (!response.ok) {
        const bodyText = await response.text().catch(() => "");
        throw new AIProviderError("anthropic", `Anthropic API returned ${response.status}: ${bodyText.slice(0, 500)}`);
      }

      const data = (await response.json()) as {
        content?: AIGenerateResult["content"];
        stop_reason?: string | null;
      };

      if (!Array.isArray(data.content)) {
        throw new AIProviderError("anthropic", "Malformed Anthropic API response: missing content array");
      }

      return { content: data.content, stopReason: mapStopReason(data.stop_reason) };
    },
  };
}

export type { AICanonicalMessage, AIToolSpec };

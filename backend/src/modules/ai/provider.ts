/**
 * AI provider abstraction (Milestone 6 Phase 7). Nothing above this
 * module (copilot.service.ts) imports Anthropic- or OpenAI-specific
 * code directly — everything goes through the AIProvider interface
 * defined in provider.types.ts.
 *
 * Resolution order: ANTHROPIC_API_KEY wins if set (documented in
 * config/env.ts); else OPENAI_API_KEY; else the deterministic
 * template fallback, which requires no key and never fails to respond
 * (Phase 12 — AI failure handling).
 */
import { env } from "../../config/env.js";
import type { AIProvider } from "./provider.types.js";
import { createAnthropicProvider } from "./anthropic.provider.js";
import { createOpenAIProvider } from "./openai.provider.js";
import { createTemplateProvider } from "./template.provider.js";

export function resolveConfiguredProvider(): AIProvider {
  if (env.ANTHROPIC_API_KEY) return createAnthropicProvider();
  if (env.OPENAI_API_KEY) return createOpenAIProvider();
  return createTemplateProvider();
}

export function getTemplateProvider(): AIProvider {
  return createTemplateProvider();
}

export * from "./provider.types.js";

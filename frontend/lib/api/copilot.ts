/**
 * Typed API for the AI Copilot page. Mirrors backend/src/modules/copilot
 * exactly — POST /copilot/chat is stateless per call (see
 * copilot.service.ts: it builds a fresh `messages` array from just the
 * one `message` string, no conversation id or history param exists on
 * the wire). The chat UI keeps a transcript client-side for display,
 * but each request only ever sends the current question — there is no
 * server-side memory of earlier turns to wire up.
 */
import { apiClient } from "./client";

export type CopilotProvider = "anthropic" | "openai" | "template";

export interface CopilotToolCall {
  name: string;
  input: Record<string, unknown>;
  ok: boolean;
}

export interface CopilotChatResult {
  reply: string;
  provider: CopilotProvider;
  toolCalls: CopilotToolCall[];
}

// FIX (verified bug): the copilot module is registered at prefix
// "/api/v1/merchant/ai" in backend/src/index.ts, with the handler at
// POST "/chat" in copilot.routes.ts - so the real path is
// /api/v1/merchant/ai/chat, not /api/v1/copilot/chat. Every copilot
// message was 404ing against the real, fully-built backend endpoint
// until this was corrected.
export function postCopilotChat(message: string): Promise<CopilotChatResult> {
  return apiClient.post<CopilotChatResult>("/merchant/ai/chat", { message });
}

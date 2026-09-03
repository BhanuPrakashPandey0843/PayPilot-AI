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

export function postCopilotChat(message: string): Promise<CopilotChatResult> {
  return apiClient.post<CopilotChatResult>("/copilot/chat", { message });
}

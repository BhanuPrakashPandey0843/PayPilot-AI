"use client";

import { useCallback, useRef, useState } from "react";
import { postCopilotChat } from "@/lib/api/copilot";
import type { CopilotProvider, CopilotToolCall } from "@/lib/api/copilot";
import { ApiError } from "@/lib/api/client";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  provider?: CopilotProvider;
  toolCalls?: CopilotToolCall[];
  error?: boolean;
}

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return `msg_${Date.now()}_${idCounter}`;
}

/**
 * Client-side transcript for the AI Copilot page. The backend itself is
 * stateless per request (see lib/api/copilot.ts's doc comment) — this
 * hook is what makes it FEEL like a conversation, by keeping every
 * question/answer pair in local state and appending to it.
 */
export function useCopilotChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const sendingRef = useRef(false);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sendingRef.current) return;

    sendingRef.current = true;
    setIsSending(true);

    const userMessage: ChatMessage = { id: nextId(), role: "user", text: trimmed };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const result = await postCopilotChat(trimmed);
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: "assistant",
          text: result.reply,
          provider: result.provider,
          toolCalls: result.toolCalls,
        },
      ]);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Something went wrong. Please try again.";
      setMessages((prev) => [...prev, { id: nextId(), role: "assistant", text: message, error: true }]);
    } finally {
      sendingRef.current = false;
      setIsSending(false);
    }
  }, []);

  const reset = useCallback(() => setMessages([]), []);

  return { messages, isSending, send, reset };
}

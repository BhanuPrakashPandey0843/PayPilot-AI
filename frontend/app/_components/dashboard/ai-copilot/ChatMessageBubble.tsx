"use client";

import { Sparkles, User, AlertTriangle } from "lucide-react";
import type { ChatMessage } from "@/hooks/useCopilotChat";
import { ToolCallBadges } from "./ToolCallBadges";

const PROVIDER_LABEL: Record<string, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  template: "Deterministic",
};

export function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex items-start justify-end gap-3">
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-cyan)] px-4 py-2.5 text-sm text-white shadow-[0_8px_24px_-8px_rgba(34,211,238,0.4)]">
          {message.text}
        </div>
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-zinc-300">
          <User className="h-4 w-4" />
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <span
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          message.error ? "bg-[var(--accent-rose)]/12" : "bg-gradient-to-br from-[var(--accent-violet)]/30 to-[var(--accent-cyan)]/30"
        }`}
      >
        {message.error ? (
          <AlertTriangle className="h-4 w-4 text-[var(--accent-rose)]" />
        ) : (
          <Sparkles className="h-4 w-4 text-[var(--accent-cyan)]" />
        )}
      </span>
      <div className="max-w-[80%]">
        <div
          className={`rounded-2xl rounded-tl-sm border px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
            message.error
              ? "border-[var(--accent-rose)]/30 bg-[var(--accent-rose)]/[0.06] text-[var(--accent-rose)]"
              : "border-[var(--border-subtle)] bg-white/[0.03] text-zinc-100"
          }`}
        >
          {message.text}
        </div>
        {!message.error && message.provider && (
          <div className="mt-1.5 flex items-center gap-2 px-1">
            <span className="text-[11px] text-zinc-600">{PROVIDER_LABEL[message.provider] ?? message.provider}</span>
          </div>
        )}
        {!message.error && message.toolCalls && <ToolCallBadges toolCalls={message.toolCalls} />}
      </div>
    </div>
  );
}

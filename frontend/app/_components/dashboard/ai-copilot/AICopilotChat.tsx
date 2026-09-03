"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, RotateCcw } from "lucide-react";
import { useCopilotChat } from "@/hooks/useCopilotChat";
import { ChatMessageBubble } from "./ChatMessageBubble";
import { ChatComposer } from "./ChatComposer";
import { SuggestedPrompts } from "./SuggestedPrompts";

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent-violet)]/30 to-[var(--accent-cyan)]/30">
        <Sparkles className="h-4 w-4 text-[var(--accent-cyan)]" />
      </span>
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-[var(--border-subtle)] bg-white/[0.03] px-4 py-3">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Step 6/14 combined — this page IS the "AI Copilot", not a floating
 * widget (that shortcut button was removed from the shell). A full chat
 * transcript backed by POST /copilot/chat, showing which real tools the
 * backend called for each answer (explainability, per the product's
 * whole premise) rather than just printing model text.
 */
export function AICopilotChat() {
  const { messages, isSending, send, reset } = useCopilotChat();
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isSending]);

  function handleSend() {
    const text = draft;
    setDraft("");
    void send(text);
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-1 flex-col overflow-hidden p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--accent-violet)]/25 to-[var(--accent-cyan)]/25">
              <Sparkles className="h-4 w-4 text-[var(--accent-cyan)]" />
            </span>
            <div>
              <p className="text-sm font-medium text-white">AI Copilot</p>
              <p className="text-xs text-zinc-500">Explainable answers, grounded in your real data</p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-[var(--border-strong)] hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" /> New chat
            </button>
          )}
        </div>

        <div ref={scrollRef} className="min-h-0 flex-1 space-y-5 overflow-y-auto py-6">
          {messages.length === 0 && !isSending ? (
            <SuggestedPrompts onPick={(p) => void send(p)} />
          ) : (
            <>
              {messages.map((m) => (
                <ChatMessageBubble key={m.id} message={m} />
              ))}
              {isSending && <TypingIndicator />}
            </>
          )}
        </div>

        <div className="sticky bottom-0 bg-[var(--background)] pb-2 pt-1">
          <ChatComposer value={draft} onChange={setDraft} onSend={handleSend} disabled={isSending} />
          <p className="mt-2 text-center text-[11px] text-zinc-600">
            The copilot can only read your data — it can never approve, execute, or refund anything on its own.
          </p>
        </div>
      </div>
    </div>
  );
}

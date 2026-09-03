"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, RotateCcw, PanelRight } from "lucide-react";
import type { CommerceChatMessage } from "@/hooks/useCommerceChat";
import type { AgentCatalogProduct, ProductMatch } from "@/lib/api/commerce";
import { ChatMessage } from "./ChatMessage";
import { ChatComposer } from "./ChatComposer";
import { SuggestionChips } from "./SuggestionChips";
import { ThinkingIndicator } from "./ThinkingIndicator";

interface ChatWorkspaceProps {
  messages: CommerceChatMessage[];
  isSending: boolean;
  onSend: (text: string) => void;
  onReset: () => void;
  onAddToCart: (product: AgentCatalogProduct | ProductMatch) => void;
  onViewDetails: (product: AgentCatalogProduct | ProductMatch) => void;
  onCompare: (products: (AgentCatalogProduct | ProductMatch)[]) => void;
  onCheckout: () => void;
  checkoutDisabledReason?: string;
  isCheckingOut?: boolean;
  onOpenContextPanel: () => void;
}

export function ChatWorkspace({
  messages,
  isSending,
  onSend,
  onReset,
  onAddToCart,
  onViewDetails,
  onCompare,
  onCheckout,
  checkoutDisabledReason,
  isCheckingOut,
  onOpenContextPanel,
}: ChatWorkspaceProps) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isSending]);

  function handleSend() {
    const text = draft;
    setDraft("");
    onSend(text);
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-[var(--border-subtle)] bg-white/[0.015]">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--accent-violet)]/25 to-[var(--accent-cyan)]/25">
            <Sparkles className="h-4 w-4 text-[var(--accent-cyan)]" />
          </span>
          <div>
            <p className="text-sm font-medium text-white">Shopping Concierge</p>
            <p className="text-xs text-zinc-500">Search, compare, and check out — grounded in your real catalog</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenContextPanel}
            aria-label="Open AI context"
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-[var(--border-strong)] hover:text-white lg:hidden"
          >
            <PanelRight className="h-3.5 w-3.5" /> Context
          </button>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-[var(--border-strong)] hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" /> New chat
            </button>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-6">
        {messages.length === 0 && !isSending ? (
          <div className="mx-auto flex max-w-lg flex-col items-center gap-6 py-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent-violet)]/25 to-[var(--accent-cyan)]/25">
              <Sparkles className="h-6 w-6 text-[var(--accent-cyan)]" />
            </span>
            <div>
              <p className="text-lg font-semibold text-white">What are you shopping for today?</p>
              <p className="mt-1 text-sm text-zinc-500">
                Search by product, budget, or tag — compare options, add to cart, and check out securely.
              </p>
            </div>
            <SuggestionChips onPick={onSend} disabled={isSending} />
          </div>
        ) : (
          <>
            {messages.map((m) => (
              <ChatMessage
                key={m.id}
                message={m}
                onAddToCart={onAddToCart}
                onViewDetails={onViewDetails}
                onCompare={onCompare}
                onCheckout={onCheckout}
                checkoutDisabledReason={checkoutDisabledReason}
                isCheckingOut={isCheckingOut}
              />
            ))}
            {isSending && <ThinkingIndicator />}
          </>
        )}
      </div>

      <div className="border-t border-[var(--border-subtle)] bg-[var(--background)]/60 p-4">
        {messages.length > 0 && (
          <div className="mb-3">
            <SuggestionChips onPick={onSend} disabled={isSending} />
          </div>
        )}
        <ChatComposer value={draft} onChange={setDraft} onSend={handleSend} disabled={isSending} />
        <p className="mt-2 text-center text-[11px] text-zinc-600">
          Intent detection and product ranking are deterministic and explainable — never simulated AI reasoning.
        </p>
      </div>
    </div>
  );
}

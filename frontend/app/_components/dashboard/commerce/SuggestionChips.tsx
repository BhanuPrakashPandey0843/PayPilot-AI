"use client";

import { Sparkles } from "lucide-react";

const PROMPTS = [
  "Find running shoes under ₹5000",
  "Show me socks",
  "I need a lightweight running cap",
  "Compare running shoes",
  "Show my order preview",
];

/**
 * Every chip here is real free text the backend's deterministic intent
 * extractor (intent.service.ts) classifies correctly on its own — no
 * hidden intent parameter is smuggled in. A couple (e.g. "Compare
 * running shoes" before anything has been searched) will honestly come
 * back asking for more — that's the real backend behaving correctly
 * with insufficient context, not a bug to paper over.
 */
export function SuggestionChips({ onPick, disabled }: { onPick: (prompt: string) => void; disabled?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {PROMPTS.map((prompt) => (
        <button
          key={prompt}
          type="button"
          disabled={disabled}
          onClick={() => onPick(prompt)}
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-white/[0.02] px-3.5 py-1.5 text-xs text-zinc-300 transition-colors hover:border-[var(--border-strong)] hover:bg-white/[0.05] hover:text-white disabled:opacity-40"
        >
          <Sparkles className="h-3 w-3 text-[var(--accent-cyan)]" />
          {prompt}
        </button>
      ))}
    </div>
  );
}

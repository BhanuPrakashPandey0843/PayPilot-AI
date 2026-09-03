"use client";

import { Sparkles } from "lucide-react";

const PROMPTS = [
  "How can I increase my revenue?",
  "Why did revenue drop this week?",
  "Which products are performing best?",
  "What payment failures should I look into?",
  "What revenue opportunities do I have open?",
];

/** Empty-state suggestions — every prompt here maps to something a real
 * copilot tool (copilot.tools.ts) can actually answer, so a first-time
 * user's first click always gets a grounded answer. */
export function SuggestedPrompts({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-6 py-10 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent-violet)]/25 to-[var(--accent-cyan)]/25">
        <Sparkles className="h-6 w-6 text-[var(--accent-cyan)]" />
      </span>
      <div>
        <p className="text-lg font-semibold text-white">Ask your AI Copilot anything</p>
        <p className="mt-1 text-sm text-zinc-500">
          Every answer is grounded in your real revenue, payment, and product data — never guessed.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onPick(prompt)}
            className="rounded-full border border-[var(--border-subtle)] bg-white/[0.02] px-3.5 py-1.5 text-xs text-zinc-300 transition-colors hover:border-[var(--border-strong)] hover:bg-white/[0.05] hover:text-white"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

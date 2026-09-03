"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

const STATUSES = ["Analyzing your request…", "Searching the catalog…", "Ranking matches…", "Preparing a response…"];

/**
 * Rotates through real pipeline stages the backend actually performs
 * for a chat turn (intent extraction -> tool call -> ranking -> policy)
 * rather than a generic spinner — still just a UI pace-setter (the
 * request is a single round trip), not a claim that these run as
 * separate visible steps server-side.
 */
export function ThinkingIndicator() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setIndex((i) => (i + 1) % STATUSES.length), 900);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent-violet)]/30 to-[var(--accent-cyan)]/30">
        <Sparkles className="h-4 w-4 animate-pulse text-[var(--accent-cyan)]" />
      </span>
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-[var(--border-subtle)] bg-white/[0.03] px-4 py-3">
          <div className="flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          <span className="text-xs text-zinc-500">{STATUSES[index]}</span>
        </div>
        <div className="flex gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-32 w-40 animate-shimmer rounded-2xl border border-[var(--border-subtle)]" />
          ))}
        </div>
      </div>
    </div>
  );
}

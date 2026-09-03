"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ArrowUp, Sparkles } from "lucide-react";

const PLACEHOLDERS = [
  "Ask AI to find products…",
  "Search by budget, e.g. \"shoes under ₹5000\"…",
  "Compare two products…",
  "Add something to your cart…",
  "Ask for your order preview…",
];

interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
}

export function ChatComposer({ value, onChange, onSend, disabled }: ChatComposerProps) {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (value || focused) return;
    const id = window.setInterval(() => setPlaceholderIndex((i) => (i + 1) % PLACEHOLDERS.length), 3200);
    return () => window.clearInterval(id);
  }, [value, focused]);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) onSend();
    }
  }

  return (
    <div
      className={`flex items-end gap-2 rounded-2xl border bg-white/[0.02] p-2 transition-all ${
        focused
          ? "border-transparent bg-clip-padding shadow-[0_0_0_1.5px_var(--accent-cyan),0_8px_28px_-10px_rgba(34,211,238,0.45)]"
          : "border-[var(--border-subtle)]"
      }`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center text-zinc-500">
        <Sparkles className="h-4 w-4" />
      </span>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={PLACEHOLDERS[placeholderIndex]}
        rows={1}
        disabled={disabled}
        className="max-h-32 min-h-[40px] flex-1 resize-none bg-transparent px-1 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none disabled:opacity-60"
      />
      <button
        type="button"
        onClick={onSend}
        disabled={disabled || !value.trim()}
        aria-label="Send message"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-cyan)] text-white transition-opacity disabled:opacity-30"
      >
        <ArrowUp className="h-4 w-4" />
      </button>
    </div>
  );
}

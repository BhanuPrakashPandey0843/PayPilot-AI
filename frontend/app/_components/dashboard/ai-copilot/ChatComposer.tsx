"use client";

import { useRef, type KeyboardEvent } from "react";
import { ArrowUp } from "lucide-react";

interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
}

export function ChatComposer({ value, onChange, onSend, disabled }: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) onSend();
    }
  }

  return (
    <div className="flex items-end gap-2 rounded-2xl border border-[var(--border-subtle)] bg-white/[0.02] p-2 transition-colors focus-within:border-[var(--border-strong)]">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask about revenue, payments, products, or opportunities…"
        rows={1}
        disabled={disabled}
        className="max-h-32 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none disabled:opacity-60"
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

"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, User, Check } from "lucide-react";
import { useApiResource } from "@/hooks/useApiResource";
import { listCustomers } from "@/lib/api/dashboard";
import { initialsFrom } from "../home/formatters";

interface CustomerPickerProps {
  selectedCustomerId: string | null;
  onSelect: (customerId: string, name: string) => void;
}

/**
 * Checkout requires a real customerId (checkout.schemas.ts) — the
 * Commerce Assistant is a merchant-operated shopping agent, so a
 * buyer must be selected from the organization's real customers
 * (GET /customers) before "Secure Checkout" can be used. This is the
 * one piece of state that can't be inferred from the conversation.
 */
export function CustomerPicker({ selectedCustomerId, onSelect }: CustomerPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useApiResource(() => listCustomers({ limit: 50, status: "active" }), []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const customers = data?.rows ?? [];
  const selected = customers.find((c) => c.id === selectedCustomerId);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-[var(--border-subtle)] bg-white/[0.02] px-3 py-2 text-left text-xs transition-colors hover:border-[var(--border-strong)]"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-cyan)] text-[10px] font-semibold text-white">
            {selected ? initialsFrom(selected.name) : <User className="h-3 w-3" />}
          </span>
          <span className="truncate text-zinc-200">{selected ? selected.name : isLoading ? "Loading customers…" : "Select a customer"}</span>
        </span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1.5 max-h-56 overflow-y-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--background-elevated)] p-1 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.6)]">
          {customers.length === 0 && !isLoading && (
            <p className="px-3 py-2.5 text-xs text-zinc-500">No active customers found.</p>
          )}
          {customers.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                onSelect(c.id, c.name);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs text-zinc-300 hover:bg-white/5 hover:text-white"
            >
              <span className="min-w-0">
                <span className="block truncate">{c.name}</span>
                <span className="block truncate text-[10px] text-zinc-500">{c.email}</span>
              </span>
              {c.id === selectedCustomerId && <Check className="h-3.5 w-3.5 shrink-0 text-[var(--accent-cyan)]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

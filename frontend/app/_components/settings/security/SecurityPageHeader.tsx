"use client";

import { ShieldCheck } from "lucide-react";

/**
 * Plain section header — no glass-panel glow blobs like
 * OrdersHero/CustomersHero. The brief explicitly asks for restraint
 * here ("Do NOT over-design it… Avoid huge gradients, excessive
 * glassmorphism"), so unlike the commerce pages' hero banners this is
 * just title + subtitle.
 */
export function SecurityPageHeader() {
  return (
    <div>
      <p className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-white/[0.03] px-3 py-1 text-xs font-medium text-[var(--accent-cyan)]">
        <ShieldCheck className="h-3 w-3" /> Settings
      </p>
      <h1 className="mt-4 text-2xl font-semibold text-white sm:text-3xl">Security</h1>
      <p className="mt-2 max-w-lg text-sm text-zinc-400">
        Manage your password, sessions, authentication methods, and account security.
      </p>
    </div>
  );
}

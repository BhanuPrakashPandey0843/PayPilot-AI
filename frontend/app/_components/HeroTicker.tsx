"use client";

import { Check } from "lucide-react";

/**
 * Full-bleed activity ticker along the bottom edge of the hero — a
 * continuous receipt-tape of the agent's catches, replacing the boxed
 * "dashboard card" that used to sit in the hero (HeroConsole, now
 * removed). A card floating next to a headline is the default shape of
 * every AI-product hero; this instead borrows a texture specific to
 * payments itself — a running tape of line items — and lets it bleed to
 * the full width of the viewport rather than living in a rounded panel.
 *
 * The list is duplicated once so the CSS marquee can loop seamlessly.
 * Pauses on hover and is replaced with a static (non-scrolling) row for
 * prefers-reduced-motion via the .animate-marquee media guard in
 * globals.css.
 */

const EVENTS = [
  "Duplicate charge on Acme Co. — refunded",
  "Failed retry recovered — $412",
  "Mobile checkout drop-off — friction step removed",
  "Downgrade risk flagged — retention offer sent",
  "Stalled subscription payment — recovered $128",
  "Chargeback risk on order #4821 — pre-empted",
  "Duplicate charge on Northwind Ltd. — refunded",
  "Failed retry recovered — $96",
];

function TapeRow() {
  return (
    <>
      {EVENTS.map((text, i) => (
        <span
          key={i}
          className="flex shrink-0 items-center gap-2 px-6 text-sm text-zinc-400"
        >
          <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" strokeWidth={3} />
          {text}
        </span>
      ))}
    </>
  );
}

export function HeroTicker() {
  return (
    <div
      data-hero-ticker
      className="relative left-1/2 mt-16 w-screen -translate-x-1/2 border-t border-dashed border-white/15 py-4"
    >
      <div className="group overflow-hidden">
        <div className="animate-marquee flex w-max group-hover:[animation-play-state:paused]">
          <div className="flex shrink-0 divide-x divide-white/10">
            <TapeRow />
          </div>
          <div aria-hidden="true" className="flex shrink-0 divide-x divide-white/10">
            <TapeRow />
          </div>
        </div>
      </div>
    </div>
  );
}

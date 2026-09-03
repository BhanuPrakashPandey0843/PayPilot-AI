"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { roleHasPermission } from "@/lib/permissions";

interface FloatingAIButtonProps {
  role: string | undefined;
}

/**
 * Floating shortcut to AI Copilot (Step 15 of the dashboard-shell
 * brief). Gated on ai.read, same as the sidebar's own AI Copilot entry
 * — no point floating a button to a page the role can't open. Hidden
 * on the AI Copilot and Commerce Assistant routes themselves, since
 * the user is already there. Links straight to the real page rather
 * than popping an in-place chat panel, since there's no floating-panel
 * copilot surface built yet — this is a shortcut, not a second copilot
 * UI to keep in sync with the real one.
 */
export function FloatingAIButton({ role }: FloatingAIButtonProps) {
  const pathname = usePathname();

  if (!roleHasPermission(role, "ai.read")) return null;
  if (pathname === "/ai-copilot" || pathname === "/commerce-assistant") return null;

  return (
    <Link
      href="/ai-copilot"
      aria-label="Open AI Copilot"
      title="Open Copilot"
      className="group fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-cyan)] text-white shadow-[0_8px_30px_-6px_rgba(34,211,238,0.5)] transition-[width] duration-300 ease-out hover:w-44 hover:justify-start hover:gap-2.5 hover:pl-4"
    >
      <span className="absolute inset-0 rounded-full bg-[var(--accent-cyan)]/40 [animation-duration:2.5s] animate-ping motion-reduce:hidden group-hover:hidden" />
      <Sparkles className="h-5 w-5 shrink-0" />
      <span className="hidden whitespace-nowrap text-sm font-medium group-hover:inline">
        Open Copilot
      </span>
    </Link>
  );
}

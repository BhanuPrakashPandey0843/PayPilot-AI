"use client";

import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";

import { dashboardNavigation } from "@/lib/navigation";

function currentTitle(pathname: string) {
  const match = [...dashboardNavigation]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  return match?.label ?? "Dashboard";
}

/**
 * Top bar for the desktop dashboard shell. No auth state exists yet, so
 * the account menu is a static placeholder rather than a fake session
 * dropdown — swap in real org/user data once auth is wired up.
 */
export function DashboardHeader() {
  const pathname = usePathname();

  return (
    <header className="hidden h-16 items-center justify-between border-b border-black/[0.06] bg-white px-6 lg:flex">
      <h1 className="text-[15px] font-semibold text-[#111217]">{currentTitle(pathname)}</h1>

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Notifications"
          className="flex h-8 w-8 items-center justify-center rounded-full text-[#8A8B92] outline-none transition-colors hover:bg-black/[0.04] hover:text-[#111217] focus-visible:ring-2 focus-visible:ring-[#111217]/20"
        >
          <Bell className="h-[16px] w-[16px]" strokeWidth={1.75} />
        </button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/[0.06] text-[11px] font-semibold text-[#5F6067]">
          —
        </div>
      </div>
    </header>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronRight, LogOut, Menu, Search, Settings, User } from "lucide-react";
import { ALL_NAV_ITEMS } from "./navConfig";

interface TopNavbarProps {
  onOpenMobile: () => void;
  userName: string;
  userEmail: string | undefined;
  onLogout: () => void;
}

/**
 * Top bar: breadcrumb + page title/subtitle on the left (derived from
 * the active route via navConfig, so a new page only needs an entry
 * there, not a second copy of its title), a search affordance in the
 * center, and account actions on the right.
 *
 * Solid surface, matching Sidebar — same reasoning: no glass here.
 *
 * Notifications and global search are UI shells only. There's no
 * notifications or search-index endpoint in the backend yet (see
 * backend/src/modules/*) — wiring them to real data is follow-up work,
 * not something to fake with invented content.
 */
export function TopNavbar({ onOpenMobile, userName, userEmail, onLogout }: TopNavbarProps) {
  const pathname = usePathname();
  const activeItem = ALL_NAV_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );

  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const initials = userName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-20 shrink-0 items-center gap-4 border-b border-[var(--border-subtle)] bg-[var(--background)]/95 px-4 backdrop-saturate-150 sm:px-6">
      <button
        type="button"
        onClick={onOpenMobile}
        aria-label="Open menu"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-400 hover:bg-white/5 hover:text-white lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Breadcrumb + title */}
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-center gap-1.5 text-xs text-zinc-500">
          <span>PayPilot AI</span>
          {activeItem && (
            <>
              <ChevronRight className="h-3 w-3" />
              <span className="text-zinc-400">{activeItem.label}</span>
            </>
          )}
        </div>
        <h1 className="truncate text-lg font-semibold text-white sm:text-xl">
          {activeItem?.label ?? "Dashboard"}
        </h1>
      </div>

      {/* Search — visual shell, not wired to a backend index yet */}
      <button
        type="button"
        className="hidden items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-white/[0.02] px-4 py-2 text-sm text-zinc-500 transition-colors hover:border-[var(--border-strong)] hover:text-zinc-300 md:flex"
      >
        <Search className="h-4 w-4" />
        <span>Search</span>
        <kbd className="ml-6 rounded border border-[var(--border-subtle)] px-1.5 py-0.5 text-[10px] text-zinc-500">
          ⌘K
        </kbd>
      </button>

      {/* Notifications */}
      <div className="relative" ref={notifRef}>
        <button
          type="button"
          onClick={() => setNotifOpen((o) => !o)}
          aria-label="Notifications"
          className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <Bell className="h-[18px] w-[18px]" />
        </button>
        {notifOpen && (
          <div className="absolute right-0 top-11 w-72 rounded-2xl border border-[var(--border-subtle)] bg-[var(--background-elevated)] p-1 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.6)]">
            <div className="px-3 py-6 text-center">
              <p className="text-sm text-zinc-400">You&apos;re all caught up</p>
              <p className="mt-1 text-xs text-zinc-500">
                Payment recoveries and new opportunities will show up here.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Profile */}
      <div className="relative" ref={profileRef}>
        <button
          type="button"
          onClick={() => setProfileOpen((o) => !o)}
          className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-white/5"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-cyan)] text-xs font-semibold text-white">
            {initials || <User className="h-4 w-4" />}
          </span>
          <span className="hidden truncate text-sm text-zinc-300 sm:inline">{userName}</span>
        </button>
        {profileOpen && (
          <div className="absolute right-0 top-12 w-60 rounded-2xl border border-[var(--border-subtle)] bg-[var(--background-elevated)] p-1.5 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.6)]">
            <div className="px-3 py-2.5">
              <p className="truncate text-sm font-medium text-white">{userName}</p>
              {userEmail && <p className="truncate text-xs text-zinc-500">{userEmail}</p>}
            </div>
            <div className="my-1 h-px bg-[var(--border-subtle)]" />
            <Link
              href="/settings/organization"
              onClick={() => setProfileOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-white"
            >
              <Settings className="h-4 w-4" /> Settings
            </Link>
            <button
              type="button"
              onClick={onLogout}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-zinc-300 hover:bg-white/5 hover:text-white"
            >
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

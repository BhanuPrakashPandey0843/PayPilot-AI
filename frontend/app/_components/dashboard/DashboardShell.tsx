"use client";

import type { ReactNode } from "react";
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { Sidebar } from "./Sidebar";
import { TopNavbar } from "./TopNavbar";
import { useSidebar } from "@/hooks/useSidebar";
import { useSession } from "@/hooks/useSession";

/**
 * Authenticated app shell: Sidebar + Topbar + scrollable content, wired
 * to the real session (useSession) and sidebar collapse state
 * (useSidebar). This is the client half of the "TODO: session guard"
 * that used to sit in app/(dashboard)/layout.tsx — see useSession.ts
 * for why it has to be a client hook rather than a server check.
 *
 * While the initial /auth/me revalidation is in flight we render
 * nothing but a bare loading state, rather than flashing the shell (and
 * whatever's cached from a previous session) before we know the token
 * is still good.
 */
export function DashboardShell({ children }: { children: ReactNode }) {
  const { session, isLoading, logout } = useSession();
  const { collapsed, toggleCollapsed, mobileOpen, openMobile, closeMobile } = useSidebar();
  const shellRef = useRef<HTMLDivElement>(null);

  // One-time reveal for sidebar / navbar / content once the real shell
  // mounts (Step 26 of the dashboard-shell brief). Only fires the first
  // time this branch renders — i.e. once, right after the loading
  // spinner above resolves to the real session — never on route
  // changes within the dashboard, since DashboardShell itself doesn't
  // remount for those. Skipped entirely under prefers-reduced-motion.
  useLayoutEffect(() => {
    if (!shellRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from("[data-shell-sidebar]", { xPercent: -100, opacity: 0, duration: 0.5 })
        .from("[data-shell-navbar]", { y: -16, opacity: 0, duration: 0.4 }, "-=0.25")
        .from("[data-shell-main]", { y: 12, opacity: 0, duration: 0.4 }, "-=0.2");
    }, shellRef);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border-strong)] border-t-[var(--accent-cyan)]" />
      </div>
    );
  }

  return (
    <div ref={shellRef} className="flex min-h-screen bg-[var(--background)]">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={closeMobile}
        role={session.role}
        organizationName={session.organization.name}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNavbar
          onOpenMobile={openMobile}
          userName={`${session.user.firstName} ${session.user.lastName}`.trim()}
          userEmail={session.user.email}
          onLogout={logout}
        />
        <main data-shell-main className="flex flex-1 flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}

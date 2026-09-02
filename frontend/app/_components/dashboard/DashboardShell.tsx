"use client";

import type { ReactNode } from "react";
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

  if (isLoading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border-strong)] border-t-[var(--accent-cyan)]" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
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
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}

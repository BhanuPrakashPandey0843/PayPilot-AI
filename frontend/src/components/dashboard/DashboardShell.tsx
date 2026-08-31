import type { ReactNode } from "react";

import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardMobileNav } from "./DashboardMobileNav";

/**
 * Application shell for every `/dashboard/*` route — sidebar + header on
 * desktop, a slide-down nav on mobile. Deliberately separate from
 * `MarketingPage`: the dashboard never renders the marketing Navbar/Footer.
 */
export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-[#FAFAF8]">
      <DashboardSidebar />

      <div className="flex min-h-screen flex-1 flex-col">
        <DashboardMobileNav />
        <DashboardHeader />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

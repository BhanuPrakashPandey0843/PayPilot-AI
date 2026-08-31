import type { Metadata } from "next";
import type { ReactNode } from "react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const metadata: Metadata = {
  title: {
    template: "%s — Dashboard — PayPilot AI",
    default: "Dashboard — PayPilot AI",
  },
};

/**
 * Segment layout for every `/dashboard/*` route — the authenticated
 * merchant application. No real auth/route-protection exists yet (see
 * README route map); this layout is the natural place to add it once a
 * session strategy is decided, without touching every page.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}

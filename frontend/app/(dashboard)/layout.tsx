import type { ReactNode } from "react";
import { DashboardShell } from "../_components/dashboard/DashboardShell";

/**
 * Shared shell for the authenticated merchant application (everything
 * behind Login: Dashboard, AI Copilot, Commerce Assistant, Revenue
 * Opportunities, Products, Orders, Payments, Customers, Analytics, Team
 * Members, Roles & Permissions, Audit Logs, Organization Settings, Security
 * Settings). Sidebar + Topbar + Content, per the flow notes.
 *
 * The session guard (redirect-to-login for an unauthenticated visitor)
 * lives inside DashboardShell via useSession() — see that hook's doc
 * comment for why it's a client-side check rather than one here.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}

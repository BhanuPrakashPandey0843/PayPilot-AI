import type { ReactNode } from "react";

/**
 * Shared shell for the authenticated merchant application (everything
 * behind Login: Dashboard, AI Copilot, Commerce Assistant, Revenue
 * Opportunities, Products, Orders, Payments, Customers, Analytics, Team
 * Members, Roles & Permissions, Audit Logs, Organization Settings, Security
 * Settings). Per the flow notes: "Maintain consistent layout: Sidebar +
 * Topbar + Content" and "All main app pages require authentication."
 *
 * TODO: once auth is wired up, this layout is the right place for the
 * server-side session check / redirect-to-login guard for the whole group.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1">
      {/* TODO: sidebar nav (role-based visibility per flow notes) */}
      <div className="flex flex-1 flex-col">
        {/* TODO: topbar */}
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}

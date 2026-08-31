import {
  LayoutDashboard,
  Package,
  Users,
  CreditCard,
  TrendingUp,
  BarChart3,
  Bot,
  Sparkles,
  ScrollText,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type DashboardNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** `catalog.read`-style permission family this section maps to on the backend — documentation only, not enforced client-side. */
  permission?: string;
};

/**
 * Single nav config for the authenticated dashboard shell. Sections
 * mirror the real backend module boundaries (see
 * `documentation/Backend_API_Reference.md`) — there's no buyer/seller
 * split in this product, just one organization-scoped merchant app.
 */
export const dashboardNavigation: DashboardNavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Products", href: "/dashboard/products", icon: Package, permission: "catalog.read" },
  { label: "Customers", href: "/dashboard/customers", icon: Users, permission: "customers.read" },
  { label: "Payments", href: "/dashboard/payments", icon: CreditCard, permission: "payments.read" },
  { label: "Revenue", href: "/dashboard/revenue", icon: TrendingUp, permission: "analytics.read" },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3, permission: "analytics.read" },
  { label: "Commerce Agent", href: "/dashboard/agent", icon: Bot, permission: "ai.read" },
  { label: "AI Copilot", href: "/dashboard/copilot", icon: Sparkles, permission: "ai.read" },
  { label: "Audit Log", href: "/dashboard/audit", icon: ScrollText, permission: "audit.read" },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

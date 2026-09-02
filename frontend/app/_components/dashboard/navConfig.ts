import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Sparkles,
  MessageSquareText,
  TrendingUp,
  Package,
  ShoppingCart,
  Users,
  CreditCard,
  BarChart3,
  ScrollText,
  UserCog,
  ShieldCheck,
  Building2,
  Lock,
} from "lucide-react";
import type { PermissionName } from "@/lib/permissions";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Subtitle shown in the Topbar's page-title area when this route is
   * active (Step 9 of the brief). */
  subtitle: string;
  /** Undefined = always visible (e.g. Dashboard itself). */
  permission?: PermissionName;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/**
 * Sidebar structure + per-item permission gate. Grouping and copy follow
 * the brief; permission names are the real ones from
 * backend/scripts/seed.ts (PERMISSION_DEFS) — there is no separate
 * "revenue" or "audit-write" permission on the backend, so Revenue
 * Opportunities gates on analytics.read and both settings pages gate on
 * organizations.update, matching what the API actually enforces.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        subtitle: "Monitor revenue, payments, and AI opportunities.",
      },
    ],
  },
  {
    label: "AI",
    items: [
      {
        label: "AI Copilot",
        href: "/ai-copilot",
        icon: Sparkles,
        subtitle: "Ask questions and get explainable answers about your business.",
        permission: "ai.read",
      },
      {
        label: "Commerce Assistant",
        href: "/commerce-assistant",
        icon: MessageSquareText,
        subtitle: "Search, compare, and preview products with AI.",
        permission: "ai.read",
      },
      {
        label: "Revenue Opportunities",
        href: "/revenue-opportunities",
        icon: TrendingUp,
        subtitle: "Revenue waiting to be recovered, ranked and explained.",
        permission: "analytics.read",
      },
    ],
  },
  {
    label: "Commerce",
    items: [
      {
        label: "Products",
        href: "/products",
        icon: Package,
        subtitle: "Manage your AI-readable catalog.",
        permission: "catalog.read",
      },
      {
        label: "Orders",
        href: "/orders",
        icon: ShoppingCart,
        subtitle: "Track orders from checkout through fulfillment.",
        permission: "orders.read",
      },
      {
        label: "Customers",
        href: "/customers",
        icon: Users,
        subtitle: "Everyone who has bought, or almost bought, from you.",
        permission: "customers.read",
      },
      {
        label: "Payments",
        href: "/payments",
        icon: CreditCard,
        subtitle: "Payment attempts, captures, and refunds.",
        permission: "payments.read",
      },
    ],
  },
  {
    label: "Insights",
    items: [
      {
        label: "Analytics",
        href: "/analytics",
        icon: BarChart3,
        subtitle: "Revenue trends and performance over time.",
        permission: "analytics.read",
      },
      {
        label: "Audit Logs",
        href: "/audit-logs",
        icon: ScrollText,
        subtitle: "Every important action. Fully traceable.",
        permission: "audit.read",
      },
    ],
  },
  {
    label: "Workspace",
    items: [
      {
        label: "Team Members",
        href: "/team",
        icon: UserCog,
        subtitle: "Who has access to this workspace.",
        permission: "users.read",
      },
      {
        label: "Roles & Permissions",
        href: "/roles",
        icon: ShieldCheck,
        subtitle: "What each role in this workspace can do.",
        permission: "organizations.update",
      },
      {
        label: "Organization Settings",
        href: "/settings/organization",
        icon: Building2,
        subtitle: "Workspace name, currency, and timezone.",
        permission: "organizations.update",
      },
      {
        label: "Security Settings",
        href: "/settings/security",
        icon: Lock,
        subtitle: "Session policy and account security.",
        permission: "organizations.update",
      },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

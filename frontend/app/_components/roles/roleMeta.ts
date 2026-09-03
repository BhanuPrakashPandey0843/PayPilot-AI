/**
 * Presentation helpers for the Roles & Permissions page. All the
 * underlying data (which permissions exist, which role has which) comes
 * from lib/permissions.ts — this file only adds colors/icons and derives
 * the "what can this role do that it also can't do" diffs used by the
 * insight cards, computed from that real data rather than written by
 * hand per role.
 */
import {
  ShieldCheck,
  Settings2,
  Headset,
  Wallet,
  Eye,
  type LucideIcon,
} from "lucide-react";
import {
  ALL_PERMISSIONS,
  permissionsForRole,
  permissionCategory,
  PERMISSION_DESCRIPTIONS,
  type RoleName,
  type PermissionName,
} from "@/lib/permissions";

export const ROLE_ACCENT: Record<RoleName, string> = {
  ORG_ADMIN: "var(--accent-violet)",
  OPERATIONS: "var(--accent-blue)",
  FINANCE: "var(--accent-gold)",
  SUPPORT: "var(--accent-cyan)",
  VIEWER: "var(--muted)",
};

export const ROLE_ICON: Record<RoleName, LucideIcon> = {
  ORG_ADMIN: ShieldCheck,
  OPERATIONS: Settings2,
  FINANCE: Wallet,
  SUPPORT: Headset,
  VIEWER: Eye,
};

/** Every distinct category prefix across ALL_PERMISSIONS, in a fixed
 * sensible order (not alphabetical — reads roughly business-critical to
 * peripheral) — used to group the permission matrix. */
export const PERMISSION_CATEGORIES: string[] = [
  "organizations",
  "users",
  "customers",
  "catalog",
  "orders",
  "payments",
  "ai",
  "analytics",
  "audit",
];

export function categoryLabel(category: string): string {
  const labels: Record<string, string> = {
    organizations: "Organization",
    users: "Users & Team",
    customers: "Customers",
    catalog: "Catalog",
    orders: "Orders",
    payments: "Payments",
    ai: "AI Agent",
    analytics: "Analytics",
    audit: "Audit",
  };
  return labels[category] ?? category;
}

/** A permission is "sensitive" for insight-card purposes if granting it
 * lets someone change money, delete data, change org config, or let the
 * AI agent act — i.e. the ones worth calling out when a role *can't* do
 * them. */
const SENSITIVE_PERMISSIONS: PermissionName[] = [
  "organizations.update",
  "users.create",
  "catalog.delete",
  "payments.refund",
  "ai.execute",
];

export interface RoleInsight {
  role: RoleName;
  /** Write/execute-level permissions this role has (excludes plain
   * `.read` grants, which every non-trivial role has plenty of). */
  can: PermissionName[];
  /** Sensitive permissions this role does NOT have. */
  cannot: PermissionName[];
}

export function buildRoleInsight(role: RoleName): RoleInsight {
  const granted = new Set(permissionsForRole(role));
  const can = ALL_PERMISSIONS.filter((p) => granted.has(p) && !p.endsWith(".read"));
  const cannot = SENSITIVE_PERMISSIONS.filter((p) => !granted.has(p));
  return { role, can, cannot };
}

export { permissionCategory, PERMISSION_DESCRIPTIONS };

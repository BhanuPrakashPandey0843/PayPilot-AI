/**
 * Client-side mirror of backend/scripts/seed.ts's ROLE_PERMISSIONS map.
 *
 * The JWT session only carries a role NAME (see AuthSession.role in
 * lib/api/auth.ts) — not the resolved permission list — so there is
 * nothing else on the client to derive "can this role see this nav
 * item" from. This map is duplicated by hand from the seed data on
 * purpose (see backend/scripts/seed.ts PERMISSION_DEFS / ROLE_PERMISSIONS)
 * rather than fetched, since it changes rarely and a fetch would add a
 * loading-state flash to every sidebar render.
 *
 * IMPORTANT: this is UI-only convenience for hiding links the user
 * almost certainly can't use. It is NOT the authority. Every route
 * still enforces its own requirePermission(...) server-side
 * (backend/src/middleware/authorize.ts), re-resolved from the database
 * on every request — a stale or wrong entry here can at worst show (or
 * hide) a nav link, never grant real access.
 */

export type RoleName = "ORG_ADMIN" | "OPERATIONS" | "FINANCE" | "SUPPORT" | "VIEWER";

export type PermissionName =
  | "organizations.read"
  | "organizations.update"
  | "users.read"
  | "users.create"
  | "users.update"
  | "customers.read"
  | "customers.create"
  | "customers.update"
  | "catalog.read"
  | "catalog.create"
  | "catalog.update"
  | "catalog.delete"
  | "orders.read"
  | "orders.create"
  | "orders.update"
  | "payments.read"
  | "payments.create"
  | "payments.refund"
  | "ai.read"
  | "ai.execute"
  | "analytics.read"
  | "audit.read";

const ALL_PERMISSIONS: PermissionName[] = [
  "organizations.read",
  "organizations.update",
  "users.read",
  "users.create",
  "users.update",
  "customers.read",
  "customers.create",
  "customers.update",
  "catalog.read",
  "catalog.create",
  "catalog.update",
  "catalog.delete",
  "orders.read",
  "orders.create",
  "orders.update",
  "payments.read",
  "payments.create",
  "payments.refund",
  "ai.read",
  "ai.execute",
  "analytics.read",
  "audit.read",
];

const ROLE_PERMISSIONS: Record<RoleName, PermissionName[]> = {
  ORG_ADMIN: ALL_PERMISSIONS,
  OPERATIONS: [
    "organizations.read",
    "users.read",
    "customers.read",
    "customers.create",
    "customers.update",
    "catalog.read",
    "catalog.create",
    "catalog.update",
    "catalog.delete",
    "orders.read",
    "orders.create",
    "orders.update",
    "payments.read",
    "payments.create",
    "ai.read",
    "ai.execute",
    "analytics.read",
    "audit.read",
  ],
  FINANCE: [
    "organizations.read",
    "users.read",
    "customers.read",
    "orders.read",
    "payments.read",
    "payments.create",
    "payments.refund",
    "analytics.read",
    "audit.read",
  ],
  SUPPORT: [
    "organizations.read",
    "users.read",
    "customers.read",
    "customers.update",
    "catalog.read",
    "orders.read",
    "payments.read",
    "audit.read",
  ],
  VIEWER: [
    "organizations.read",
    "users.read",
    "customers.read",
    "catalog.read",
    "orders.read",
    "payments.read",
    "analytics.read",
    "audit.read",
  ],
};

/** True if `role` grants `permission`. Unknown role names (should never
 * happen once a real session is loaded) fail closed. */
export function roleHasPermission(
  role: string | undefined | null,
  permission: PermissionName
): boolean {
  if (!role) return false;
  const grants = ROLE_PERMISSIONS[role as RoleName];
  if (!grants) return false;
  return grants.includes(permission);
}

export function formatRoleLabel(role: string): string {
  return role
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

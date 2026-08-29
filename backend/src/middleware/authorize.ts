import type { FastifyReply, FastifyRequest } from "fastify";
import { and, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { organizationMembers } from "../db/schema/organization_members.js";
import { rolePermissions } from "../db/schema/role_permissions.js";
import { permissions } from "../db/schema/permissions.js";
import { Errors } from "../utils/errors.js";
import { emitAudit } from "../utils/audit.js";

/**
 * Returns a Fastify preHandler that enforces a single permission.
 *
 * Deliberately re-resolves membership/role/permissions from the database
 * on every request rather than trusting the role embedded in the JWT.
 * This means a role change or a membership suspension takes effect
 * immediately, not only after the user's token expires and they log in
 * again.
 *
 * Requires `app.authenticate` (or an equivalent onRequest hook that sets
 * `request.authUser`) to have already run.
 *
 * Usage: `{ preHandler: [app.authenticate, requirePermission("catalog.read")] }`
 */
export function requirePermission(permissionName: string) {
  return async function permissionCheck(request: FastifyRequest, _reply: FastifyReply) {
    const authUser = request.authUser;
    if (!authUser) {
      // Should never happen if app.authenticate ran first, but never
      // trust that ordering blindly — fail closed.
      throw Errors.unauthorized();
    }

    // Fastify v5 renamed `request.routerPath` to `request.routeOptions.url`
    // (falls back to the raw `request.url` if route options aren't set yet).
    const routePath = request.routeOptions?.url ?? request.url;

    const [membership] = await db
      .select({
        roleId: organizationMembers.roleId,
        status: organizationMembers.status,
      })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.userId, authUser.userId),
          eq(organizationMembers.organizationId, authUser.organizationId)
        )
      )
      .limit(1);

    if (!membership || membership.status !== "active") {
      emitAudit({
        type: "AUTHORIZATION_DENIED",
        actor: { userId: authUser.userId, organizationId: authUser.organizationId, roleId: authUser.roleId, role: authUser.role },
        target: { kind: "membership", extras: { route: routePath, method: request.method, requiredPermission: permissionName, reason: "membership_inactive_or_missing" } },
        context: { route: routePath, method: request.method },
      });
      throw Errors.forbidden();
    }

    const [grant] = await db
      .select({ permissionId: rolePermissions.permissionId })
      .from(rolePermissions)
      .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
      .where(and(eq(rolePermissions.roleId, membership.roleId), eq(permissions.name, permissionName)))
      .limit(1);

    if (!grant) {
      emitAudit({
        type: "PERMISSION_CHECK_DENIED",
        actor: { userId: authUser.userId, organizationId: authUser.organizationId, roleId: authUser.roleId, role: authUser.role },
        target: { kind: "permission", extras: { route: routePath, method: request.method, requiredPermission: permissionName } },
        context: { route: routePath, method: request.method, permission: permissionName },
      });
      throw Errors.forbidden(`Missing required permission: ${permissionName}`);
    }

    emitAudit({
      type: "PERMISSION_CHECK_GRANTED",
      actor: { userId: authUser.userId, organizationId: authUser.organizationId, roleId: authUser.roleId, role: authUser.role },
      target: { kind: "permission", extras: { permission: permissionName } },
      context: { route: routePath, method: request.method, permission: permissionName },
    });
  };
}

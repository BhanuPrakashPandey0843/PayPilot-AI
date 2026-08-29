import { pgTable, uuid, primaryKey, index } from "drizzle-orm/pg-core";
import { roles } from "./roles.js";
import { permissions } from "./permissions.js";

/**
 * Join table between roles and permissions. Composite primary key means a
 * given (role, permission) pair can only exist once — no separate unique
 * constraint needed.
 */
export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.roleId, table.permissionId] }),
    permissionIdx: index("role_permissions_permission_id_idx").on(table.permissionId),
  })
);

export type RolePermission = typeof rolePermissions.$inferSelect;
export type NewRolePermission = typeof rolePermissions.$inferInsert;

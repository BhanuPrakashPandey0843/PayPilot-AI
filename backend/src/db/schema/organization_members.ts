import { pgTable, pgEnum, uuid, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";
import { organizations } from "./organizations.js";
import { users } from "./users.js";
import { roles } from "./roles.js";

/**
 * A user can belong to multiple organizations, each with its own role
 * (e.g. Admin in Org A, Viewer in Org B). This table is the join between
 * users and organizations; roles.ts / permissions.ts define what a role
 * can actually do.
 */
export const membershipStatusEnum = pgEnum("membership_status", [
  "invited",
  "active",
  "suspended",
  "removed",
]);

export const organizationMembers = pgTable(
  "organization_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // restrict: a role that's still assigned to members can't be deleted
    // out from under them.
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "restrict" }),
    status: membershipStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    orgUserUnique: uniqueIndex("organization_members_org_user_unique").on(
      table.organizationId,
      table.userId
    ),
    userIdx: index("organization_members_user_id_idx").on(table.userId),
    orgIdx: index("organization_members_organization_id_idx").on(table.organizationId),
  })
);

export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type NewOrganizationMember = typeof organizationMembers.$inferInsert;

import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  jsonb,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Lifecycle status of an organization (tenant) on the platform.
 */
export const organizationStatusEnum = pgEnum("organization_status", [
  "active",
  "suspended",
  "inactive",
]);

export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    status: organizationStatusEnum("status").notNull().default("active"),
    // ISO 4217 currency code, e.g. "INR", "USD".
    currency: varchar("currency", { length: 3 }).notNull().default("INR"),
    // IANA timezone name, e.g. "Asia/Kolkata".
    timezone: varchar("timezone", { length: 64 }).notNull().default("Asia/Kolkata"),
    // Free-form, low-cardinality extra data only. Anything queried or
    // filtered on regularly belongs in a real column instead.
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    slugUnique: uniqueIndex("organizations_slug_unique").on(table.slug),
  })
);

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;

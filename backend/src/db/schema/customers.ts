import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  jsonb,
  timestamp,
  uniqueIndex,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations.js";

/**
 * A "customer" is a business's own end customer — the person who buys
 * from the organization. NOT the same thing as a PayPilot `users` row.
 */
export const customerStatusEnum = pgEnum("customer_status", ["active", "inactive", "blocked"]);

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    // ID of this customer in an external system (payment provider, CRM,
    // storefront, etc.) for future sync/reconciliation.
    externalCustomerId: varchar("external_customer_id", { length: 255 }),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 320 }),
    phone: varchar("phone", { length: 32 }),
    status: customerStatusEnum("status").notNull().default("active"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    // Uniqueness is tenant-scoped, not global — two different
    // organizations may legitimately share an external_customer_id from
    // different provider accounts. Postgres allows multiple NULLs through
    // a unique index, so this doesn't block customers without one yet.
    orgExternalIdUnique: uniqueIndex("customers_org_external_id_unique").on(
      table.organizationId,
      table.externalCustomerId
    ),
    orgIdx: index("customers_organization_id_idx").on(table.organizationId),
    orgEmailIdx: index("customers_org_email_idx").on(table.organizationId, table.email),
    // Lets orders reference (customer_id, organization_id) together, so a
    // composite FK can guarantee an order's customer actually belongs to
    // the order's organization (see orders.ts).
    idOrgUnique: unique("customers_id_organization_id_unique").on(
      table.id,
      table.organizationId
    ),
  })
);

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;

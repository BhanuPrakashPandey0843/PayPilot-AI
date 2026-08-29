import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  integer,
  bigint,
  jsonb,
  timestamp,
  uniqueIndex,
  index,
  check,
  foreignKey,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { organizations } from "./organizations.js";
import { customers } from "./customers.js";
import { products } from "./products.js";

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "paid",
  "partially_paid",
  "cancelled",
  "failed",
  "refunded",
]);

/**
 * All money columns are integer minor units (e.g. paise for INR, cents
 * for USD) — never floating point. ₹1,000.00 is stored as 100000.
 */
export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    // No single-column .references() here on purpose — see the composite
    // foreignKey() below, which enforces both that this customer exists
    // AND that it belongs to this same organization.
    customerId: uuid("customer_id").notNull(),
    orderNumber: varchar("order_number", { length: 64 }).notNull(),
    status: orderStatusEnum("status").notNull().default("pending"),
    // Milestone 5 — checkout idempotency (Phase 26). Deterministic per
    // checkout attempt (derived from sessionId + cart contents when the
    // client doesn't supply one — see checkout.service.ts). A retried /
    // duplicated checkout request with the same key must resolve to this
    // SAME order instead of creating a second Razorpay order. Nullable
    // because non-checkout-created orders don't have one; Postgres unique
    // indexes treat NULLs as distinct, so NULLs never collide with each
    // other.
    idempotencyKey: varchar("idempotency_key", { length: 128 }),
    currency: varchar("currency", { length: 3 }).notNull(),
    subtotalAmount: bigint("subtotal_amount", { mode: "number" }).notNull(),
    discountAmount: bigint("discount_amount", { mode: "number" }).notNull().default(0),
    taxAmount: bigint("tax_amount", { mode: "number" }).notNull().default(0),
    totalAmount: bigint("total_amount", { mode: "number" }).notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    // Order numbers are unique per-organization, not globally.
    orgOrderNumberUnique: uniqueIndex("orders_org_order_number_unique").on(
      table.organizationId,
      table.orderNumber
    ),
    // Enforces checkout idempotency at the database level — the ultimate
    // backstop even if two server instances race on the same key at the
    // same instant (Phase 26 explicitly requires this NOT be solved with
    // only an in-memory guard).
    orgIdempotencyKeyUnique: uniqueIndex("orders_org_idempotency_key_unique").on(
      table.organizationId,
      table.idempotencyKey
    ),
    orgIdx: index("orders_organization_id_idx").on(table.organizationId),
    customerIdx: index("orders_customer_id_idx").on(table.customerId),
    // Composite FK replaces the old single-column customer_id -> customers.id
    // FK. It's strictly stronger: it still guarantees customer_id refers to
    // a real customer row, and additionally guarantees that customer's
    // organization_id matches this order's organization_id — so an order
    // can never reference another organization's customer. Requires the
    // matching UNIQUE(id, organization_id) on customers (see customers.ts).
    customerOrgFk: foreignKey({
      name: "orders_customer_org_fk",
      columns: [table.customerId, table.organizationId],
      foreignColumns: [customers.id, customers.organizationId],
    }).onDelete("restrict"),
    amountsNonNegative: check(
      "orders_amounts_non_negative",
      sql`${table.subtotalAmount} >= 0 AND ${table.discountAmount} >= 0 AND ${table.taxAmount} >= 0 AND ${table.totalAmount} >= 0`
    ),
  })
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    // References the catalog. Nullable and ON DELETE SET NULL: an order
    // line item is a financial record and must survive a product being
    // deleted from the catalog later — productName/unitAmount already
    // captured the point-in-time snapshot, so losing the live FK here
    // doesn't lose any financial data. NOTE: this is a plain (not
    // composite) FK — the existing order_items table has no
    // organization_id column of its own, so there's nothing to compose
    // against without widening that table. The application layer (Phase
    // D/E order-creation logic) is responsible for verifying the product
    // belongs to the same organization as the order before insert.
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    productName: varchar("product_name", { length: 255 }).notNull(),
    quantity: integer("quantity").notNull().default(1),
    unitAmount: bigint("unit_amount", { mode: "number" }).notNull(),
    totalAmount: bigint("total_amount", { mode: "number" }).notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    orderIdx: index("order_items_order_id_idx").on(table.orderId),
    quantityPositive: check("order_items_quantity_positive", sql`${table.quantity} > 0`),
    amountsNonNegative: check(
      "order_items_amounts_non_negative",
      sql`${table.unitAmount} >= 0 AND ${table.totalAmount} >= 0`
    ),
  })
);

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;

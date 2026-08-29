import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  bigint,
  integer,
  boolean,
  jsonb,
  timestamp,
  uniqueIndex,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { organizations } from "./organizations.js";

/**
 * Product catalog. Organization-scoped, same tenant-isolation pattern as
 * customers/orders. Money stays integer minor units — never float.
 */
export const productStatusEnum = pgEnum("product_status", ["active", "inactive"]);

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 128 }),
    // Free-form buyer-facing tags (e.g. "running", "lightweight"). Used by
    // catalog/agent search filtering — see products.repository.ts.
    tags: text("tags")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    // Integer minor units (e.g. paise for INR). ₹4,999.00 -> 499900.
    price: bigint("price", { mode: "number" }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("INR"),
    inventoryQuantity: integer("inventory_quantity").notNull().default(0),
    imageUrl: varchar("image_url", { length: 2048 }),
    isActive: boolean("is_active").notNull().default(true),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    orgSlugUnique: uniqueIndex("products_org_slug_unique").on(
      table.organizationId,
      table.slug
    ),
    orgIdx: index("products_organization_id_idx").on(table.organizationId),
    orgCategoryIdx: index("products_org_category_idx").on(
      table.organizationId,
      table.category
    ),
    orgActiveIdx: index("products_org_active_idx").on(table.organizationId, table.isActive),
    // GIN index so `tags @> ARRAY[...]`-style containment filters (used by
    // catalog + agent search) stay index-backed instead of a seq scan.
    tagsGinIdx: index("products_tags_gin_idx").using("gin", table.tags),
    priceNonNegative: check("products_price_non_negative", sql`${table.price} >= 0`),
    inventoryNonNegative: check(
      "products_inventory_non_negative",
      sql`${table.inventoryQuantity} >= 0`
    ),
  })
);

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

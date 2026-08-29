import { pgTable, pgEnum, uuid, varchar, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

/**
 * A "user" is a PayPilot operator/employee who logs in — NOT a business
 * customer. See customers.ts for the business's own end customers.
 */
export const userStatusEnum = pgEnum("user_status", ["invited", "active", "disabled"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Application code is responsible for normalizing (lowercasing/trimming)
    // the email before insert so this unique index behaves as expected.
    email: varchar("email", { length: 320 }).notNull(),
    // Only ever a bcrypt hash — never a plaintext password.
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    firstName: varchar("first_name", { length: 120 }).notNull(),
    lastName: varchar("last_name", { length: 120 }).notNull(),
    status: userStatusEnum("status").notNull().default("invited"),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    emailUnique: uniqueIndex("users_email_unique").on(table.email),
  })
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

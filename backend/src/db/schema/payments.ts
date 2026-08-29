import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  integer,
  bigint,
  text,
  jsonb,
  timestamp,
  uniqueIndex,
  index,
  check,
  unique,
  foreignKey,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { organizations } from "./organizations.js";
import { orders } from "./orders.js";

/**
 * Only Razorpay today, but this is a real enum (not a free-text column)
 * so adding a second provider later is a migration, not a data cleanup.
 */
export const paymentProviderEnum = pgEnum("payment_provider", ["razorpay"]);

export const paymentAttemptStatusEnum = pgEnum("payment_attempt_status", [
  "created",
  "pending",
  "authorized",
  "captured",
  "failed",
  "cancelled",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "captured",
  "partially_refunded",
  "refunded",
  "failed",
]);

/**
 * Full history of every attempt to pay for an order (retries included).
 * A failed attempt is never deleted — it's the audit trail that answers
 * "why did this payment fail?".
 */
export const paymentAttempts = pgTable(
  "payment_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Financial audit trail — never cascade-deleted. An organization or
    // order can't be hard-deleted while attempts against it still exist.
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "restrict" }),
    provider: paymentProviderEnum("provider").notNull(),
    // Set as soon as the Razorpay order is created (before any payment
    // happens) — this is how a webhook/verify-payment call, which only
    // knows the Razorpay order id, finds its way back to this attempt.
    // Null only for the brief window between the internal attempt row
    // being created and the Razorpay API call returning.
    providerOrderId: varchar("provider_order_id", { length: 255 }),
    // Null while the attempt hasn't reached the provider yet (e.g. still
    // "created" client-side), so this can't be NOT NULL.
    providerPaymentId: varchar("provider_payment_id", { length: 255 }),
    amount: bigint("amount", { mode: "number" }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull(),
    status: paymentAttemptStatusEnum("status").notNull().default("created"),
    failureCode: varchar("failure_code", { length: 128 }),
    failureMessage: text("failure_message"),
    // 1-based, unique per order — attempt 1, 2, 3... for a given order.
    attemptNumber: integer("attempt_number").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    // Uniqueness is scoped per-provider: two different providers could
    // theoretically reuse an ID format, so this isn't globally unique.
    // NULLs (not-yet-submitted attempts) pass through freely.
    providerPaymentIdUnique: uniqueIndex("payment_attempts_provider_payment_id_unique").on(
      table.provider,
      table.providerPaymentId
    ),
    // Lets a webhook/verify-payment call look up "which attempt is this
    // event about" purely from the Razorpay order id it was given —
    // without trusting any organizationId/orderId the caller might also
    // supply. Scoped per-provider for the same reason as the payment-id
    // index above.
    providerOrderIdUnique: uniqueIndex("payment_attempts_provider_order_id_unique").on(
      table.provider,
      table.providerOrderId
    ),
    orderAttemptUnique: uniqueIndex("payment_attempts_order_attempt_unique").on(
      table.orderId,
      table.attemptNumber
    ),
    orgIdx: index("payment_attempts_organization_id_idx").on(table.organizationId),
    orderIdx: index("payment_attempts_order_id_idx").on(table.orderId),
    amountPositive: check("payment_attempts_amount_positive", sql`${table.amount} > 0`),
    attemptNumberPositive: check(
      "payment_attempts_attempt_number_positive",
      sql`${table.attemptNumber} > 0`
    ),
    // Composite-unique targets for payments' composite FKs below — let a
    // payment prove, at the database level, that the attempt it points to
    // really does belong to the same order / same organization it claims.
    idOrderUnique: unique("payment_attempts_id_order_unique").on(table.id, table.orderId),
    idOrgUnique: unique("payment_attempts_id_org_unique").on(table.id, table.organizationId),
  })
);

/**
 * The financial record of a successful/captured payment, kept separate
 * from the attempt history. Each payment traces back to the one attempt
 * that actually succeeded.
 */
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Financial record — never cascade-deleted.
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "restrict" }),
    // No single-column .references() here on purpose — see the composite
    // foreignKey()s below, which enforce that the referenced attempt
    // belongs to this same order AND this same organization.
    paymentAttemptId: uuid("payment_attempt_id").notNull(),
    provider: paymentProviderEnum("provider").notNull(),
    providerPaymentId: varchar("provider_payment_id", { length: 255 }).notNull(),
    amount: bigint("amount", { mode: "number" }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull(),
    status: paymentStatusEnum("status").notNull().default("captured"),
    capturedAt: timestamp("captured_at", { withTimezone: true }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    providerPaymentIdUnique: uniqueIndex("payments_provider_payment_id_unique").on(
      table.provider,
      table.providerPaymentId
    ),
    paymentAttemptUnique: uniqueIndex("payments_payment_attempt_id_unique").on(
      table.paymentAttemptId
    ),
    orgIdx: index("payments_organization_id_idx").on(table.organizationId),
    orderIdx: index("payments_order_id_idx").on(table.orderId),
    amountPositive: check("payments_amount_positive", sql`${table.amount} > 0`),
    // Guarantees payment.order_id matches the order of the attempt it's
    // based on — a payment can't claim to belong to a different order than
    // its own payment_attempt does.
    attemptOrderFk: foreignKey({
      name: "payments_attempt_order_fk",
      columns: [table.paymentAttemptId, table.orderId],
      foreignColumns: [paymentAttempts.id, paymentAttempts.orderId],
    }).onDelete("restrict"),
    // Guarantees payment.organization_id matches the organization of the
    // attempt it's based on — closes the cross-tenant payment/attempt gap.
    attemptOrgFk: foreignKey({
      name: "payments_attempt_org_fk",
      columns: [table.paymentAttemptId, table.organizationId],
      foreignColumns: [paymentAttempts.id, paymentAttempts.organizationId],
    }).onDelete("restrict"),
  })
);

export type PaymentAttempt = typeof paymentAttempts.$inferSelect;
export type NewPaymentAttempt = typeof paymentAttempts.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

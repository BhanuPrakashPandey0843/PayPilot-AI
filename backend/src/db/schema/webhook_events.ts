import { pgTable, pgEnum, uuid, varchar, jsonb, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";

/**
 * Durable webhook-idempotency ledger (Milestone 5, Phase 11).
 *
 * Razorpay (like every payment provider) can and will redeliver the same
 * webhook event more than once. This table is the DB-backed guard against
 * double-processing — deliberately NOT an in-memory Set (Phase 11
 * explicitly forbids that: it wouldn't survive a restart or work across
 * multiple server instances).
 *
 * Flow (see payment.service.ts `recordWebhookEventOnce`):
 *   1. INSERT ... ON CONFLICT (provider, eventId) DO NOTHING, RETURNING id.
 *   2. If a row came back -> this is the first delivery -> process it.
 *   3. If no row came back -> already processed -> emit a
 *      WEBHOOK_DUPLICATE_IGNORED audit event and return 200 OK immediately
 *      (Razorpay expects 2xx even for a duplicate, or it keeps retrying).
 */
export const webhookEventStatusEnum = pgEnum("webhook_event_status", [
  "RECEIVED",
  "PROCESSED",
  "IGNORED",
  "FAILED",
]);

export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    provider: varchar("provider", { length: 32 }).notNull().default("razorpay"),
    // Razorpay's own event id (the `payload.event` webhook body has no
    // top-level id field in older API versions, so we fall back to a
    // deterministic hash of (event type + entity id + entity
    // created_at) when Razorpay doesn't send one — see webhook.routes.ts.
    eventId: varchar("event_id", { length: 255 }).notNull(),
    eventType: varchar("event_type", { length: 128 }).notNull(),
    status: webhookEventStatusEnum("status").notNull().default("RECEIVED"),
    // Full verified webhook payload — useful for replay/debugging. Never
    // contains secrets (the signature itself is verified, not stored).
    payload: jsonb("payload").$type<Record<string, unknown>>(),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
  },
  (table) => ({
    providerEventUnique: uniqueIndex("webhook_events_provider_event_unique").on(
      table.provider,
      table.eventId
    ),
    receivedIdx: index("webhook_events_received_idx").on(table.receivedAt),
  })
);

export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type NewWebhookEvent = typeof webhookEvents.$inferInsert;

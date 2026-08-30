import { and, count, desc, eq } from "drizzle-orm";
import { db, type Executor } from "../../db/index.js";
import {
  paymentAttempts,
  payments,
  type NewPaymentAttempt,
  type NewPayment,
  type PaymentAttempt,
  type Payment,
} from "../../db/schema/payments.js";
import { webhookEvents, type NewWebhookEvent } from "../../db/schema/webhook_events.js";

// --- payment_attempts ---------------------------------------------------

export async function insertPaymentAttempt(executor: Executor, values: NewPaymentAttempt): Promise<PaymentAttempt> {
  const [row] = await executor.insert(paymentAttempts).values(values).returning();
  return row;
}

export async function getNextAttemptNumber(executor: Executor, orderId: string): Promise<number> {
  const [row] = await executor
    .select({ total: count() })
    .from(paymentAttempts)
    .where(eq(paymentAttempts.orderId, orderId));
  return (row?.total ?? 0) + 1;
}

export async function updatePaymentAttempt(
  executor: Executor,
  id: string,
  values: Partial<NewPaymentAttempt>
): Promise<PaymentAttempt | undefined> {
  const [row] = await executor
    .update(paymentAttempts)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(paymentAttempts.id, id))
    .returning();
  return row;
}

/**
 * Compare-and-swap status update (audit hardening, concurrency fix).
 *
 * `updatePaymentAttempt` above writes unconditionally by id — fine for
 * non-status fields, but dangerous for the state machine: under Postgres
 * READ COMMITTED, two concurrent writers (e.g. a Razorpay webhook and a
 * racing /verify-payment call) can both SELECT the same starting status
 * before either commits, both pass the in-app `isValidAttemptTransition`
 * check, and then both blindly UPDATE — the second writer would silently
 * clobber whatever the first one just committed (e.g. overwriting a
 * freshly-captured attempt back to failed).
 *
 * This function closes that window by making `fromStatus` part of the
 * WHERE clause: the UPDATE only ever applies to a row that is STILL in
 * the exact state the caller read. If another transaction already moved
 * it, zero rows are affected and `undefined` is returned — the caller
 * (payment.service.ts `transitionAttempt`) re-fetches to find out what
 * actually happened instead of assuming its own view was correct.
 */
export async function casUpdatePaymentAttemptStatus(
  executor: Executor,
  id: string,
  fromStatus: PaymentAttempt["status"],
  values: Partial<NewPaymentAttempt>
): Promise<PaymentAttempt | undefined> {
  const [row] = await executor
    .update(paymentAttempts)
    .set({ ...values, updatedAt: new Date() })
    .where(and(eq(paymentAttempts.id, id), eq(paymentAttempts.status, fromStatus)))
    .returning();
  return row;
}

export async function getPaymentAttemptByIdScoped(
  organizationId: string,
  id: string,
  executor: Executor = db
): Promise<PaymentAttempt | undefined> {
  const [row] = await executor
    .select()
    .from(paymentAttempts)
    .where(and(eq(paymentAttempts.id, id), eq(paymentAttempts.organizationId, organizationId)))
    .limit(1);
  return row;
}

/** Looks up an attempt purely by the Razorpay order id it owns — used by verify-payment and the webhook handler, both of which only ever receive provider-side identifiers from the caller (never a trusted internal id). */
export async function getPaymentAttemptByProviderOrderId(
  providerOrderId: string,
  executor: Executor = db
): Promise<PaymentAttempt | undefined> {
  const [row] = await executor
    .select()
    .from(paymentAttempts)
    .where(and(eq(paymentAttempts.provider, "razorpay"), eq(paymentAttempts.providerOrderId, providerOrderId)))
    .limit(1);
  return row;
}

export async function listAttemptsForOrder(orderId: string, executor: Executor = db): Promise<PaymentAttempt[]> {
  return executor
    .select()
    .from(paymentAttempts)
    .where(eq(paymentAttempts.orderId, orderId))
    .orderBy(desc(paymentAttempts.attemptNumber));
}

/** Every attempt for an order that hasn't reached a terminal state yet — used to decide whether the order itself should flip to `failed`. */
export async function listActiveAttemptsForOrder(orderId: string, executor: Executor = db): Promise<PaymentAttempt[]> {
  const rows = await listAttemptsForOrder(orderId, executor);
  return rows.filter((a) => a.status === "created" || a.status === "pending" || a.status === "authorized");
}

// --- payments (captured record) -----------------------------------------

export async function insertPayment(executor: Executor, values: NewPayment): Promise<Payment> {
  const [row] = await executor.insert(payments).values(values).returning();
  return row;
}

export async function getPaymentByIdScoped(
  organizationId: string,
  id: string,
  executor: Executor = db
): Promise<Payment | undefined> {
  const [row] = await executor
    .select()
    .from(payments)
    .where(and(eq(payments.id, id), eq(payments.organizationId, organizationId)))
    .limit(1);
  return row;
}

export interface PaymentHistoryPagination {
  page: number;
  limit: number;
}

export async function listPaymentsForOrg(
  organizationId: string,
  pagination: PaymentHistoryPagination,
  executor: Executor = db
): Promise<{ rows: Payment[]; total: number }> {
  const offset = (pagination.page - 1) * pagination.limit;
  const [rows, [{ total }]] = await Promise.all([
    executor
      .select()
      .from(payments)
      .where(eq(payments.organizationId, organizationId))
      .orderBy(desc(payments.createdAt))
      .limit(pagination.limit)
      .offset(offset),
    executor.select({ total: count() }).from(payments).where(eq(payments.organizationId, organizationId)),
  ]);
  return { rows, total };
}

// --- webhook_events (idempotency ledger, Phase 11) -----------------------

/**
 * Atomically claims a webhook event for processing. Returns the inserted
 * row if this is the FIRST time this (provider, eventId) pair has been
 * seen, or `undefined` if it's a duplicate delivery — callers must treat
 * `undefined` as "already handled, do nothing, return 200 OK".
 */
export async function claimWebhookEventOnce(
  executor: Executor,
  values: NewWebhookEvent
): Promise<{ id: string } | undefined> {
  const [row] = await executor
    .insert(webhookEvents)
    .values(values)
    .onConflictDoNothing({ target: [webhookEvents.provider, webhookEvents.eventId] })
    .returning({ id: webhookEvents.id });
  return row;
}

export async function markWebhookEventProcessed(
  executor: Executor,
  id: string,
  status: "PROCESSED" | "IGNORED" | "FAILED"
): Promise<void> {
  await executor
    .update(webhookEvents)
    .set({ status, processedAt: new Date() })
    .where(eq(webhookEvents.id, id));
}

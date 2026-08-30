/**
 * Checkout orchestrator (Phases 2–9, 12–14, 16–17, 26).
 *
 * This is the ONLY module the AI commerce agent's tools are allowed to
 * call to move money (Rule 4 — the AI never calls Razorpay directly):
 *
 *   AI -> commerce tools -> checkout.service -> policy engine -> Razorpay
 *
 * Every branch below ends in either a persisted state change + audit
 * event, or a thrown AppError — nothing here silently no-ops.
 */
import { db, type Transaction } from "../../db/index.js";
import { Errors, AppError } from "../../utils/errors.js";
import { emitAudit } from "../../utils/audit.js";
import { env } from "../../config/env.js";
import { deriveCheckoutIdempotencyKey } from "../../utils/idempotency.js";
import { loadOrCreateSession, clearCart, persist as persistSession } from "../commerce-agent/conversation.service.js";
import { buildOrderPreview } from "../commerce-agent/order-preview.service.js";
import { getCustomerForOrg } from "../customers/customers.service.js";
import { reserveInventoryForOrg } from "../products/products.service.js";
import {
  createOrderWithItems,
  findOrderByIdempotencyKey,
  transitionOrderStatus,
} from "../orders/orders.service.js";
import { getOrderItemsForOrder } from "../orders/orders.repository.js";
import {
  insertPaymentAttempt,
  getNextAttemptNumber,
  listActiveAttemptsForOrder,
  getPaymentAttemptByProviderOrderId,
  getPaymentAttemptByIdScoped,
} from "../payments/payment.repository.js";
import { failAttempt, captureAttempt, transitionAttempt } from "../payments/payment.service.js";
import { razorpayGateway, isRazorpayConfigured } from "../payments/razorpay.client.js";
import type { Order } from "../../db/schema/orders.js";
import type { PaymentAttempt } from "../../db/schema/payments.js";
import type { CartItem, OrderPreviewItem } from "../commerce-agent/types.js";

export interface ActorInfo {
  userId: string;
  actorType?: "USER" | "AI_AGENT" | "SYSTEM";
}

export interface CheckoutResult {
  orderId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
  status: Order["status"];
  idempotent: boolean;
}

function toOrderItemInserts(items: OrderPreviewItem[]) {
  return items.map((i) => ({
    productId: i.productId,
    productName: i.name,
    quantity: i.quantity,
    unitAmount: i.unitAmount,
    totalAmount: i.totalAmount,
  }));
}

/**
 * Reserves inventory for every item in a checkout, atomically, as part of
 * transaction `tx` (Phase 14). If ANY item can't be reserved, throws —
 * the caller's transaction rolls back, so earlier successful reservations
 * in the same call are undone automatically (no manual compensation
 * needed for the same-transaction case).
 */
async function reserveAllOrThrow(tx: Transaction, organizationId: string, items: OrderPreviewItem[]) {
  for (const item of items) {
    await reserveInventoryForOrg(tx, organizationId, item.productId, item.quantity, item.name);
  }
  emitAudit({
    type: "INVENTORY_RESERVED",
    actor: { organizationId, actorType: "SYSTEM" },
    target: { kind: "checkout", extras: { itemCount: items.length } },
    context: { reason: "Inventory reserved for checkout.", items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })) },
  });
}

/**
 * Talks to Razorpay to create the order for an already-persisted
 * `payment_attempt` row (status "created", no providerOrderId yet), and
 * records the result. Deliberately runs OUTSIDE any DB transaction
 * (Phase 25: never hold a transaction open across a slow external call).
 *
 * On success: attempt -> "pending", providerOrderId set.
 * On failure: attempt -> "failed" (which cascades to order "failed" +
 * inventory restore via payment.service.failAttempt, since this is
 * necessarily still the order's only attempt at this point).
 */
export async function createRazorpayOrderForAttempt(
  order: Order,
  attempt: PaymentAttempt,
  actor: ActorInfo
): Promise<PaymentAttempt> {
  if (!isRazorpayConfigured()) {
    await failAttempt(db, attempt, "RAZORPAY_NOT_CONFIGURED", "Razorpay is not configured on this server.", actor);
    emitAudit({
      type: "CHECKOUT_FAILED",
      actor: { userId: actor.userId, organizationId: order.organizationId, actorType: actor.actorType ?? "USER" },
      target: { kind: "order", id: order.id },
      context: { reason: "Razorpay is not configured (RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET missing)." },
    });
    throw new AppError(500, "PAYMENT_PROVIDER_NOT_CONFIGURED", "Payments are not configured on this server yet. Please contact the merchant.", {
      retryable: false,
    });
  }

  try {
    const rpOrder = await razorpayGateway.createOrder({
      amount: attempt.amount,
      currency: attempt.currency,
      // Razorpay receipts must be unique on the account and <=40 chars.
      receipt: `${order.orderNumber}-a${attempt.attemptNumber}`.slice(0, 40),
      notes: { orderId: order.id, organizationId: order.organizationId, attemptId: attempt.id },
    });

    emitAudit({
      type: "RAZORPAY_ORDER_CREATED",
      actor: { userId: actor.userId, organizationId: order.organizationId, actorType: actor.actorType ?? "USER" },
      target: { kind: "payment_attempt", id: attempt.id, extras: { razorpayOrderId: rpOrder.id, orderId: order.id } },
      context: { reason: "Razorpay Test/Live order created for this checkout attempt." },
    });

    // Routed through the centralized state-machine function (not a raw
    // repository write) so this transition gets the same CAS/validity
    // protection as every other payment_attempts.status write — keeping
    // payment.service.ts's "only place status is written" invariant true
    // even for this created -> pending step.
    const { attempt: updated } = await transitionAttempt(db, attempt, "pending", { providerOrderId: rpOrder.id }, actor);

    emitAudit({
      type: "PAYMENT_INITIATED",
      actor: { userId: actor.userId, organizationId: order.organizationId, actorType: actor.actorType ?? "USER" },
      target: { kind: "payment_attempt", id: attempt.id, extras: { orderId: order.id } },
      context: { reason: "Buyer can now complete payment via Razorpay Checkout." },
    });

    return updated;
  } catch (err) {
    if (err instanceof AppError) throw err;
    const message = err instanceof Error ? err.message : "Unknown Razorpay error";
    await failAttempt(db, attempt, "RAZORPAY_ORDER_CREATE_FAILED", message, actor);
    emitAudit({
      type: "RAZORPAY_ORDER_CREATE_FAILED",
      actor: { userId: actor.userId, organizationId: order.organizationId, actorType: actor.actorType ?? "USER" },
      target: { kind: "payment_attempt", id: attempt.id, extras: { orderId: order.id } },
      context: { reason: message },
    });
    emitAudit({
      type: "CHECKOUT_FAILED",
      actor: { userId: actor.userId, organizationId: order.organizationId, actorType: actor.actorType ?? "USER" },
      target: { kind: "order", id: order.id },
      context: { reason: "Unable to create the Razorpay order." },
    });
    throw new AppError(502, "PAYMENT_PROVIDER_ERROR", "Unable to start payment with Razorpay right now. Your order is safe — please try again.", {
      retryable: true,
    });
  }
}

function toCheckoutResult(order: Order, attempt: PaymentAttempt, idempotent: boolean): CheckoutResult {
  if (!attempt.providerOrderId) {
    // Should be unreachable by the time this is called — every caller
    // routes through createRazorpayOrderForAttempt first.
    throw Errors.internal("Checkout attempt has no Razorpay order id yet");
  }
  return {
    orderId: order.id,
    razorpayOrderId: attempt.providerOrderId,
    amount: attempt.amount,
    currency: attempt.currency,
    keyId: env.RAZORPAY_KEY_ID ?? "",
    status: order.status,
    idempotent,
  };
}

export interface CreateCheckoutOrderInput {
  organizationId: string;
  sessionId: string;
  customerId: string;
  idempotencyKey?: string;
}

export async function createCheckoutOrder(input: CreateCheckoutOrderInput, actor: ActorInfo): Promise<CheckoutResult> {
  const { organizationId, sessionId, customerId } = input;

  // Ownership check — never trust a customerId belongs to this org just
  // because it was well-formed; getCustomerForOrg 404s otherwise.
  await getCustomerForOrg(organizationId, customerId);

  const session = await loadOrCreateSession(organizationId, actor.userId, sessionId);
  const cart: CartItem[] = session.cart;
  if (cart.length === 0) {
    throw Errors.badRequest("Your cart is empty — add at least one product before checking out.");
  }

  const idempotencyKey = input.idempotencyKey ?? deriveCheckoutIdempotencyKey(organizationId, sessionId, cart, customerId);

  emitAudit({
    type: "CHECKOUT_REQUESTED",
    actor: { userId: actor.userId, organizationId, actorType: actor.actorType ?? "USER" },
    target: { kind: "checkout", extras: { sessionId, customerId } },
    context: { reason: "Checkout requested.", cartSize: cart.length, idempotencyKey },
  });

  // --- Idempotency / retry resolution (Phases 13, 26) --------------------
  const existing = await findOrderByIdempotencyKey(organizationId, idempotencyKey);
  if (existing) {
    return resolveExistingOrder(existing, actor);
  }

  // --- Fresh checkout ------------------------------------------------------
  emitAudit({
    type: "POLICY_CHECK_STARTED",
    actor: { userId: actor.userId, organizationId, actorType: actor.actorType ?? "USER" },
    target: { kind: "checkout", extras: { sessionId } },
    context: { reason: "Evaluating cart against policy engine." },
  });

  const { preview, policy } = await buildOrderPreview(organizationId, cart);
  if (!preview || policy.status === "FAIL") {
    emitAudit({
      type: "POLICY_REJECTED",
      actor: { userId: actor.userId, organizationId, actorType: actor.actorType ?? "USER" },
      target: { kind: "checkout", extras: { sessionId } },
      context: { reason: "Cart failed one or more policy checks.", checks: policy.checks },
    });
    throw Errors.unprocessable("Your cart did not pass checkout policy checks.", { checks: policy.checks });
  }

  emitAudit({
    type: "POLICY_APPROVED",
    actor: { userId: actor.userId, organizationId, actorType: actor.actorType ?? "USER" },
    target: { kind: "checkout", extras: { sessionId } },
    context: { reason: "Cart is within policy — inventory available and no budget/eligibility violations.", checks: policy.checks },
  });

  const { order, attempt } = await db.transaction(async (tx) => {
    await reserveAllOrThrow(tx, organizationId, preview.items);

    const { order } = await createOrderWithItems(
      tx,
      {
        organizationId,
        customerId,
        status: "pending",
        idempotencyKey,
        currency: preview.currency,
        subtotalAmount: preview.subtotal,
        discountAmount: 0,
        taxAmount: preview.tax,
        totalAmount: preview.total,
        metadata: { sessionId, shippingAmount: preview.shipping, createdVia: "checkout.create-order" },
      },
      toOrderItemInserts(preview.items)
    );

    emitAudit({
      type: "ORDER_CREATED",
      actor: { userId: actor.userId, organizationId, actorType: actor.actorType ?? "USER" },
      target: { kind: "order", id: order.id },
      context: { reason: "Internal order created, pending payment.", totalAmount: order.totalAmount, currency: order.currency },
    });

    const attempt = await insertPaymentAttempt(tx, {
      organizationId,
      orderId: order.id,
      attemptNumber: 1,
      provider: "razorpay",
      status: "created",
      amount: order.totalAmount,
      currency: order.currency,
    });

    return { order, attempt };
  });

  const finalAttempt = await createRazorpayOrderForAttempt(order, attempt, actor);

  // Cart is now "spent" — clear it so the buyer doesn't accidentally
  // re-checkout the same items as a brand-new order in this session.
  clearCart(session);
  await persistSession(session);

  return toCheckoutResult(order, finalAttempt, false);
}

/**
 * Resolves a checkout request that matched an existing order by
 * idempotency key: either an idempotent replay of an in-flight checkout,
 * a hard conflict (already paid/cancelled), or a retry of a failed one.
 */
async function resolveExistingOrder(order: Order, actor: ActorInfo): Promise<CheckoutResult> {
  if (order.status === "paid") {
    throw Errors.conflict("This checkout has already been paid.", { orderId: order.id });
  }
  if (order.status === "cancelled" || order.status === "refunded") {
    throw Errors.conflict(`This checkout is ${order.status} and cannot be resumed.`, { orderId: order.id });
  }

  if (order.status === "pending") {
    const active = await listActiveAttemptsForOrder(order.id);
    if (active.length > 0) {
      const attempt = active[0];
      const finalAttempt = attempt.providerOrderId
        ? attempt
        : await createRazorpayOrderForAttempt(order, attempt, actor);
      emitAudit({
        type: "CHECKOUT_IDEMPOTENT_REPLAY",
        actor: { userId: actor.userId, organizationId: order.organizationId, actorType: actor.actorType ?? "USER" },
        target: { kind: "order", id: order.id },
        context: { reason: "Duplicate checkout request for an already in-flight order — returning the existing Razorpay order instead of creating a new one." },
      });
      return toCheckoutResult(order, finalAttempt, true);
    }
    // status is "pending" but no active attempt — shouldn't normally
    // happen (every pending order gets an attempt in the same
    // transaction), but if it does, fall through to the retry path below
    // rather than leaving the buyer stuck.
  }

  // order.status is "failed" (or the pending/no-active-attempt edge case
  // above) — this is a retry (Phase 13): re-validate + re-reserve
  // inventory and create a NEW attempt against the SAME order, rather
  // than creating a second order.
  return retryCheckoutOrder(order, actor);
}

export async function retryCheckoutOrder(order: Order, actor: ActorInfo): Promise<CheckoutResult> {
  emitAudit({
    type: "CHECKOUT_RETRY_REQUESTED",
    actor: { userId: actor.userId, organizationId: order.organizationId, actorType: actor.actorType ?? "USER" },
    target: { kind: "order", id: order.id },
    context: { reason: "Retrying checkout for a previously failed order." },
  });

  const items = await getOrderItemsForOrder(order.id);

  const { attempt } = await db.transaction(async (tx) => {
    // Re-reserve inventory — it was released when the order first went
    // to "failed" (see payment.service.failAttempt). Someone else may
    // have bought the stock in the meantime, in which case this throws
    // and the whole retry rolls back cleanly.
    for (const item of items) {
      if (!item.productId) {
        throw Errors.conflict(`"${item.productName}" is no longer available in the catalog and this order can't be retried.`, {
          orderId: order.id,
        });
      }
      await reserveInventoryForOrg(tx, order.organizationId, item.productId, item.quantity, item.productName);
    }
    emitAudit({
      type: "INVENTORY_RESERVED",
      actor: { organizationId: order.organizationId, actorType: "SYSTEM" },
      target: { kind: "order", id: order.id },
      context: { reason: "Inventory re-reserved for checkout retry." },
    });

    const attemptNumber = await getNextAttemptNumber(tx, order.id);
    const attempt = await insertPaymentAttempt(tx, {
      organizationId: order.organizationId,
      orderId: order.id,
      attemptNumber,
      provider: "razorpay",
      status: "created",
      amount: order.totalAmount,
      currency: order.currency,
    });

    await transitionOrderStatus(tx, order.organizationId, order.id, "pending", "Buyer retrying a previously failed payment.", actor);

    return { attempt };
  });

  const finalAttempt = await createRazorpayOrderForAttempt(order, attempt, actor);
  return toCheckoutResult({ ...order, status: "pending" }, finalAttempt, false);
}

/**
 * Milestone 6 Phase 7/8 — revenue-opportunity ABANDONED_CHECKOUT execution
 * (revenue.execution.ts) needs to guarantee a still-pending order has a
 * live Razorpay order/payment link a recovery message can point the buyer
 * at. Deliberately does NOT transition the order's status (it's already
 * "pending" — that's the definition of "abandoned", not "failed") and
 * does NOT touch inventory beyond what checkout already reserved for it —
 * this only ensures a payment attempt with a providerOrderId exists,
 * reusing the exact same Razorpay-order-creation path checkout itself
 * uses (Rule 3/4: still the only code path that talks to Razorpay).
 */
export async function ensureActivePaymentLinkForOrder(order: Order, actor: ActorInfo): Promise<PaymentAttempt> {
  const active = await listActiveAttemptsForOrder(order.id);
  if (active.length > 0) {
    const attempt = active[0];
    return attempt.providerOrderId ? attempt : createRazorpayOrderForAttempt(order, attempt, actor);
  }

  const attemptNumber = await getNextAttemptNumber(db, order.id);
  const attempt = await insertPaymentAttempt(db, {
    organizationId: order.organizationId,
    orderId: order.id,
    attemptNumber,
    provider: "razorpay",
    status: "created",
    amount: order.totalAmount,
    currency: order.currency,
  });
  return createRazorpayOrderForAttempt(order, attempt, actor);
}

// --- Payment verification (Phase 8) --------------------------------------

export interface VerifyPaymentInput {
  organizationId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface VerifyPaymentResult {
  orderId: string;
  status: Order["status"];
}

export async function verifyCheckoutPayment(input: VerifyPaymentInput, actor: ActorInfo): Promise<VerifyPaymentResult> {
  const { organizationId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = input;

  emitAudit({
    type: "PAYMENT_VERIFICATION_STARTED",
    actor: { userId: actor.userId, organizationId, actorType: actor.actorType ?? "USER" },
    target: { kind: "payment_attempt", extras: { razorpayOrderId } },
    context: { reason: "Verifying Razorpay payment signature." },
  });

  // Looked up purely by the Razorpay order id — never by anything the
  // client claims about which order/organization this belongs to.
  const attempt = await getPaymentAttemptByProviderOrderId(razorpayOrderId);
  if (!attempt || attempt.organizationId !== organizationId) {
    // Same 404 whether the attempt doesn't exist at all or belongs to a
    // different org — never confirm cross-tenant existence.
    throw Errors.notFound("Payment attempt not found");
  }

  if (!razorpayGateway.verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
    emitAudit({
      type: "PAYMENT_SIGNATURE_INVALID",
      actor: { userId: actor.userId, organizationId, actorType: actor.actorType ?? "USER" },
      target: { kind: "payment_attempt", id: attempt.id },
      context: { reason: "Razorpay payment signature did not verify." },
    });
    await failAttemptSafely(attempt, "SIGNATURE_INVALID", "Payment signature verification failed.", actor);
    throw new AppError(400, "PAYMENT_SIGNATURE_INVALID", "We couldn't verify this payment. Your order is still safe — please try again.", {
      retryable: true,
    });
  }

  await db.transaction(async (tx) => {
    // Re-fetch inside the transaction to avoid acting on a stale status
    // if a webhook raced us and already captured this attempt between our
    // read above and this write.
    const fresh = await getPaymentAttemptByIdScoped(organizationId, attempt.id, tx);
    if (!fresh) throw Errors.notFound("Payment attempt not found");
    if (fresh.status === "captured") return; // webhook beat us to it — idempotent no-op
    await captureAttempt(tx, fresh, razorpayPaymentId, actor);
  });

  emitAudit({
    type: "PAYMENT_VERIFIED",
    actor: { userId: actor.userId, organizationId, actorType: actor.actorType ?? "USER" },
    target: { kind: "payment_attempt", id: attempt.id, extras: { orderId: attempt.orderId } },
    context: { reason: "Payment signature verified and order marked paid." },
  });

  return { orderId: attempt.orderId, status: "paid" };
}

async function failAttemptSafely(attempt: PaymentAttempt, code: string, message: string, actor: ActorInfo) {
  try {
    await failAttempt(db, attempt, code, message, actor);
  } catch {
    // If the attempt was already terminal (e.g. a webhook already marked
    // it captured/failed), failAttempt's own idempotent guard handles it
    // — this catch is only a defensive backstop.
  }
}

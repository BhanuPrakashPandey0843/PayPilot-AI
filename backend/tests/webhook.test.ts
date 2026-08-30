/**
 * Integration tests for the Razorpay webhook receiver (Milestone 5,
 * Phase 10/11) — specifically the idempotency and cross-path-race
 * behavior that isn't exercised by checkout.test.ts (which only drives
 * /verify-payment, never POST /api/v1/webhooks/razorpay directly).
 *
 * Same requirements/conventions as checkout.test.ts: real Postgres via
 * DATABASE_URL, migrated + seeded, Razorpay itself never called
 * (razorpayGateway methods are mocked per-test).
 *
 * Run from backend/:
 *   npm test
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import Fastify from "fastify";
import jwt from "@fastify/jwt";

import { env } from "../src/config/env.js";
import { registerAuthenticate } from "../src/middleware/authenticate.js";
import { authRoutes } from "../src/modules/auth/auth.routes.js";
import { commerceAgentRoutes } from "../src/modules/commerce-agent/commerce.routes.js";
import { checkoutRoutes } from "../src/modules/checkout/checkout.routes.js";
import { paymentRoutes } from "../src/modules/payments/payment.routes.js";
import { webhookRoutes } from "../src/modules/payments/webhook.routes.js";
import { auditRoutes } from "../src/modules/audit/audit.routes.js";
import { razorpayGateway, type RazorpayOrderResult } from "../src/modules/payments/razorpay.client.js";
import { AppError } from "../src/utils/errors.js";
import { fail } from "../src/utils/response.js";
import { db } from "../src/db/index.js";
import { products } from "../src/db/schema/products.js";
import { customers } from "../src/db/schema/customers.js";
import { payments } from "../src/db/schema/payments.js";
import { eq } from "drizzle-orm";

env.RAZORPAY_KEY_ID = "rzp_test_mock_key_id";
env.RAZORPAY_KEY_SECRET = "mock_key_secret_for_tests_only";
env.RAZORPAY_WEBHOOK_SECRET = "mock_webhook_secret_for_tests_only";

async function buildTestApp() {
  const app = Fastify({ logger: false });

  await app.register(jwt, { secret: env.JWT_SECRET, sign: { expiresIn: env.JWT_EXPIRES_IN } });
  registerAuthenticate(app);

  app.setErrorHandler((err, _request, reply) => {
    if (err instanceof AppError) {
      reply.code(err.statusCode).send(fail(err.code, err.message, err.details));
      return;
    }
    const anyErr = err as { statusCode?: number; validation?: unknown } | undefined;
    if (anyErr?.validation) {
      const code = anyErr?.statusCode === 400 ? "BAD_REQUEST" : "UNPROCESSABLE_ENTITY";
      const statusCode = anyErr?.statusCode && anyErr.statusCode >= 400 ? anyErr.statusCode : 422;
      reply.code(statusCode).send(fail(code, "Validation failed", anyErr.validation));
      return;
    }
    reply.code(500).send(fail("INTERNAL_ERROR", "Something went wrong"));
  });

  await app.register(authRoutes, { prefix: "/api/v1/auth" });
  await app.register(commerceAgentRoutes, { prefix: "/api/v1/commerce" });
  await app.register(checkoutRoutes, { prefix: "/api/v1/checkout" });
  await app.register(paymentRoutes, { prefix: "/api/v1/payments" });
  await app.register(webhookRoutes, { prefix: "/api/v1/webhooks" });
  await app.register(auditRoutes, { prefix: "/api/v1/audit" });

  await app.ready();
  return app;
}

const PASSWORD_GOOD = "password123";

function uniqueEmail(prefix = "webhook-test") {
  return `${prefix}-${randomUUID()}@example.com`;
}
function uniqueOrgName() {
  return `Webhook Test Org ${randomUUID().slice(0, 8)}`;
}
function uniqueSessionId() {
  return `session-${randomUUID()}`;
}
function auth(token: string) {
  return { authorization: `Bearer ${token}` };
}

interface Credentials {
  token: string;
  organizationId: string;
  userId: string;
}

async function registerUser(app: Awaited<ReturnType<typeof buildTestApp>>): Promise<Credentials> {
  const res = await app.inject({
    method: "POST",
    url: "/api/v1/auth/register",
    payload: {
      email: uniqueEmail(),
      password: PASSWORD_GOOD,
      firstName: "Webhook",
      lastName: "Tester",
      organizationName: uniqueOrgName(),
    },
  });
  const body = res.json();
  return { token: body.data.token, organizationId: body.data.organization.id, userId: body.data.user.id };
}

async function insertProduct(organizationId: string) {
  const suffix = randomUUID().slice(0, 8);
  const [row] = await db
    .insert(products)
    .values({
      organizationId,
      name: `Webhook Test Product ${suffix}`,
      slug: `webhook-test-product-${suffix}`,
      description: "A product used in webhook integration tests.",
      category: "Running Shoes",
      tags: ["running"],
      price: 250000,
      currency: "INR",
      inventoryQuantity: 10,
      isActive: true,
    })
    .returning();
  return row;
}

async function insertCustomer(organizationId: string) {
  const [row] = await db
    .insert(customers)
    .values({ organizationId, name: "Webhook Test Buyer", status: "active" })
    .returning();
  return row;
}

async function addToCart(app: Awaited<ReturnType<typeof buildTestApp>>, token: string, sessionId: string, productId: string) {
  const res = await app.inject({
    method: "POST",
    url: "/api/v1/commerce/chat",
    headers: auth(token),
    payload: { sessionId, message: "add it to my cart", productId, quantity: 1 },
  });
  assert.equal(res.statusCode, 200, `addToCart failed: ${res.body}`);
}

let rpOrderCounter = 0;
function mockRazorpayGateway() {
  const originalCreateOrder = razorpayGateway.createOrder;
  const originalVerifySignature = razorpayGateway.verifyPaymentSignature;
  const originalVerifyWebhook = razorpayGateway.verifyWebhookSignature;

  razorpayGateway.createOrder = async (params) => {
    rpOrderCounter += 1;
    const result: RazorpayOrderResult = {
      id: `order_MOCK${rpOrderCounter}${randomUUID().slice(0, 6)}`,
      amount: params.amount,
      currency: params.currency,
      status: "created",
    };
    return result;
  };
  razorpayGateway.verifyPaymentSignature = () => true;
  // The webhook route's own signature check is what we're testing around
  // (duplicate delivery / race handling), not HMAC math itself — that's
  // already covered by razorpay.client.ts's own unit-level correctness.
  // A bad-signature webhook request is tested separately below by
  // temporarily flipping this back to a real rejection.
  razorpayGateway.verifyWebhookSignature = () => true;

  return {
    restore: () => {
      razorpayGateway.createOrder = originalCreateOrder;
      razorpayGateway.verifyPaymentSignature = originalVerifySignature;
      razorpayGateway.verifyWebhookSignature = originalVerifyWebhook;
    },
  };
}

/** Creates a checkout order (pending, with a Razorpay order id) ready for a webhook to act on. */
async function createPendingCheckout(app: Awaited<ReturnType<typeof buildTestApp>>) {
  const user = await registerUser(app);
  const product = await insertProduct(user.organizationId);
  const customer = await insertCustomer(user.organizationId);
  const sessionId = uniqueSessionId();
  await addToCart(app, user.token, sessionId, product.id);

  const create = await app.inject({
    method: "POST",
    url: "/api/v1/checkout/create-order",
    headers: auth(user.token),
    payload: { sessionId, customerId: customer.id },
  });
  assert.equal(create.statusCode, 200, create.body);
  const { orderId, razorpayOrderId } = create.json().data;
  return { user, orderId, razorpayOrderId };
}

function paymentCapturedPayload(razorpayOrderId: string, razorpayPaymentId: string, eventId?: string) {
  return {
    id: eventId,
    event: "payment.captured",
    created_at: Math.floor(Date.now() / 1000),
    payload: {
      payment: {
        entity: {
          id: razorpayPaymentId,
          order_id: razorpayOrderId,
          status: "captured",
          amount: 250000,
          currency: "INR",
        },
      },
    },
  };
}

async function postWebhook(app: Awaited<ReturnType<typeof buildTestApp>>, body: unknown) {
  return app.inject({
    method: "POST",
    url: "/api/v1/webhooks/razorpay",
    headers: { "x-razorpay-signature": "mocked-signature", "content-type": "application/json" },
    payload: JSON.stringify(body),
  });
}

// =====================================================================

test("(WH1) an invalid webhook signature is rejected with 401 and never processed", async (t) => {
  const app = await buildTestApp();
  t.after(() => app.close());
  const mock = mockRazorpayGateway();
  t.after(mock.restore);

  const { orderId, razorpayOrderId } = await createPendingCheckout(app);

  razorpayGateway.verifyWebhookSignature = () => false;
  const res = await postWebhook(app, paymentCapturedPayload(razorpayOrderId, `pay_${randomUUID().slice(0, 8)}`, randomUUID()));
  assert.equal(res.statusCode, 401, res.body);

  // Order must NOT have been marked paid by a forged webhook.
  const historyRes = await app.inject({ method: "GET", url: `/api/v1/payments/${orderId}` });
  // (no auth on this ad-hoc check needed beyond confirming no payment row exists)
  const [row] = await db.select().from(payments).where(eq(payments.orderId, orderId));
  assert.equal(row, undefined, "an invalid-signature webhook must never create a payment record");
  void historyRes;
});

test("(WH2) a valid payment.captured webhook marks the order paid", async (t) => {
  const app = await buildTestApp();
  t.after(() => app.close());
  const mock = mockRazorpayGateway();
  t.after(mock.restore);

  const { orderId, razorpayOrderId } = await createPendingCheckout(app);
  const eventId = randomUUID();

  const res = await postWebhook(app, paymentCapturedPayload(razorpayOrderId, `pay_${randomUUID().slice(0, 8)}`, eventId));
  assert.equal(res.statusCode, 200, res.body);
  assert.equal(res.json().data.processed, true);

  const [row] = await db.select().from(payments).where(eq(payments.orderId, orderId));
  assert.ok(row, "expected a captured payment row after the webhook");
  assert.equal(row!.status, "captured");
});

test("(WH3) a duplicate delivery of the SAME webhook event is ignored — no second payment row", async (t) => {
  const app = await buildTestApp();
  t.after(() => app.close());
  const mock = mockRazorpayGateway();
  t.after(mock.restore);

  const { orderId, razorpayOrderId } = await createPendingCheckout(app);
  const eventId = randomUUID();
  const payload = paymentCapturedPayload(razorpayOrderId, `pay_${randomUUID().slice(0, 8)}`, eventId);

  const first = await postWebhook(app, payload);
  assert.equal(first.statusCode, 200, first.body);
  assert.equal(first.json().data.duplicate, undefined);

  // Razorpay redelivers the EXACT same event (same id) — a common,
  // expected occurrence, not an attack.
  const second = await postWebhook(app, payload);
  assert.equal(second.statusCode, 200, second.body);
  assert.equal(second.json().data.duplicate, true, "redelivery of the same event id must be recognized as a duplicate");

  const rows = await db.select().from(payments).where(eq(payments.orderId, orderId));
  assert.equal(rows.length, 1, "a duplicate webhook delivery must never create a second payment row");
});

test("(WH4) a payment.captured webhook arriving AFTER /verify-payment already captured the same attempt is a clean idempotent no-op", async (t) => {
  // This is the concurrency path hardened in payment.service.ts: captureAttempt()
  // must not attempt a second `payments` insert (which would hit the unique
  // index on payment_attempt_id) when a concurrent path already captured it.
  const app = await buildTestApp();
  t.after(() => app.close());
  const mock = mockRazorpayGateway();
  t.after(mock.restore);

  const { user, orderId, razorpayOrderId } = await createPendingCheckout(app);

  // /verify-payment captures it first (simulating the buyer's browser
  // completing Razorpay Checkout and calling verify before the webhook
  // arrives — a very common ordering in practice).
  const verify = await app.inject({
    method: "POST",
    url: "/api/v1/checkout/verify-payment",
    headers: auth(user.token),
    payload: { razorpayOrderId, razorpayPaymentId: `pay_${randomUUID().slice(0, 8)}`, razorpaySignature: "irrelevant-mocked" },
  });
  assert.equal(verify.statusCode, 200, verify.body);

  // The webhook for the SAME underlying capture now arrives (different
  // event id than any verify-payment call uses — verify-payment doesn't
  // go through the webhook idempotency ledger at all, so this exercises
  // the payment_attempts-level CAS/idempotency, not the webhook_events
  // dedupe table).
  const res = await postWebhook(app, paymentCapturedPayload(razorpayOrderId, `pay_webhook_${randomUUID().slice(0, 8)}`, randomUUID()));
  assert.equal(res.statusCode, 200, res.body);
  assert.equal(res.json().data.processed, true, "the webhook itself is acknowledged and processed cleanly, not treated as a failure");

  const rows = await db.select().from(payments).where(eq(payments.orderId, orderId));
  assert.equal(rows.length, 1, "a webhook racing an already-captured attempt must never insert a second payment row");
});

test("(WH5) a webhook for a Razorpay order id this system never created is acknowledged as a no-op", async (t) => {
  const app = await buildTestApp();
  t.after(() => app.close());
  const mock = mockRazorpayGateway();
  t.after(mock.restore);

  const res = await postWebhook(
    app,
    paymentCapturedPayload(`order_UNKNOWN_${randomUUID().slice(0, 8)}`, `pay_${randomUUID().slice(0, 8)}`, randomUUID())
  );
  assert.equal(res.statusCode, 200, res.body);
  assert.equal(res.json().data.processed, true);
});

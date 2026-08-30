/**
 * Integration tests for Milestone 5 — Razorpay test-mode checkout,
 * payment orchestration, and audit trail.
 *
 * Requires (same as commerce.test.ts):
 *   - DATABASE_URL set in .env pointing to a real Neon/Postgres DB
 *   - `npm run db:migrate` applied (after `npm run db:generate`)
 *   - `npm run db:seed` run (roles + permissions, incl. ai.execute, audit.read)
 *
 * Razorpay itself is NEVER called — `razorpayGateway`'s methods are
 * swapped for mocks in every test (Phase 28: "Mock external Razorpay
 * calls in automated tests. Do not make the normal test suite depend on
 * live Razorpay."). RAZORPAY_KEY_ID/SECRET are also stubbed onto the
 * shared `env` object purely so checkout.service's `isRazorpayConfigured()`
 * gate passes in this test environment (real .env may have these blank).
 *
 * Run from backend/:
 *   npm test
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import Fastify from "fastify";
import jwt from "@fastify/jwt";
import { eq, and } from "drizzle-orm";

import { env } from "../src/config/env.js";
import { registerAuthenticate } from "../src/middleware/authenticate.js";
import { authRoutes } from "../src/modules/auth/auth.routes.js";
import { commerceAgentRoutes } from "../src/modules/commerce-agent/commerce.routes.js";
import { checkoutRoutes } from "../src/modules/checkout/checkout.routes.js";
import { paymentRoutes } from "../src/modules/payments/payment.routes.js";
import { auditRoutes } from "../src/modules/audit/audit.routes.js";
import { razorpayGateway, type RazorpayOrderResult } from "../src/modules/payments/razorpay.client.js";
import { AppError } from "../src/utils/errors.js";
import { fail } from "../src/utils/response.js";
import { db } from "../src/db/index.js";
import { products } from "../src/db/schema/products.js";
import { customers } from "../src/db/schema/customers.js";
import { roles } from "../src/db/schema/roles.js";
import { permissions } from "../src/db/schema/permissions.js";
import { rolePermissions } from "../src/db/schema/role_permissions.js";
import { organizationMembers } from "../src/db/schema/organization_members.js";

// Test-only Razorpay config so checkout.service's isRazorpayConfigured()
// gate passes — the actual Razorpay SDK is never invoked because
// razorpayGateway.createOrder/verifyPaymentSignature are mocked per-test.
env.RAZORPAY_KEY_ID = "rzp_test_mock_key_id";
env.RAZORPAY_KEY_SECRET = "mock_key_secret_for_tests_only";

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
  await app.register(auditRoutes, { prefix: "/api/v1/audit" });

  await app.ready();
  return app;
}

const PASSWORD_GOOD = "password123";

function uniqueEmail(prefix = "checkout-test") {
  return `${prefix}-${randomUUID()}@example.com`;
}
function uniqueOrgName() {
  return `Checkout Test Org ${randomUUID().slice(0, 8)}`;
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

async function registerUser(
  app: Awaited<ReturnType<typeof buildTestApp>>,
  opts: { email?: string; orgName?: string } = {}
): Promise<Credentials> {
  const res = await app.inject({
    method: "POST",
    url: "/api/v1/auth/register",
    payload: {
      email: opts.email ?? uniqueEmail(),
      password: PASSWORD_GOOD,
      firstName: "Checkout",
      lastName: "Tester",
      organizationName: opts.orgName ?? uniqueOrgName(),
    },
  });
  const body = res.json();
  return { token: body.data.token, organizationId: body.data.organization.id, userId: body.data.user.id };
}

/** Downgrades a user's membership to a fresh role that ONLY has `ai.read` — used to prove ai.read cannot execute checkout (Rule 4 / Phase 2). */
async function downgradeToAiReadOnly(user: Credentials): Promise<void> {
  const [role] = await db
    .insert(roles)
    .values({ name: `AI_READ_ONLY_${randomUUID().slice(0, 8)}`, description: "test-only: ai.read but not ai.execute" })
    .returning();
  const [aiReadPermission] = await db.select({ id: permissions.id }).from(permissions).where(eq(permissions.name, "ai.read")).limit(1);
  await db.insert(rolePermissions).values({ roleId: role.id, permissionId: aiReadPermission.id });
  await db
    .update(organizationMembers)
    .set({ roleId: role.id })
    .where(and(eq(organizationMembers.userId, user.userId), eq(organizationMembers.organizationId, user.organizationId)));
}

/** Downgrades a user's membership to a role with NO permissions at all. */
async function downgradeToNoPermissions(user: Credentials): Promise<void> {
  const [role] = await db
    .insert(roles)
    .values({ name: `NO_PERMS_${randomUUID().slice(0, 8)}`, description: "test-only: zero permissions" })
    .returning();
  await db
    .update(organizationMembers)
    .set({ roleId: role.id })
    .where(and(eq(organizationMembers.userId, user.userId), eq(organizationMembers.organizationId, user.organizationId)));
}

async function insertProduct(organizationId: string, overrides: Partial<typeof products.$inferInsert> = {}) {
  const suffix = randomUUID().slice(0, 8);
  const [row] = await db
    .insert(products)
    .values({
      organizationId,
      name: overrides.name ?? `Test Product ${suffix}`,
      slug: overrides.slug ?? `test-product-${suffix}`,
      description: overrides.description ?? "A product used in checkout integration tests.",
      category: overrides.category ?? "Running Shoes",
      tags: overrides.tags ?? ["running"],
      price: overrides.price ?? 479900,
      currency: overrides.currency ?? "INR",
      inventoryQuantity: overrides.inventoryQuantity ?? 10,
      isActive: overrides.isActive ?? true,
    })
    .returning();
  return row;
}

async function insertCustomer(organizationId: string, overrides: Partial<typeof customers.$inferInsert> = {}) {
  const [row] = await db
    .insert(customers)
    .values({
      organizationId,
      name: overrides.name ?? "Test Buyer",
      status: overrides.status ?? "active",
      externalCustomerId: overrides.externalCustomerId,
      email: overrides.email,
      phone: overrides.phone,
    })
    .returning();
  return row;
}

async function addToCart(app: Awaited<ReturnType<typeof buildTestApp>>, token: string, sessionId: string, productId: string, quantity = 1) {
  const res = await app.inject({
    method: "POST",
    url: "/api/v1/commerce/chat",
    headers: auth(token),
    payload: { sessionId, message: "add it to my cart", productId, quantity },
  });
  assert.equal(res.statusCode, 200, `addToCart failed: ${res.body}`);
}

let rpOrderCounter = 0;
function mockRazorpayOrder(overrides: Partial<RazorpayOrderResult> = {}): RazorpayOrderResult {
  rpOrderCounter += 1;
  return { id: `order_MOCK${rpOrderCounter}${randomUUID().slice(0, 6)}`, amount: 0, currency: "INR", status: "created", ...overrides };
}

/** Swaps razorpayGateway's methods for mocks and returns a restore function + call counters. */
function mockRazorpayGateway(opts: { signatureValid?: boolean } = {}) {
  const originalCreateOrder = razorpayGateway.createOrder;
  const originalVerifySignature = razorpayGateway.verifyPaymentSignature;
  const originalVerifyWebhook = razorpayGateway.verifyWebhookSignature;

  const createOrderCalls: { amount: number; currency: string; receipt: string }[] = [];

  razorpayGateway.createOrder = async (params) => {
    createOrderCalls.push({ amount: params.amount, currency: params.currency, receipt: params.receipt });
    return mockRazorpayOrder({ amount: params.amount, currency: params.currency });
  };
  razorpayGateway.verifyPaymentSignature = () => opts.signatureValid ?? true;
  razorpayGateway.verifyWebhookSignature = () => true;

  return {
    createOrderCalls,
    restore: () => {
      razorpayGateway.createOrder = originalCreateOrder;
      razorpayGateway.verifyPaymentSignature = originalVerifySignature;
      razorpayGateway.verifyWebhookSignature = originalVerifyWebhook;
    },
  };
}

// =====================================================================
// Auth / RBAC (Rule 4, Phase 2, Phase 28 #1-3)
// =====================================================================

test("(CO1) POST /checkout/create-order requires authentication", async (t) => {
  const app = await buildTestApp();
  t.after(() => app.close());

  const res = await app.inject({
    method: "POST",
    url: "/api/v1/checkout/create-order",
    payload: { sessionId: uniqueSessionId(), customerId: randomUUID() },
  });
  assert.equal(res.statusCode, 401);
});

test("(CO2) checkout is denied for a user with no permissions at all", async (t) => {
  const app = await buildTestApp();
  t.after(() => app.close());
  const user = await registerUser(app);
  await downgradeToNoPermissions(user);

  const res = await app.inject({
    method: "POST",
    url: "/api/v1/checkout/create-order",
    headers: auth(user.token),
    payload: { sessionId: uniqueSessionId(), customerId: randomUUID() },
  });
  assert.equal(res.statusCode, 403);
});

test("(CO3) ai.read alone cannot execute checkout — only ai.execute can (Rule 4)", async (t) => {
  const app = await buildTestApp();
  t.after(() => app.close());
  const user = await registerUser(app);
  const product = await insertProduct(user.organizationId);
  const customer = await insertCustomer(user.organizationId);
  const sessionId = uniqueSessionId();
  await addToCart(app, user.token, sessionId, product.id);

  await downgradeToAiReadOnly(user);

  const res = await app.inject({
    method: "POST",
    url: "/api/v1/checkout/create-order",
    headers: auth(user.token),
    payload: { sessionId, customerId: customer.id },
  });
  assert.equal(res.statusCode, 403, res.body);
});

// =====================================================================
// Validation / tenant isolation
// =====================================================================

test("(CO4) a cross-tenant customerId is rejected with 404, not a checkout", async (t) => {
  const app = await buildTestApp();
  t.after(() => app.close());
  const orgA = await registerUser(app);
  const orgB = await registerUser(app);
  const product = await insertProduct(orgA.organizationId);
  const customerB = await insertCustomer(orgB.organizationId);
  const sessionId = uniqueSessionId();
  await addToCart(app, orgA.token, sessionId, product.id);

  const res = await app.inject({
    method: "POST",
    url: "/api/v1/checkout/create-order",
    headers: auth(orgA.token),
    payload: { sessionId, customerId: customerB.id },
  });
  assert.equal(res.statusCode, 404);
});

test("(CO5) checkout with an empty cart is rejected with 400", async (t) => {
  const app = await buildTestApp();
  t.after(() => app.close());
  const user = await registerUser(app);
  const customer = await insertCustomer(user.organizationId);

  const res = await app.inject({
    method: "POST",
    url: "/api/v1/checkout/create-order",
    headers: auth(user.token),
    payload: { sessionId: uniqueSessionId(), customerId: customer.id },
  });
  assert.equal(res.statusCode, 400);
});

test("(CO6) requested quantity exceeding inventory is rejected (policy engine) and no Razorpay order is created", async (t) => {
  const app = await buildTestApp();
  t.after(() => app.close());
  const user = await registerUser(app);
  const product = await insertProduct(user.organizationId, { inventoryQuantity: 2 });
  const customer = await insertCustomer(user.organizationId);
  const sessionId = uniqueSessionId();
  await addToCart(app, user.token, sessionId, product.id, 5);

  const mock = mockRazorpayGateway();
  t.after(mock.restore);

  const res = await app.inject({
    method: "POST",
    url: "/api/v1/checkout/create-order",
    headers: auth(user.token),
    payload: { sessionId, customerId: customer.id },
  });
  assert.equal(res.statusCode, 422, res.body);
  assert.equal(mock.createOrderCalls.length, 0, "policy-rejected checkout must never reach Razorpay");
});

// =====================================================================
// Happy path — server-calculated amount, correct Razorpay order
// =====================================================================

test("(CO7) checkout creates a Razorpay order with the server-calculated amount, never a client-supplied one", async (t) => {
  const app = await buildTestApp();
  t.after(() => app.close());
  const user = await registerUser(app);
  const product = await insertProduct(user.organizationId, { price: 100000, inventoryQuantity: 10 });
  const customer = await insertCustomer(user.organizationId);
  const sessionId = uniqueSessionId();
  await addToCart(app, user.token, sessionId, product.id, 2);

  const mock = mockRazorpayGateway();
  t.after(mock.restore);

  const res = await app.inject({
    method: "POST",
    url: "/api/v1/checkout/create-order",
    headers: auth(user.token),
    // Note: the request body schema has no "amount" field at all — this
    // is the enforcement mechanism, not just a convention.
    payload: { sessionId, customerId: customer.id },
  });
  assert.equal(res.statusCode, 200, res.body);
  const body = res.json();
  const expectedSubtotal = 200000;
  const expectedTax = Math.round(expectedSubtotal * 0.18);
  const expectedTotal = expectedSubtotal + expectedTax + 0; // + PLACEHOLDER_SHIPPING_AMOUNT
  assert.equal(mock.createOrderCalls.length, 1);
  assert.equal(mock.createOrderCalls[0].amount, expectedTotal, "Razorpay must receive the server-calculated amount");
  assert.equal(body.data.amount, expectedTotal);
  assert.equal(body.data.currency, "INR");
  assert.equal(body.data.status, "pending");
  assert.ok(body.data.razorpayOrderId.startsWith("order_MOCK"));
  assert.equal(body.data.keyId, env.RAZORPAY_KEY_ID);
});

// =====================================================================
// Idempotency (Phase 26)
// =====================================================================

test("(CO8) a duplicated checkout request with the same idempotencyKey does NOT create a second Razorpay order", async (t) => {
  const app = await buildTestApp();
  t.after(() => app.close());
  const user = await registerUser(app);
  const product = await insertProduct(user.organizationId, { inventoryQuantity: 10 });
  const customer = await insertCustomer(user.organizationId);
  const sessionId = uniqueSessionId();
  await addToCart(app, user.token, sessionId, product.id, 1);

  const mock = mockRazorpayGateway();
  t.after(mock.restore);

  const idempotencyKey = `idem-${randomUUID()}`;
  const payload = { sessionId, customerId: customer.id, idempotencyKey };

  const first = await app.inject({ method: "POST", url: "/api/v1/checkout/create-order", headers: auth(user.token), payload });
  assert.equal(first.statusCode, 200, first.body);

  // Re-add to cart (in reality the frontend would just retry the exact
  // same request; the cart was cleared after the first success, so we
  // re-add to simulate "the exact same logical request retried").
  await addToCart(app, user.token, sessionId, product.id, 1);
  const second = await app.inject({ method: "POST", url: "/api/v1/checkout/create-order", headers: auth(user.token), payload });
  assert.equal(second.statusCode, 200, second.body);

  assert.equal(mock.createOrderCalls.length, 1, "second request must replay, not create a new Razorpay order");
  assert.equal(first.json().data.orderId, second.json().data.orderId);
  assert.equal(first.json().data.razorpayOrderId, second.json().data.razorpayOrderId);
  assert.equal(second.json().data.idempotent, true);
});

// =====================================================================
// Payment verification (Phase 8, 12, 13)
// =====================================================================

test("(CO9) a valid payment signature marks the order paid and it appears in payment history", async (t) => {
  const app = await buildTestApp();
  t.after(() => app.close());
  const user = await registerUser(app);
  const product = await insertProduct(user.organizationId, { price: 50000, inventoryQuantity: 10 });
  const customer = await insertCustomer(user.organizationId);
  const sessionId = uniqueSessionId();
  await addToCart(app, user.token, sessionId, product.id, 1);

  const mock = mockRazorpayGateway({ signatureValid: true });
  t.after(mock.restore);

  const create = await app.inject({
    method: "POST",
    url: "/api/v1/checkout/create-order",
    headers: auth(user.token),
    payload: { sessionId, customerId: customer.id },
  });
  assert.equal(create.statusCode, 200, create.body);
  const { orderId, razorpayOrderId } = create.json().data;

  const verify = await app.inject({
    method: "POST",
    url: "/api/v1/checkout/verify-payment",
    headers: auth(user.token),
    payload: { razorpayOrderId, razorpayPaymentId: `pay_MOCK${randomUUID().slice(0, 8)}`, razorpaySignature: "irrelevant-mocked" },
  });
  assert.equal(verify.statusCode, 200, verify.body);
  assert.equal(verify.json().data.status, "paid");
  assert.equal(verify.json().data.orderId, orderId);

  const history = await app.inject({ method: "GET", url: "/api/v1/payments/history", headers: auth(user.token) });
  assert.equal(history.statusCode, 200);
  assert.ok(history.json().data.some((p: { orderId: string; status: string }) => p.orderId === orderId && p.status === "captured"));
});

test("(CO10) an invalid payment signature is rejected, the order stays safe, and the buyer can retry to a NEW Razorpay order", async (t) => {
  const app = await buildTestApp();
  t.after(() => app.close());
  const user = await registerUser(app);
  const product = await insertProduct(user.organizationId, { inventoryQuantity: 10 });
  const customer = await insertCustomer(user.organizationId);
  const sessionId = uniqueSessionId();
  await addToCart(app, user.token, sessionId, product.id, 1);

  const mock = mockRazorpayGateway({ signatureValid: false });
  t.after(mock.restore);

  const idempotencyKey = `idem-retry-${randomUUID()}`;
  const create = await app.inject({
    method: "POST",
    url: "/api/v1/checkout/create-order",
    headers: auth(user.token),
    payload: { sessionId, customerId: customer.id, idempotencyKey },
  });
  assert.equal(create.statusCode, 200, create.body);
  const { orderId, razorpayOrderId: firstRazorpayOrderId } = create.json().data;

  const verify = await app.inject({
    method: "POST",
    url: "/api/v1/checkout/verify-payment",
    headers: auth(user.token),
    payload: { razorpayOrderId: firstRazorpayOrderId, razorpayPaymentId: `pay_MOCK${randomUUID().slice(0, 8)}`, razorpaySignature: "bad-signature" },
  });
  assert.equal(verify.statusCode, 400, verify.body);
  assert.equal(verify.json().error.code, "PAYMENT_SIGNATURE_INVALID");
  assert.equal(verify.json().error.details.retryable, true);

  // Retry: same idempotencyKey, but the order is now "failed" -> this
  // must produce a brand-new attempt + a brand-new Razorpay order rather
  // than reusing the doomed one (Phase 13).
  razorpayGateway.verifyPaymentSignature = () => true; // simulate the retry succeeding this time
  await addToCart(app, user.token, sessionId, product.id, 1);
  const retry = await app.inject({
    method: "POST",
    url: "/api/v1/checkout/create-order",
    headers: auth(user.token),
    payload: { sessionId, customerId: customer.id, idempotencyKey },
  });
  assert.equal(retry.statusCode, 200, retry.body);
  assert.equal(retry.json().data.orderId, orderId, "retry must reuse the SAME order, not create a second one");
  assert.notEqual(retry.json().data.razorpayOrderId, firstRazorpayOrderId, "retry must create a NEW Razorpay order");
  assert.equal(mock.createOrderCalls.length, 2);

  const verify2 = await app.inject({
    method: "POST",
    url: "/api/v1/checkout/verify-payment",
    headers: auth(user.token),
    payload: {
      razorpayOrderId: retry.json().data.razorpayOrderId,
      razorpayPaymentId: `pay_MOCK${randomUUID().slice(0, 8)}`,
      razorpaySignature: "now-valid",
    },
  });
  assert.equal(verify2.statusCode, 200, verify2.body);
  assert.equal(verify2.json().data.status, "paid");
});

// =====================================================================
// Payment history / lookup organization isolation
// =====================================================================

test("(CO11) payment history is organization-scoped — org A never sees org B's payments", async (t) => {
  const app = await buildTestApp();
  t.after(() => app.close());
  const orgA = await registerUser(app);
  const orgB = await registerUser(app);
  const productB = await insertProduct(orgB.organizationId, { inventoryQuantity: 10 });
  const customerB = await insertCustomer(orgB.organizationId);
  const sessionId = uniqueSessionId();
  await addToCart(app, orgB.token, sessionId, productB.id, 1);

  const mock = mockRazorpayGateway({ signatureValid: true });
  t.after(mock.restore);

  const create = await app.inject({
    method: "POST",
    url: "/api/v1/checkout/create-order",
    headers: auth(orgB.token),
    payload: { sessionId, customerId: customerB.id },
  });
  const { razorpayOrderId } = create.json().data;
  await app.inject({
    method: "POST",
    url: "/api/v1/checkout/verify-payment",
    headers: auth(orgB.token),
    payload: { razorpayOrderId, razorpayPaymentId: `pay_${randomUUID().slice(0, 8)}`, razorpaySignature: "x" },
  });

  const historyA = await app.inject({ method: "GET", url: "/api/v1/payments/history", headers: auth(orgA.token) });
  assert.equal(historyA.statusCode, 200);
  assert.equal(historyA.json().data.length, 0, "org A must not see org B's payment history");
});

// =====================================================================
// Audit trail (Phase 15, 21, 22)
// =====================================================================

test("(CO12) checkout produces an organization-scoped, explainable audit trail", async (t) => {
  const app = await buildTestApp();
  t.after(() => app.close());
  const orgA = await registerUser(app);
  const orgB = await registerUser(app);
  const product = await insertProduct(orgA.organizationId, { inventoryQuantity: 10 });
  const customer = await insertCustomer(orgA.organizationId);
  const sessionId = uniqueSessionId();
  await addToCart(app, orgA.token, sessionId, product.id, 1);

  const mock = mockRazorpayGateway({ signatureValid: true });
  t.after(mock.restore);

  const create = await app.inject({
    method: "POST",
    url: "/api/v1/checkout/create-order",
    headers: auth(orgA.token),
    payload: { sessionId, customerId: customer.id },
  });
  const { orderId, razorpayOrderId } = create.json().data;
  await app.inject({
    method: "POST",
    url: "/api/v1/checkout/verify-payment",
    headers: auth(orgA.token),
    payload: { razorpayOrderId, razorpayPaymentId: `pay_${randomUUID().slice(0, 8)}`, razorpaySignature: "x" },
  });

  // Audit writes are fire-and-forget (never awaited by the request path)
  // — give the event loop (and a remote Neon round trip) a moment to
  // flush them before reading back.
  await new Promise((resolve) => setTimeout(resolve, 500));

  const auditA = await app.inject({
    method: "GET",
    url: `/api/v1/audit?resourceType=order&resourceId=${orderId}&limit=50`,
    headers: auth(orgA.token),
  });
  assert.equal(auditA.statusCode, 200, auditA.body);
  const actions = auditA.json().data.map((e: { action: string }) => e.action);
  assert.ok(actions.includes("ORDER_STATUS_CHANGED"), `expected ORDER_STATUS_CHANGED in ${JSON.stringify(actions)}`);

  const auditAll = await app.inject({ method: "GET", url: "/api/v1/audit?limit=100", headers: auth(orgA.token) });
  const allActions = auditAll.json().data.map((e: { action: string }) => e.action);
  for (const expected of ["CHECKOUT_REQUESTED", "POLICY_APPROVED", "RAZORPAY_ORDER_CREATED", "PAYMENT_INITIATED", "PAYMENT_VERIFIED"]) {
    assert.ok(allActions.includes(expected), `expected ${expected} in audit trail: ${JSON.stringify(allActions)}`);
  }

  const auditB = await app.inject({ method: "GET", url: "/api/v1/audit?limit=100", headers: auth(orgB.token) });
  assert.equal(auditB.json().data.length, 0, "org B must not see org A's audit events");
});

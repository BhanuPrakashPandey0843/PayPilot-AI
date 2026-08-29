/**
 * Integration tests for the AI Commerce Agent module (Milestone 4):
 *   POST   /api/v1/commerce/chat
 *   GET    /api/v1/commerce/session
 *   DELETE /api/v1/commerce/session
 *   POST   /api/v1/commerce/order-preview
 *   GET    /api/v1/commerce/compare
 *
 * Requires:
 *   - DATABASE_URL set in .env pointing to a real Neon/Postgres DB
 *   - `npm run db:migrate` applied
 *   - `npm run db:seed` run (roles + permissions, incl. ai.read)
 *
 * Run from backend/:
 *   npm test
 *
 * Every test creates its own org/user/products with random UUID suffixes
 * so the suite is safe to re-run repeatedly without manual cleanup.
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
import { AppError } from "../src/utils/errors.js";
import { fail } from "../src/utils/response.js";
import { db } from "../src/db/index.js";
import { products } from "../src/db/schema/products.js";

async function buildTestApp() {
  const app = Fastify({ logger: false });

  await app.register(jwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: env.JWT_EXPIRES_IN },
  });
  registerAuthenticate(app);

  app.setErrorHandler((err, _request, reply) => {
    if (err instanceof AppError) {
      reply.code(err.statusCode).send(fail(err.code, err.message, err.details));
      return;
    }
    const anyErr = err as { statusCode?: number; validation?: unknown } | undefined;
    if (anyErr?.validation) {
      const code = anyErr?.statusCode === 400 ? "BAD_REQUEST" : "UNPROCESSABLE_ENTITY";
      const statusCode =
        anyErr?.statusCode && anyErr.statusCode >= 400 ? anyErr.statusCode : 422;
      reply.code(statusCode).send(fail(code, "Validation failed", anyErr.validation));
      return;
    }
    reply.code(500).send(fail("INTERNAL_ERROR", "Something went wrong"));
  });

  await app.register(authRoutes, { prefix: "/api/v1/auth" });
  await app.register(commerceAgentRoutes, { prefix: "/api/v1/commerce" });

  await app.ready();
  return app;
}

const PASSWORD_GOOD = "password123";

function uniqueEmail(prefix = "commerce-test") {
  return `${prefix}-${randomUUID()}@example.com`;
}
function uniqueOrgName() {
  return `Commerce Test Org ${randomUUID().slice(0, 8)}`;
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
      firstName: "Commerce",
      lastName: "Tester",
      organizationName: opts.orgName ?? uniqueOrgName(),
    },
  });
  const body = res.json();
  return { token: body.data.token, organizationId: body.data.organization.id };
}

async function insertProduct(
  organizationId: string,
  overrides: Partial<typeof products.$inferInsert> = {}
) {
  const suffix = randomUUID().slice(0, 8);
  const [row] = await db
    .insert(products)
    .values({
      organizationId,
      name: overrides.name ?? `Test Product ${suffix}`,
      slug: overrides.slug ?? `test-product-${suffix}`,
      description: overrides.description ?? "A product used in integration tests.",
      category: overrides.category ?? "Running Shoes",
      tags: overrides.tags ?? ["running", "sports"],
      price: overrides.price ?? 479900,
      currency: overrides.currency ?? "INR",
      inventoryQuantity: overrides.inventoryQuantity ?? 10,
      imageUrl: overrides.imageUrl,
      isActive: overrides.isActive ?? true,
    })
    .returning();
  return row;
}

// =====================================================================
// Auth / permission gating
// =====================================================================

test("(C1) POST /commerce/chat requires authentication", async (t) => {
  const app = await buildTestApp();
  t.after(() => app.close());

  const res = await app.inject({
    method: "POST",
    url: "/api/v1/commerce/chat",
    payload: { sessionId: uniqueSessionId(), message: "I need shoes" },
  });
  assert.equal(res.statusCode, 401);
});

// =====================================================================
// PRODUCT_SEARCH
// =====================================================================

test("(C2) PRODUCT_SEARCH returns ranked, explainable matches", async (t) => {
  const app = await buildTestApp();
  t.after(() => app.close());
  const { token, organizationId } = await registerUser(app);

  await insertProduct(organizationId, {
    name: "Velocity Run X",
    category: "Running Shoes",
    tags: ["running"],
    price: 479900,
  });

  const res = await app.inject({
    method: "POST",
    url: "/api/v1/commerce/chat",
    headers: auth(token),
    payload: { sessionId: uniqueSessionId(), message: "I need running shoes under 5000" },
  });
  assert.equal(res.statusCode, 200, res.body);
  const body = res.json();
  assert.equal(body.data.intent, "PRODUCT_SEARCH");
  assert.ok(body.data.products.length >= 1);
  const match = body.data.products[0];
  assert.ok(typeof match.matchScore === "number");
  assert.ok(Array.isArray(match.matchReasons) && match.matchReasons.length > 0);
});

test("(C3) commerce chat is organization-scoped — org A never sees org B's products", async (t) => {
  const app = await buildTestApp();
  t.after(() => app.close());
  const orgA = await registerUser(app);
  const orgB = await registerUser(app);

  await insertProduct(orgB.organizationId, { name: "Org B Secret Shoe", category: "Running Shoes" });

  const res = await app.inject({
    method: "POST",
    url: "/api/v1/commerce/chat",
    headers: auth(orgA.token),
    payload: { sessionId: uniqueSessionId(), message: "I need running shoes" },
  });
  assert.equal(res.statusCode, 200);
  const names = res.json().data.products.map((p: { name: string }) => p.name);
  assert.ok(!names.includes("Org B Secret Shoe"));
});

// =====================================================================
// ADD_TO_CART / session memory
// =====================================================================

test("(C4) ADD_TO_CART (explicit productId) updates the session cart", async (t) => {
  const app = await buildTestApp();
  t.after(() => app.close());
  const { token, organizationId } = await registerUser(app);
  const product = await insertProduct(organizationId, { inventoryQuantity: 10 });
  const sessionId = uniqueSessionId();

  const res = await app.inject({
    method: "POST",
    url: "/api/v1/commerce/chat",
    headers: auth(token),
    payload: { sessionId, message: "add it to my cart", productId: product.id, quantity: 2 },
  });
  assert.equal(res.statusCode, 200, res.body);
  assert.equal(res.json().data.intent, "ADD_TO_CART");

  const sessionRes = await app.inject({
    method: "GET",
    url: `/api/v1/commerce/session?sessionId=${sessionId}`,
    headers: auth(token),
  });
  assert.equal(sessionRes.statusCode, 200);
  const cart = sessionRes.json().data.cart;
  assert.equal(cart.length, 1);
  assert.equal(cart[0].productId, product.id);
  assert.equal(cart[0].quantity, 2);
});

test("(C5) DELETE /commerce/session clears the cart", async (t) => {
  const app = await buildTestApp();
  t.after(() => app.close());
  const { token, organizationId } = await registerUser(app);
  const product = await insertProduct(organizationId);
  const sessionId = uniqueSessionId();

  await app.inject({
    method: "POST",
    url: "/api/v1/commerce/chat",
    headers: auth(token),
    payload: { sessionId, message: "add it", productId: product.id },
  });
  const del = await app.inject({
    method: "DELETE",
    url: `/api/v1/commerce/session?sessionId=${sessionId}`,
    headers: auth(token),
  });
  assert.equal(del.statusCode, 200);

  const sessionRes = await app.inject({
    method: "GET",
    url: `/api/v1/commerce/session?sessionId=${sessionId}`,
    headers: auth(token),
  });
  assert.equal(sessionRes.json().data.cart.length, 0);
});

test("(C6) sessions are organization-scoped — same sessionId string in two orgs is independent state", async (t) => {
  const app = await buildTestApp();
  t.after(() => app.close());
  const orgA = await registerUser(app);
  const orgB = await registerUser(app);
  const productA = await insertProduct(orgA.organizationId);
  const sharedSessionId = uniqueSessionId();

  await app.inject({
    method: "POST",
    url: "/api/v1/commerce/chat",
    headers: auth(orgA.token),
    payload: { sessionId: sharedSessionId, message: "add it", productId: productA.id },
  });

  const orgBSession = await app.inject({
    method: "GET",
    url: `/api/v1/commerce/session?sessionId=${sharedSessionId}`,
    headers: auth(orgB.token),
  });
  assert.equal(orgBSession.statusCode, 200);
  assert.equal(orgBSession.json().data.cart.length, 0, "org B must not see org A's cart");
});

// =====================================================================
// Policy engine / order preview
// =====================================================================

test("(C7) order preview FAILs with an explanation when the cart is empty", async (t) => {
  const app = await buildTestApp();
  t.after(() => app.close());
  const { token } = await registerUser(app);
  const sessionId = uniqueSessionId();

  const res = await app.inject({
    method: "POST",
    url: "/api/v1/commerce/order-preview",
    headers: auth(token),
    payload: { sessionId },
  });
  assert.equal(res.statusCode, 200, res.body);
  const body = res.json();
  assert.equal(body.data.policy.status, "FAIL");
  assert.equal(body.data.orderPreview, null);
});

test("(C8) order preview FAILs when requested quantity exceeds inventory", async (t) => {
  const app = await buildTestApp();
  t.after(() => app.close());
  const { token, organizationId } = await registerUser(app);
  const product = await insertProduct(organizationId, { inventoryQuantity: 2 });

  const res = await app.inject({
    method: "POST",
    url: "/api/v1/commerce/order-preview",
    headers: auth(token),
    payload: { sessionId: uniqueSessionId(), items: [{ productId: product.id, quantity: 5 }] },
  });
  assert.equal(res.statusCode, 200, res.body);
  const body = res.json();
  assert.equal(body.data.policy.status, "FAIL");
  assert.ok(
    body.data.policy.checks.some((c: { status: string }) => c.status === "FAIL"),
    "at least one check must explain the failure"
  );
});

test("(C9) order preview computes subtotal/tax/total correctly for a valid cart", async (t) => {
  const app = await buildTestApp();
  t.after(() => app.close());
  const { token, organizationId } = await registerUser(app);
  const product = await insertProduct(organizationId, { price: 100000, inventoryQuantity: 10 });

  const res = await app.inject({
    method: "POST",
    url: "/api/v1/commerce/order-preview",
    headers: auth(token),
    payload: { sessionId: uniqueSessionId(), items: [{ productId: product.id, quantity: 2 }] },
  });
  assert.equal(res.statusCode, 200, res.body);
  const preview = res.json().data.orderPreview;
  assert.equal(preview.subtotal, 200000);
  assert.equal(preview.tax, Math.round(200000 * 0.18));
  assert.equal(preview.total, preview.subtotal + preview.tax + preview.shipping);
});

// =====================================================================
// Compare
// =====================================================================

test("(C10) GET /commerce/compare returns a side-by-side comparison for 2+ products", async (t) => {
  const app = await buildTestApp();
  t.after(() => app.close());
  const { token, organizationId } = await registerUser(app);
  const p1 = await insertProduct(organizationId, { name: "Velocity Run X", price: 479900 });
  const p2 = await insertProduct(organizationId, { name: "Velocity Run Pro", price: 649900 });

  const res = await app.inject({
    method: "GET",
    url: `/api/v1/commerce/compare?productIds=${p1.id},${p2.id}`,
    headers: auth(token),
  });
  assert.equal(res.statusCode, 200, res.body);
  const ids = res.json().data.comparison.map((p: { id: string }) => p.id);
  assert.deepEqual(new Set(ids), new Set([p1.id, p2.id]));
});

test("(C11) GET /commerce/compare with fewer than 2 productIds is rejected with 422", async (t) => {
  const app = await buildTestApp();
  t.after(() => app.close());
  const { token, organizationId } = await registerUser(app);
  const p1 = await insertProduct(organizationId);

  const res = await app.inject({
    method: "GET",
    url: `/api/v1/commerce/compare?productIds=${p1.id}`,
    headers: auth(token),
  });
  assert.equal(res.statusCode, 422);
});

test("(C12) compare across tenants: a cross-org productId 404s rather than leaking data", async (t) => {
  const app = await buildTestApp();
  t.after(() => app.close());
  const orgA = await registerUser(app);
  const orgB = await registerUser(app);
  const pA = await insertProduct(orgA.organizationId);
  const pB = await insertProduct(orgB.organizationId);

  const res = await app.inject({
    method: "GET",
    url: `/api/v1/commerce/compare?productIds=${pA.id},${pB.id}`,
    headers: auth(orgA.token),
  });
  assert.equal(res.statusCode, 404);
});

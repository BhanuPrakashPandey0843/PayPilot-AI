/**
 * Integration tests for the agent-facing catalog API (Milestone 3):
 *   GET  /api/v1/agent/catalog
 *   POST /api/v1/agent/catalog/search
 *   GET  /api/v1/agent/catalog/:productId/recommendations
 *
 * Also covers the merchant-facing catalog filters that back the agent
 * layer (tags, price range, availability, sorting, pagination) since
 * those didn't have dedicated test coverage yet.
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
import { productsRoutes } from "../src/modules/products/products.routes.js";
import { agentCatalogRoutes } from "../src/modules/agent/agent.routes.js";
import { AppError } from "../src/utils/errors.js";
import { fail } from "../src/utils/response.js";
import { db } from "../src/db/index.js";
import { products } from "../src/db/schema/products.js";

// ---------------------------------------------------------------------
// Test app builder — mirrors src/index.ts wiring exactly, but without
// swagger/helmet/cors (irrelevant to inject()-based tests).
// ---------------------------------------------------------------------
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
  await app.register(productsRoutes, { prefix: "/api/v1/products" });
  await app.register(agentCatalogRoutes, { prefix: "/api/v1/agent/catalog" });

  await app.ready();
  return app;
}

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

const PASSWORD_GOOD = "password123";

function uniqueEmail(prefix = "agent-test") {
  return `${prefix}-${randomUUID()}@example.com`;
}
function uniqueOrgName() {
  return `Agent Test Org ${randomUUID().slice(0, 8)}`;
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
      firstName: "Agent",
      lastName: "Tester",
      organizationName: opts.orgName ?? uniqueOrgName(),
    },
  });
  const body = res.json();
  return { token: body.data.token, organizationId: body.data.organization.id };
}

/** Directly inserts a product for a given org — bypasses the API so tests
 *  can set up fixtures without depending on the create-product endpoint. */
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
      category: overrides.category ?? "running",
      tags: overrides.tags ?? ["running", "sports"],
      price: overrides.price ?? 100000,
      currency: overrides.currency ?? "INR",
      inventoryQuantity: overrides.inventoryQuantity ?? 10,
      imageUrl: overrides.imageUrl,
      isActive: overrides.isActive ?? true,
    })
    .returning();
  return row;
}

// =====================================================================
// Merchant catalog filters (tags / price / availability / sort / paging)
// =====================================================================

test("(P1) tags filter returns only products containing ALL given tags", async (t) => {
  const app = await buildTestApp();
  t.after(() => app.close());
  const { token, organizationId } = await registerUser(app);

  await insertProduct(organizationId, { tags: ["running", "sports"] });
  await insertProduct(organizationId, { tags: ["sports"] });
  await insertProduct(organizationId, { tags: ["running", "sports", "fitness"] });

  const res = await app.inject({
    method: "GET",
    url: "/api/v1/products?tags=running,sports",
    headers: auth(token),
  });
  assert.equal(res.statusCode, 200);
  const body = res.json();
  assert.equal(body.data.length, 2, "only products with BOTH running and sports tags");
  for (const p of body.data) {
    assert.ok(p.tags.includes("running") && p.tags.includes("sports"));
  }
});

test("(P2) minPrice/maxPrice filter to an inclusive price range", async (t) => {
  const app = await buildTestApp();
  t.after(() => app.close());
  const { token, organizationId } = await registerUser(app);

  await insertProduct(organizationId, { price: 1000 });
  await insertProduct(organizationId, { price: 3000 });
  await insertProduct(organizationId, { price: 6000 });

  const res = await app.inject({
    method: "GET",
    url: "/api/v1/products?minPrice=2000&maxPrice=5000",
    headers: auth(token),
  });
  assert.equal(res.statusCode, 200);
  const body = res.json();
  assert.equal(body.data.length, 1);
  assert.equal(body.data[0].price, 3000);
});

test("(P3) available=true only returns products with inventoryQuantity > 0", async (t) => {
  const app = await buildTestApp();
  t.after(() => app.close());
  const { token, organizationId } = await registerUser(app);

  await insertProduct(organizationId, { inventoryQuantity: 0 });
  await insertProduct(organizationId, { inventoryQuantity: 5 });

  const res = await app.inject({
    method: "GET",
    url: "/api/v1/products?available=true",
    headers: auth(token),
  });
  assert.equal(res.statusCode, 200);
  const body = res.json();
  assert.ok(body.data.length >= 1);
  for (const p of body.data) assert.ok(p.inventoryQuantity > 0);
});

test("(P4) sort=price&order=asc orders ascending by price", async (t) => {
  const app = await buildTestApp();
  t.after(() => app.close());
  const { token, organizationId } = await registerUser(app);

  await insertProduct(organizationId, { price: 5000 });
  await insertProduct(organizationId, { price: 1000 });
  await insertProduct(organizationId, { price: 3000 });

  const res = await app.inject({
    method: "GET",
    url: "/api/v1/products?sort=price&order=asc&limit=100",
    headers: auth(token),
  });
  assert.equal(res.statusCode, 200);
  const prices = res.json().data.map((p: { price: number }) => p.price);
  const sorted = [...prices].sort((a, b) => a - b);
  assert.deepEqual(prices, sorted);
});

test("(P5) pagination meta reflects page/limit/total/totalPages", async (t) => {
  const app = await buildTestApp();
  t.after(() => app.close());
  const { token, organizationId } = await registerUser(app);

  for (let i = 0; i < 5; i++) await insertProduct(organizationId);

  const res = await app.inject({
    method: "GET",
    url: "/api/v1/products?page=1&limit=2",
    headers: auth(token),
  });
  assert.equal(res.statusCode, 200);
  const body = res.json();
  assert.equal(body.data.length, 2);
  assert.equal(body.meta.page, 1);
  assert.equal(body.meta.limit, 2);
  assert.ok(body.meta.total >= 5);
  assert.ok(body.meta.totalPages >= 3);
});

test("(P6) invalid sort value is rejected with 422", async (t) => {
  const app = await buildTestApp();
  t.after(() => app.close());
  const { token } = await registerUser(app);

  const res = await app.inject({
    method: "GET",
    url: "/api/v1/products?sort=totally_not_a_field",
    headers: auth(token),
  });
  assert.equal(res.statusCode, 422);
  assert.equal(res.json().success, false);
});

// =====================================================================
// Agent catalog
// =====================================================================

test("(A1) GET /agent/catalog requires authentication", async (t) => {
  const app = await buildTestApp();
  t.after(() => app.close());

  const res = await app.inject({ method: "GET", url: "/api/v1/agent/catalog" });
  assert.equal(res.statusCode, 401);
});

test("(A2) GET /agent/catalog returns the agent-shaped product structure", async (t) => {
  const app = await buildTestApp();
  t.after(() => app.close());
  const { token, organizationId } = await registerUser(app);

  await insertProduct(organizationId, {
    name: "Velocity Running Shoes",
    category: "running",
    tags: ["running", "sports", "fitness"],
    price: 499900,
    inventoryQuantity: 12,
  });

  const res = await app.inject({
    method: "GET",
    url: "/api/v1/agent/catalog",
    headers: auth(token),
  });
  assert.equal(res.statusCode, 200, res.body);
  const body = res.json();
  assert.equal(body.success, true);
  assert.ok(Array.isArray(body.data));
  const p = body.data.find((x: { name: string }) => x.name === "Velocity Running Shoes");
  assert.ok(p, "seeded product should be present");
  assert.deepEqual(p.price, { amount: 499900, currency: "INR", unit: "minor" });
  assert.deepEqual(p.availability, { available: true, inventoryQuantity: 12 });
  assert.ok(!("organizationId" in p), "agent catalog must never expose organizationId");
  assert.ok(!("metadata" in p), "agent catalog must never expose raw metadata");
});

test("(A3) GET /agent/catalog defaults to active products only", async (t) => {
  const app = await buildTestApp();
  t.after(() => app.close());
  const { token, organizationId } = await registerUser(app);

  const inactive = await insertProduct(organizationId, { isActive: false, name: "Delisted Item" });
  await insertProduct(organizationId, { isActive: true, name: "Active Item" });

  const res = await app.inject({
    method: "GET",
    url: "/api/v1/agent/catalog",
    headers: auth(token),
  });
  assert.equal(res.statusCode, 200);
  const ids = res.json().data.map((p: { id: string }) => p.id);
  assert.ok(!ids.includes(inactive.id), "inactive product must not appear by default");
});

test("(A4) agent catalog is organization-scoped — org A never sees org B's products", async (t) => {
  const app = await buildTestApp();
  t.after(() => app.close());
  const orgA = await registerUser(app);
  const orgB = await registerUser(app);

  await insertProduct(orgB.organizationId, { name: "Org B Secret Product" });

  const res = await app.inject({
    method: "GET",
    url: "/api/v1/agent/catalog",
    headers: auth(orgA.token),
  });
  assert.equal(res.statusCode, 200);
  const names = res.json().data.map((p: { name: string }) => p.name);
  assert.ok(!names.includes("Org B Secret Product"));
});

test("(A5) POST /agent/catalog/search filters by structured intent", async (t) => {
  const app = await buildTestApp();
  t.after(() => app.close());
  const { token, organizationId } = await registerUser(app);

  await insertProduct(organizationId, {
    name: "Cheap Running Shoes",
    category: "running",
    price: 300000,
    inventoryQuantity: 4,
  });
  await insertProduct(organizationId, {
    name: "Expensive Running Shoes",
    category: "running",
    price: 900000,
    inventoryQuantity: 4,
  });
  await insertProduct(organizationId, {
    name: "Cheap Hat",
    category: "accessories",
    price: 200000,
    inventoryQuantity: 4,
  });

  const res = await app.inject({
    method: "POST",
    url: "/api/v1/agent/catalog/search",
    headers: auth(token),
    payload: {
      query: "running shoes",
      filters: { category: "running", maxPrice: 500000 },
    },
  });
  assert.equal(res.statusCode, 200, res.body);
  const names = res.json().data.map((p: { name: string }) => p.name);
  assert.deepEqual(names, ["Cheap Running Shoes"]);
});

test("(A6) agent search body validation rejects unknown filter keys (422)", async (t) => {
  const app = await buildTestApp();
  t.after(() => app.close());
  const { token } = await registerUser(app);

  const res = await app.inject({
    method: "POST",
    url: "/api/v1/agent/catalog/search",
    headers: auth(token),
    payload: { filters: { notARealFilter: true } },
  });
  assert.equal(res.statusCode, 422);
});

test("(A7) recommendations: UPSELL is same category + higher price, CROSS_SELL shares a tag in a different category", async (t) => {
  const app = await buildTestApp();
  t.after(() => app.close());
  const { token, organizationId } = await registerUser(app);

  const base = await insertProduct(organizationId, {
    name: "Velocity Run X",
    category: "running",
    tags: ["running", "sports"],
    price: 479900,
  });
  await insertProduct(organizationId, {
    name: "Velocity Run Pro",
    category: "running",
    tags: ["running"],
    price: 649900, // higher price, same category -> UPSELL
  });
  await insertProduct(organizationId, {
    name: "Performance Socks",
    category: "accessories",
    tags: ["running"], // shared tag, different category -> CROSS_SELL
    price: 39900,
  });
  await insertProduct(organizationId, {
    name: "Cheaper Running Shoe",
    category: "running",
    tags: ["running"],
    price: 199900, // same category but CHEAPER -> not an upsell
  });

  const res = await app.inject({
    method: "GET",
    url: `/api/v1/agent/catalog/${base.id}/recommendations`,
    headers: auth(token),
  });
  assert.equal(res.statusCode, 200, res.body);
  const body = res.json();
  assert.equal(body.data.product.id, base.id);

  const upsells = body.data.recommendations.filter((r: { type: string }) => r.type === "UPSELL");
  const crossSells = body.data.recommendations.filter((r: { type: string }) => r.type === "CROSS_SELL");

  assert.ok(upsells.some((r: { product: { name: string } }) => r.product.name === "Velocity Run Pro"));
  assert.ok(!upsells.some((r: { product: { name: string } }) => r.product.name === "Cheaper Running Shoe"));
  assert.ok(crossSells.some((r: { product: { name: string } }) => r.product.name === "Performance Socks"));

  for (const r of body.data.recommendations) {
    assert.ok(typeof r.score === "number");
    assert.ok(Array.isArray(r.reasons) && r.reasons.length > 0, "every recommendation must be explainable");
  }
});

test("(A8) recommendations for a cross-tenant product id return 404, not another org's data", async (t) => {
  const app = await buildTestApp();
  t.after(() => app.close());
  const orgA = await registerUser(app);
  const orgB = await registerUser(app);
  const orgBProduct = await insertProduct(orgB.organizationId);

  const res = await app.inject({
    method: "GET",
    url: `/api/v1/agent/catalog/${orgBProduct.id}/recommendations`,
    headers: auth(orgA.token),
  });
  assert.equal(res.statusCode, 404);
});

test("(A9) invalid productId (non-UUID) is rejected with 422, not a raw DB error", async (t) => {
  const app = await buildTestApp();
  t.after(() => app.close());
  const { token } = await registerUser(app);

  const res = await app.inject({
    method: "GET",
    url: "/api/v1/agent/catalog/not-a-uuid/recommendations",
    headers: auth(token),
  });
  assert.equal(res.statusCode, 422);
});

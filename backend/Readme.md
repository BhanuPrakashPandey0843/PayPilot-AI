# PayPilot AI — Backend

Fastify + TypeScript API for PayPilot AI (Razorpay Track 01 — AI Growth & Agentic Commerce).
Multi-tenant Postgres (Drizzle ORM), JWT auth with bcrypt, **database-backed RBAC** resolved
fresh on every request, organization-scoped queries at the repository layer, Zod validation,
Swagger/OpenAPI docs, an AI Commerce Agent, and an **end-to-end Razorpay test-mode checkout**
with a policy-gated, inventory-safe, idempotent payment flow and a persisted audit trail
(Milestone 5).

## Stack

- [Fastify](https://fastify.dev/) — HTTP server
- [Drizzle ORM](https://orm.drizzle.team/) + [`postgres`](https://github.com/porsager/postgres) — database access
- [ioredis](https://github.com/redis/ioredis) — Redis client (reserved for catalog caching + rate limiting; see hardening section below)
- [@fastify/jwt](https://github.com/fastify/fastify-jwt) — authentication
- bcrypt — password hashing (12 rounds, 128-char max input)
- [@fastify/swagger](https://github.com/fastify/fastify-swagger) + swagger-ui — API docs
- [Razorpay Node SDK](https://github.com/razorpay/razorpay-node) — payments (Milestone 3)
- [Zod](https://zod.dev/) — schema validation (env, request body, query, params)

## Setup

```bash
npm install
cp .env.example .env
# edit .env — DATABASE_URL, JWT_SECRET, REDIS_URL, CORS_ORIGIN at minimum

# Database — apply migrations, then seed RBAC roles + permissions (idempotent)
npm run db:migrate
npm run db:seed

# (optional) Seed the Velocity Run demo merchant catalog + customers
SEED_DEMO=1 npm run db:seed

# Start the dev server
npm run dev
```

The server starts on `http://localhost:4000` by default (configurable via `PORT` in `.env`).
Interactive API docs (Swagger UI) are at `GET /docs`. Health check at `GET /health`.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start the dev server with hot reload (`tsx watch`) |
| `npm run build` | Type-check and compile to `dist/` |
| `npm start` | Run the compiled server from `dist/` |
| `npm run typecheck` | Type-check without emitting output |
| `npm test` | Run auth + RBAC + products + customers + agent-catalog integration tests |
| `npm run db:generate` | Generate a new Drizzle migration from schema changes |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:studio` | Open Drizzle Studio (browse tables + data) |
| `npm run db:seed` | Seed roles + permissions (idempotent, safe to re-run) |
| `SEED_DEMO=1 npm run db:seed` | Also seed the Velocity Run demo merchant |
| `npx tsx scripts/validate-step1.ts` | Validate DB-level financial constraints (rolls back after — no data persists) |

## Environment

All variables are validated by Zod at boot in [src/config/env.ts](file:///d:/PayPilot%20AI/backend/src/config/env.ts).
A missing/invalid variable crashes the process **before** the server starts listening, instead of failing later.

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `NODE_ENV` | | `development` | |
| `HOST` / `PORT` | | `0.0.0.0` / `4000` | Bind address |
| `DATABASE_URL` | ✅ | — | Neon / Postgres connection string |
| `REDIS_URL` | ✅ | — | ioredis client connection (reserved for future caching + rate limits) |
| `JWT_SECRET` | ✅ (≥16 chars) | — | HS256 signing secret for `@fastify/jwt` |
| `JWT_EXPIRES_IN` | | `7d` | Token lifetime. Accepts `@fastify/jwt` format: `"15m"`, `"1h"`, `"7d"`, … |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | for checkout | — | Test-mode Razorpay credentials (Milestone 5). Without these, `/checkout/*` fails closed with `PAYMENT_PROVIDER_NOT_CONFIGURED` instead of a confusing 500 elsewhere. |
| `RAZORPAY_WEBHOOK_SECRET` | for webhooks | — | Configured on the Razorpay Dashboard under Settings > Webhooks. **Not** the same value as `RAZORPAY_KEY_SECRET`. |
| `CORS_ORIGIN` | | `http://localhost:3000` | Allowed origin (frontend) |
| `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` | | — | Milestone 6 AI copilot provider. Both optional — set at most one; falls back to a deterministic template if neither is set. |
| `ABANDONED_CHECKOUT_THRESHOLD_MINUTES` / `REVENUE_DROP_THRESHOLD_PERCENT` / `MIN_CROSS_SELL_SAMPLE_SIZE` | | `180` / `10` / `5` | Deterministic revenue-opportunity detection thresholds (Milestone 6). |
| `REVENUE_ACTION_MAX_AMOUNT_MINOR` | | `10000000` (₹1,00,000) | Milestone 6 policy engine — max `estimatedRevenueImpact` an APPROVED opportunity may have and still be auto-executable via `POST /revenue/opportunities/:id/execute`. Above this, it must be actioned manually. |

## Demo data — Velocity Run (fictional merchant)

Running `SEED_DEMO=1 npm run db:seed` creates a complete demo tenant (idempotent — re-running is safe):

| Resource | Values |
|---|---|
| Organization | **Velocity Run** (`slug: velocity-run-demo`, currency: INR) |
| Admin login | `admin@velocityrun.example` / `VelocityRun2026!` |
| Role | ORG_ADMIN (every permission) |
| Products | **Velocity Run X** — ₹4,799 (42 in stock, Running Shoes) |
|  | **Velocity Run Pro** — ₹6,499 (18 in stock, Running Shoes) |
|  | **Performance Socks** — ₹399 (120 in stock, Accessories) |
|  | **Hydration Bottle** — ₹699 (65 in stock, Accessories) |
|  | **Running Cap** — ₹599 (38 in stock, Accessories) |
| Customers | Arjun Mehta, Priya Sharma, Rohit Verma, Ananya Iyer |

> ⚠️ Never use this tenant in production. The demo password is printed *only*
> during the seed run so you can log in immediately via Swagger UI.

## API

All routes live under `/api/v1/...` and return a standard envelope:

```jsonc
// success
{ "success": true, "data": { ... }, "meta": { ... } }   // meta for paginated lists

// error
{ "success": false, "error": { "code": "RESOURCE_NOT_FOUND", "message": "Product not found", "details": { ... } } }
```

`details` is only set for validation errors (field-level breakdown) and is otherwise omitted.
No stack traces, bcrypt errors, SQL messages, or secrets are ever sent to the client.

### Auth (`/api/v1/auth`)

| Method | Route | Auth | Body | Notes |
|---|---|---|---|---|
| POST | `/api/v1/auth/register` | No | `{ email, password, firstName, lastName, organizationName }` | Transactional: org + user + ORG_ADMIN membership. Password bcrypt-hashed; no role is client-selected. |
| POST | `/api/v1/auth/login` | No | `{ email, password }` | Issues JWT (payload: `sub`, `organizationId`, `roleId`, `role`). Generic 401 for unknown-email *and* wrong-password — prevents account enumeration. |
| GET | `/api/v1/auth/me` | Bearer | — | Current user, org, and role (server-resolved from DB, **not** from the JWT). |

Password rules (registration): 8–128 characters, at least one letter + one digit.

### Products / Catalog (`/api/v1/products`)

All endpoints require Bearer auth and a matching `catalog.*` permission.
**Every query is organization-scoped** — a user from Org A can never see, modify,
or delete a product belonging to Org B (even with a direct UUID); cross-org gets
returned as 404 (never 403), so a client cannot tell whether a resource exists in
another tenant.

| Method | Route | Permission | Query params |
|---|---|---|---|
| GET | `/api/v1/products` | `catalog.read` | `page`, `limit`, `search` (name/desc), `category`, `isActive` |
| GET | `/api/v1/products/:id` | `catalog.read` | — |
| POST | `/api/v1/products` | `catalog.create` | body: `{ name, slug?, description?, category?, price, currency=INR, inventoryQuantity=0, imageUrl?, isActive=true }` |
| PATCH | `/api/v1/products/:id` | `catalog.update` | body: (any subset of above) |
| DELETE | `/api/v1/products/:id` | `catalog.delete` | — |

Money columns use **integer minor units** (paise for INR):
- ₹4,799.00 → `479900`
- Never send a float (`4799.00`) — the endpoint rejects it with 422.

### Agent Catalog (`/api/v1/agent/catalog`)

Machine-readable, organization-scoped catalog for an AI buying agent. Read-only —
no endpoint here ever mutates financial state. All endpoints require Bearer auth
and the `ai.read` permission, and share the exact same organization-scoped
repository code path as the merchant catalog (no separate DB access, no
client-suppliable `organizationId`).

| Method | Route | Notes |
|---|---|---|
| GET | `/api/v1/agent/catalog` | Same filters as `/api/v1/products` (`search`, `category`, `minPrice`, `maxPrice`, `available`, `tags`, `sort`, `order`, `page`, `limit`). Defaults to active products only. Products are shaped for machine consumption: `price: { amount, currency, unit: "minor" }`, `availability: { available, inventoryQuantity }`. |
| POST | `/api/v1/agent/catalog/search` | Body: `{ query?, filters?: { category?, minPrice?, maxPrice?, tags?, available?, sort?, order? }, page?, limit? }` — a structured `AgentSearchIntent`. `query` matches name/description/category the same way `search` does on the merchant endpoint; **no LLM parses it in this milestone** — this is the seam a future AI-generated intent plugs into. |
| GET | `/api/v1/agent/catalog/:productId/recommendations` | Deterministic, explainable upsell/cross-sell. `UPSELL` = same category, strictly higher price. `CROSS_SELL` = shares a tag but different category. Every entry includes `score` and a `reasons` array. |

Agent responses never include `organizationId`, `metadata`, RBAC info, or other
internal fields — only what's needed for commerce discovery.

### Customers (`/api/v1/customers`)

Organization-scoped end customers (the merchant's own customers, NOT PayPilot users).
Same tenant isolation guarantees as products.

| Method | Route | Permission | Query params |
|---|---|---|---|
| GET | `/api/v1/customers` | `customers.read` | `page`, `limit`, `search` (name/email/phone), `status` |
| GET | `/api/v1/customers/:id` | `customers.read` | — |
| POST | `/api/v1/customers` | `customers.create` | body: `{ externalCustomerId?, name, email?, phone?, status=active, metadata? }` |
| PATCH | `/api/v1/customers/:id` | `customers.update` | body: (any subset of above) |

### AI Commerce Agent (`/api/v1/commerce`)

Conversational AI shopping agent (Milestone 4) built on top of the catalog/agent layer
above. Read-only in the financial sense — carts and sessions live entirely in
conversation memory (Redis-backed with an in-process fallback, 30-minute TTL, always
namespaced by `organizationId`) and order previews are quotes only; nothing here writes
to `orders`/`payments`. Intent + filter extraction is deterministic pattern matching
today (see `intent.service.ts`), isolated behind a swappable `IntentExtractor` interface
so an LLM-backed implementation can replace it later without touching anything
downstream. All endpoints require Bearer auth and the `ai.read` permission.

| Method | Route | Notes |
|---|---|---|
| POST | `/api/v1/commerce/chat` | Body: `{ sessionId, message, productId?, productIds?, quantity? }`. Classifies intent (`PRODUCT_SEARCH`, `PRODUCT_COMPARE`, `PRODUCT_DETAILS`, `ADD_TO_CART`, `REMOVE_FROM_CART`, `ORDER_PREVIEW`), calls the matching tool, updates session memory, and returns one structured `CommerceResponse` the frontend can render directly. |
| GET | `/api/v1/commerce/session?sessionId=` | Current cart, last intent, last filters for a session. |
| DELETE | `/api/v1/commerce/session?sessionId=` | Clears a session's cart/memory/history. |
| POST | `/api/v1/commerce/order-preview` | Body: `{ sessionId, items?, budget? }`. Defaults to the session's cart; `items` previews a hypothetical cart without replaying `/chat` turns (never written back to the session). Runs the policy engine (active/in-stock/inventory/budget) before computing `{ subtotal, tax, shipping, total, currency }` — a failed check returns `orderPreview: null` plus the explanation instead of a price. |
| GET | `/api/v1/commerce/compare?productIds=id1,id2` | 2–5 comma-separated UUIDs. Deterministic comparison (price/category/inventory/tags) — no LLM summary. |

Product search results include an explainable `matchScore` (0–100) with a
`matchReasons` array (budget fit, category/tag match, in-stock) — every ranking
decision traces back to a rule, never an opaque model output.

### Checkout (`/api/v1/checkout`) — Milestone 5

End-to-end Razorpay **test-mode** checkout. This is the only place in the codebase
allowed to call Razorpay — the AI commerce agent (or any other caller) can request a
checkout, but never calls Razorpay directly:

```
AI / frontend -> checkout.service -> policy engine -> inventory reservation -> Razorpay
```

Both endpoints require Bearer auth and **`ai.execute`** (not `ai.read` — reading the
catalog and spending money are different permission tiers).

| Method | Route | Notes |
|---|---|---|
| POST | `/api/v1/checkout/create-order` | Body: `{ sessionId, customerId, idempotencyKey? }`. **No `amount` field exists on this endpoint at all** — the server always computes it from the session's cart via the same `buildOrderPreview()` the commerce agent already uses. Runs the policy engine, atomically reserves inventory, creates the internal `orders`/`order_items`/`payment_attempts` rows in one DB transaction, then creates the Razorpay order (outside the transaction). Idempotent: a retried request with the same `idempotencyKey` (or the same session+cart+customer, if none is supplied) replays the existing in-flight checkout instead of creating a duplicate Razorpay order. Retrying a *failed* checkout with the same key creates a new payment attempt against the *same* order rather than a second order. |
| POST | `/api/v1/checkout/verify-payment` | Body: `{ razorpayOrderId, razorpayPaymentId, razorpaySignature }`. Verifies the signature server-side via `RAZORPAY_KEY_SECRET` — never trusts a client-reported success status, amount, or organization id. Marks the order `paid`; idempotent against a webhook that races or arrives first. |

### Payments (`/api/v1/payments`) — read-only

Requires `payments.read`. Never exposes provider secrets or RBAC internals.

| Method | Route | Notes |
|---|---|---|
| GET | `/api/v1/payments/:id` | Single captured payment, organization-scoped (404 across tenants). |
| GET | `/api/v1/payments/history` | Paginated, organization-scoped payment history. |

### Webhooks (`/api/v1/webhooks/razorpay`)

**Not** protected by Bearer-JWT auth — Razorpay itself is the caller. Protected instead
by verifying the `X-Razorpay-Signature` header (HMAC-SHA256) against `RAZORPAY_WEBHOOK_SECRET`
and the **exact raw bytes** of the request body (a route-local Fastify content-type parser
captures these; see `modules/payments/webhook.routes.ts`). Handles `payment.authorized`,
`payment.captured`, and `payment.failed`. Every event is durably deduplicated in the
`webhook_events` table (`UNIQUE(provider, event_id)`) **before** any state changes — a
redelivered event is acknowledged with 200 and a `WEBHOOK_DUPLICATE_IGNORED` audit event,
never double-processed. Configure this exact URL on the Razorpay Dashboard under
Settings > Webhooks.

### Audit (`/api/v1/audit`)

Requires `audit.read`. Organization-scoped, paginated, filterable by `resourceType` /
`resourceId` / `action`. This is what answers "who did what, when, and why" for every
AI action, checkout step, policy decision, payment transition, and webhook event —
see the Audit trail section below.

### Analytics (`/api/v1/analytics`) — Milestone 6

Requires `analytics.read`. Every endpoint is organization-scoped and backed by
`analytics.repository.ts`'s single-purpose SQL aggregations — no number here is
LLM-generated.

| Method | Route | Notes |
|---|---|---|
| GET | `/api/v1/analytics/overview` | Revenue/order/payment KPI overview for `?range=today\|7d\|30d\|90d` (default `30d`): total revenue, order count, payment success rate, average order value, growth vs. previous period, top product. |
| GET | `/api/v1/analytics/revenue-series` | Current vs. previous equal-length period + a daily revenue series. |
| GET | `/api/v1/analytics/top-products` | Per-product revenue/units/orders/avg price, paginated + sortable. |
| GET | `/api/v1/analytics/payment-health` | Success/failure/pending breakdown, failure reasons, repeat-failure-customer signal. |

### Revenue Opportunities (`/api/v1/revenue`) — Milestone 6

Deterministically detected, evidence-backed revenue opportunities with transparent
scoring (see the `SCORING_FORMULA` doc comment at the top of `revenue.engine.ts` —
every point is traceable by hand from the persisted row). Detects `CROSS_SELL`,
`UPSELL`, `PAYMENT_RECOVERY`, `ABANDONED_CHECKOUT`, `REVENUE_DROP`. Re-running
detection is always safe: the `(organization_id, dedupe_key)` unique index makes it
an upsert, never a duplicate.

| Method | Route | Permission | Notes |
|---|---|---|---|
| POST | `/api/v1/revenue/detect` | `analytics.read` | Runs every detector now and upserts results. |
| GET | `/api/v1/revenue/opportunities` | `analytics.read` | Paginated, filterable by `type`/`status`/`severity`, sortable. |
| GET | `/api/v1/revenue/opportunities/:id` | `analytics.read` | Full detail including `evidence`. |
| POST | `/api/v1/revenue/opportunities/:id/approve` | `ai.execute` | `OPEN -> APPROVED`. |
| POST | `/api/v1/revenue/opportunities/:id/reject` | `ai.execute` | `OPEN -> REJECTED`, optional `{ reason }`. |
| POST | `/api/v1/revenue/opportunities/:id/execute` | `ai.execute` | `APPROVED -> EXECUTING -> EXECUTED\|FAILED`. See below. |

**Action execution (Phase 7/8/9).** `POST .../execute` first runs the deterministic
policy engine (`modules/revenue/action-policy.service.ts` — status is `APPROVED`,
approval not expired, action type is one this system can actually carry out,
`estimatedRevenueImpact` is within `REVENUE_ACTION_MAX_AMOUNT_MINOR`). A `BLOCKED`
result is a `422` with the specific failing checks and changes nothing.

Only two `recommendedAction.actionType` values have a real backend execution path
today — `review_failed_payments` (PAYMENT_RECOVERY) and `follow_up_abandoned_checkout`
(ABANDONED_CHECKOUT) — because they're the only ones this codebase can carry out
without a human doing something outside it (sending an email, applying a manual
discount). Execution **prepares** a fresh Razorpay payment attempt/order for the
affected order(s) by reusing `checkout.service.ts`'s own retry/idempotent-order code
path verbatim — it does not and cannot charge the buyer directly, because no payment
gateway lets a merchant unilaterally debit a buyer without the buyer completing their
own authorization step. That's the correct fintech boundary (see the spec's own
Phase-11 example: *"ACTION: Prepare a recovery attempt. APPROVAL: Merchant approval
required before execution."*), not a shortcut. `CROSS_SELL`/`UPSELL`/`REVENUE_DROP`
opportunities are pure recommendations with no automatable action — the policy engine
`BLOCK`s execution for them with a clear reason instead of fabricating a result;
approve/reject still work normally for these, they just can't be "executed."

Execution is idempotent under concurrency: the `APPROVED -> EXECUTING` transition is a
compare-and-swap (`revenue.repository.ts casTransitionOpportunityExecution`), so two
overlapping execute requests for the same opportunity can never both run the action
body. An opportunity already `EXECUTING`/`EXECUTED`/`FAILED` returns `409`.

**Requires a migration.** This adds four nullable columns to `revenue_opportunities`
(`executed_by`, `executed_at`, `execution_result`, `execution_failure_reason`) — run
`npm run db:generate && npm run db:migrate` before using `/execute`.

### AI Copilot (`/api/v1/merchant/ai`) — Milestone 6

Requires `ai.read` (never `ai.execute` — this endpoint never moves money). The
copilot can only see organization data through a bounded, read-only tool layer
(`copilot.tools.ts`: revenue overview/trend, product/payment analytics, revenue
opportunities, opportunity detail, product recommendations) — no direct DB access,
no client-suppliable `organizationId`. Provider is abstracted (`modules/ai/`):
Anthropic or OpenAI if configured (`ANTHROPIC_API_KEY`/`OPENAI_API_KEY`, at most one),
falling back to a deterministic template if neither is set or the configured
provider errors mid-conversation.

| Method | Route | Notes |
|---|---|---|
| POST | `/api/v1/merchant/ai/chat` | Body: `{ message }`. Bounded agentic tool loop (max 4 iterations). Response: `{ reply, provider, toolCalls[] }`. |

### Checkout flow, state machines, and safety guarantees

```
AI recommends product -> buyer confirms -> POST /checkout/create-order
    -> policy engine (reuses commerce-agent's checkPolicies/buildOrderPreview)
    -> DB transaction: reserve inventory (atomic, race-safe) + create order ("pending")
       + order_items snapshot + payment_attempt ("created")
    -> [outside the transaction] Razorpay order created -> attempt -> "pending"
    -> frontend opens Razorpay Checkout with { keyId, razorpayOrderId, amount }
    -> buyer pays -> POST /checkout/verify-payment (signature-verified) AND/OR
       POST /webhooks/razorpay (payment.captured, signature-verified) -> order "paid"
```

**Money safety.** All amounts are server-calculated integer minor units (paise) via
the existing `buildOrderPreview()` — the checkout request body has no amount field to
tamper with in the first place.

**Payment attempt state machine** (centralized in `payment.service.ts` — nowhere else
is allowed to write `payment_attempts.status`):

```
created -> pending -> authorized -> captured   (happy path)
pending -> failed                              (payment failure)
created/pending -> cancelled                   (buyer abandoned)
```

captured/failed/cancelled are terminal *for that attempt* — a retry creates a **new**
attempt (`attemptNumber` + 1) against the same order, never reopens a terminal one.

**Order state machine** (centralized in `orders.service.ts`): `pending -> paid | failed | cancelled`,
and `failed -> pending` is the one controlled backend-owned transition that powers retry.

**Inventory safety.** Inventory is reserved atomically in the *same* transaction as order
creation, using a single `UPDATE ... WHERE inventory_quantity >= quantity` (the race-safety
guard is inside the SQL statement itself, not a separate check-then-act). If a payment
ultimately fails with no further attempt in flight, the reserved stock is restored
(`INVENTORY_RESTORED` audit event) so it isn't permanently lost to other buyers. A retry
re-reserves inventory from scratch — if someone else bought the last units in the meantime,
the retry itself fails with a clear 409 rather than overselling.

**Idempotency.** Enforced at the database level via `UNIQUE(organization_id, idempotency_key)`
on `orders` (Phase 26 explicitly requires this NOT be solved with only an in-memory guard
— it has to survive multiple server instances). Webhook idempotency is the same pattern
applied to `webhook_events` via `UNIQUE(provider, event_id)`.

**Failure handling (required demo scenario).** A failed payment: `payment_attempt -> FAILED`,
`order -> FAILED` (if no other attempt is in flight), inventory restored, `PAYMENT_FAILED`
audit event recorded, and the API returns `{ success: false, error: { code, message, details: { retryable: true } } }`
so the frontend can show "Payment failed. Your order is still safe. You can retry." A
subsequent `POST /checkout/create-order` with the same `idempotencyKey` creates a *new*
payment attempt (and a *new* Razorpay order) against the *same* order and can succeed.

**AI never touches money directly (Rule 4).** The AI commerce agent can request
"create checkout," but every request still goes through authentication, `ai.execute`
RBAC, the policy engine, inventory checks, server-side amount calculation, organization
ownership checks, and audit logging — there is no code path from the AI straight to
Razorpay.

## Audit trail

`src/utils/audit.ts`'s `emitAudit()` now persists every event to the **`audit_logs`**
table (Milestone 5, Phase 15) in addition to the structured stdout log — the DB write
is fire-and-forget (never awaited by the request path) so a DB hiccup can never break
auth, checkout, or any other critical path. Query it via `GET /api/v1/audit`.

Event types added in Milestone 5: `CHECKOUT_REQUESTED`, `CHECKOUT_IDEMPOTENT_REPLAY`,
`CHECKOUT_RETRY_REQUESTED`, `CHECKOUT_FAILED`, `POLICY_CHECK_STARTED`, `POLICY_APPROVED`,
`POLICY_REJECTED`, `INVENTORY_RESERVED`, `INVENTORY_RESTORED`, `ORDER_CREATED`,
`ORDER_STATUS_CHANGED`, `RAZORPAY_ORDER_CREATED`, `RAZORPAY_ORDER_CREATE_FAILED`,
`PAYMENT_INITIATED`, `PAYMENT_VERIFICATION_STARTED`, `PAYMENT_VERIFIED`,
`PAYMENT_SIGNATURE_INVALID`, `PAYMENT_CAPTURED`, `PAYMENT_AUTHORIZED`, `PAYMENT_FAILED`,
`WEBHOOK_RECEIVED`, `WEBHOOK_SIGNATURE_INVALID`, `WEBHOOK_DUPLICATE_IGNORED`,
`WEBHOOK_PROCESSING_FAILED`.

Every event still carries WHO (actor: `USER` / `AI_AGENT` / `SYSTEM` + id), WHAT
(action + resource), WHEN (timestamp), WHY (`reason`), and RESULT (`metadata`) —
secrets are scrubbed before persistence (same `scrub()` used for the stdout log).

## Manual Test Mode verification (Phase 29)

1. Get real Razorpay **test-mode** keys from https://dashboard.razorpay.com/app/keys
   and set `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` in `.env`.
2. (For webhooks) Register `https://<your-tunnel>/api/v1/webhooks/razorpay` on the
   Razorpay Dashboard under Settings > Webhooks, select `payment.authorized`,
   `payment.captured`, `payment.failed`, and copy the generated secret into
   `RAZORPAY_WEBHOOK_SECRET`.
3. `npm run db:generate && npm run db:migrate && npm run db:seed`, then `npm run dev`.
4. Register/login via `POST /api/v1/auth/*`, create a customer via `POST /api/v1/customers`.
5. Use the AI commerce chat (`POST /api/v1/commerce/chat`) to search and add a product to the cart.
6. `POST /api/v1/checkout/create-order` with `{ sessionId, customerId }` — note the
   returned `razorpayOrderId` and `keyId`.
7. Open Razorpay's test-mode Checkout (frontend) with those values, or call
   Razorpay's test APIs directly, and complete a **test card/UPI** payment.
8. Either call `POST /api/v1/checkout/verify-payment` with the returned
   `razorpay_payment_id`/`razorpay_signature`, or just wait for the webhook to arrive.
9. `GET /api/v1/payments/:id` / `GET /api/v1/payments/history` show the captured payment.
10. `GET /api/v1/audit?resourceType=order&resourceId=<orderId>` shows the full,
    explainable lifecycle end to end.
11. To see the required failure-handling demo: use a Razorpay test card configured to
    fail, or call `/verify-payment` with a deliberately wrong `razorpaySignature` —
    the order stays safe, then retry `POST /checkout/create-order` with the same
    `idempotencyKey` and complete payment successfully the second time.

### Exploring via Swagger UI

1. Run `npm run dev`
2. Open `http://localhost:4000/docs`
3. (if using demo data) Click **Authorize** → enter `Bearer <your token>`
   - Or: `POST /api/v1/auth/login` with the demo credentials → copy the returned token
4. Every protected route has a 🔒 icon; click **Try it out** on any route.

## Architecture

```
backend/src/
  config/env.ts              Zod-validated env vars (fail-fast at boot)
  db/
    schema/*.ts              One table per file, composite-FK + check constraints
    index.ts                 drizzle instance + postgres pool (10 conns)
  middleware/
    authenticate.ts          app.authenticate decorator — JWT → fresh users.status → request.authUser
    authorize.ts             requirePermission(name) — membership+role+perm re-resolved from DB each request
  modules/
    auth/                    routes + schemas + service (register, login, me)
    products/                routes + schemas + service + repository
    customers/               routes + schemas + service + repository
  utils/
    errors.ts                AppError class + Errors factory (400/401/403/404/409/422/500)
    response.ts              ok() / fail() envelope + buildPaginationMeta()
    validate.ts              parseOrThrow() — Zod → 422 with field details
    pagination.ts            Shared paginationQuerySchema (page/limit clamping)
    password.ts              bcrypt hash/verify (12 rounds, 128-char max to prevent DoS)
    pg-error.ts              isUniqueViolation() → translates to 409
    audit.ts                 emitAudit() — structured, scrubbed, non-throwing event emitter (see audit section)
  types/auth.ts              AuthUser / JwtPayload + Fastify module augmentation
  index.ts                   Server bootstrap, global error handler, route wiring, Swagger bearerAuth
```

Key design choices you should preserve:

- **Tenant identity comes from `request.authUser.organizationId`**, never from the
  request body. All repository methods accept `organizationId` as their first argument
  and include it in every WHERE clause (repository-level scoping — defense-in-depth
  *above* DB composite FKs).
- **RBAC is re-resolved from the DB on every request** (not trusted from the JWT)
  so a role/permissions change, a membership suspension, or a user being disabled
  takes effect immediately — not only at JWT expiry.
- **Money is integer minor units everywhere.** No `float`, no `numeric`, no `.00`
  in the database. Conversion to/from display units lives at the API boundary.
- **Financial rows use `ON DELETE RESTRICT`** (payment_attempts, payments, orders
  referencing attempt/payment via composite FKs). `scripts/validate-step1.ts`
  asserts this with savepoint-tested, intentionally-rolled-back transactions —
  never weaken those constraints just to make a test pass.
- **Zod validation is the source of truth for input.** Fastify JSON Schemas in
  schemas.ts are *mirrors* for Swagger documentation only — every route handler
  calls `parseOrThrow(schema, payload)` so the Zod behavior is what actually runs.

## RBAC Model (data, not code)

Permissions are rows in `permissions`, roles are rows in `roles`, and they're
joined by `role_permissions`. Route handlers never compare role strings — they
pass a *permission name* to `requirePermission(...)`. Adding a new role in a
future milestone means INSERTing three rows (role + perm links) — zero code
changes to routes.

### Roles

| Role | Typical grants |
|---|---|
| `ORG_ADMIN` | Full org access: org/user/customer/catalog/order/payment/AI/audit **read + write + refund + execute** |
| `OPERATIONS` | customers/catalog/orders **read+write**, payments read+create, AI execute, audit read — **no refund, no users.write, no org.write** |
| `FINANCE` | orders read, payments read+refund, audit read — **NO catalog, NO AI, NO customers.write** |
| `SUPPORT` | customers read (+update), orders read, payments read, audit read — **NO payments.create, NO payments.refund, NO AI, NO catalog.write, NO orders.write** |
| `VIEWER` | All `*.read` — no writes, no payments.create/refund, no AI.execute |

Exact mappings are in `scripts/seed.ts`; running it twice produces identical counts.
(Seed idempotency is itself an integration test: `tests/auth.test.ts → (G1)`.)

### Permissions actually used by today's routes

`organizations.read / organizations.write / users.read / users.write / customers.read / customers.create / customers.update / customers.delete / catalog.read / catalog.create / catalog.update / catalog.delete / orders.read / orders.create / orders.update / orders.delete / payments.read / payments.create / payments.refund / ai.read / ai.execute / audit.read`

## Audit events

The full audit-log milestone (DB table, viewer, retention) is later, but
**call sites are already wired** so the next milestone only swaps the transport:

- `src/utils/audit.ts` → `emitAudit({ type, actor, target, context })`
  - Never throws, even if a future sink fails.
  - Scrubs `password*`, `token`, `secret`, `authorization`, `database_url`, `redis_url` keys to `[REDACTED]` as a last line of defense.
  - Truncates strings > 4096 chars (DoS hardening).

Audit events fired today (see `modules/auth/auth.service.ts`, `middleware/authenticate.ts`,
`middleware/authorize.ts`):

- `ORGANIZATION_CREATED`, `USER_REGISTERED` (after transaction commits)
- `USER_LOGIN_SUCCESS`, `USER_LOGIN_FAILED`, `USER_LOGIN_INACTIVE`, `USER_LOGIN_NO_MEMBERSHIP`, `USER_VIEWED_ME`
- `AUTHENTICATION_FAILED` (invalid/missing JWT, user deleted, user status !== active)
- `PERMISSION_CHECK_GRANTED`, `PERMISSION_CHECK_DENIED`, `AUTHORIZATION_DENIED`

Adding events for `ROLE_CHANGED`, `AI_ACTION`, `POLICY_CHECK`, `ORDER_CREATED`,
`PAYMENT_CREATED/APPROVED/FAILED` is a one-line `emitAudit(...)` each when those
modules land.

## Security hardening checklist (Milestone 2 + remaining items)

### Enforced today

✅ Passwords bcrypt-hashed (12 rounds, 128-char input ceiling) — no plaintext, `passwordHash`/`password_hash` never appear in any response.
✅ JWT secret ≥16 chars; payload is `{ sub, organizationId, roleId, role }` only — no permissions, no PII beyond IDs.
✅ Registration + user/org creation is one Drizzle transaction; partial states are impossible.
✅ `organizationId` is *never* read from request body on write endpoints — it always comes from `request.authUser`.
✅ All list/GET/PATCH/DELETE queries include `WHERE organization_id = authUser.organizationId`; cross-org lookups return 404 (tenant non-disclosure).
✅ `requirePermission()` is a fresh DB join every request; `authenticate()` re-loads `users.status` every request.
✅ Login uses one generic error message for unknown-email *and* wrong-password (no enumeration).
✅ 401 vs 403 is always correctly distinguished (unauthenticated vs authenticated but unauthorized).
✅ Registration assigns `ORG_ADMIN` via server-side role name lookup (not from client).
✅ Secrets only in `.env` (gitignored); `.env.example` has placeholders only.
✅ Global error handler: `AppError` → envelope; Zod validation → 422 with field details; anything else → 500 generic + server-side real-cause log.
✅ DB-level financial integrity: composite FKs guard cross-tenant orders/payments; `ON DELETE RESTRICT` protects financial history. Validate with `npx tsx scripts/validate-step1.ts` (5/5 pass).
✅ Audit emitter `emitAudit()` never throws, scrubs secrets, logs structured JSON → future `audit_events` table is a drop-in swap.

### Planned (Milestone 3+ — documented so we don't lose track)

🔒 **Rate limiting on auth endpoints.** `@fastify/rate-limit` backed by Redis using the already-installed `ioredis`. Suggested defaults (tune via env):
   - `POST /auth/login`: 10 req / 1 min / IP → 429
   - `POST /auth/register`: 5 req / 1 hour / IP → 429
   - Global: 1000 req / 1 min / user-id (or IP for anon)
   Code paths are already clean Fastify hooks — just register in `src/index.ts`.

🔒 **Refresh tokens + shorter JWT lifetimes.** Milestone 2 uses one access token with `JWT_EXPIRES_IN` (default 7d) for simplicity; production should move to access (15 min) + refresh (rotatable, revocable, stored in Redis/DB) — schema for `refresh_tokens` table lives in Milestone 3.

🔒 **Request-ID / actor-IP in audit events.** The `context` field is already shaped for these; wire Fastify's `request.id` + `request.ip` in one place (a global `preHandler` in Milestone 3) instead of per-call-site.

🔒 **CORS strict mode.** `CORS_ORIGIN` already exists as a single-origin env var; in prod add an allow-list array + reject non-matching origins explicitly.

🔒 **Helmet CSP.** Helmet is registered at defaults today; in production add a tighter CSP matching the actual frontend origin.

## Testing

```bash
# Integration tests against the real Neon / Postgres DB.
# Prerequisites (already applied):
#   npm run db:migrate   — migrations 0000…0002
#   npm run db:seed      — 5 roles + 21 permissions (idempotent)
npm test
```

Each test creates its own org, users, products, and customers using random UUID
suffixes so the suite is fully re-runnable without cleanup. Tests in
[tests/auth.test.ts](file:///d:/PayPilot%20AI/backend/tests/auth.test.ts)
(33 top-level `test()` calls, 36+ logical assertions):

| Phase | What | Key cases |
|---|---|---|
| B1–B5 | Registration + login + validation | Happy path; duplicate 409; **passwordHash never in response** (B1b); **DB hash is bcrypt `$2[aby]$`** (B1c); invalid email (B2b); weak passwords: no digit / no letter / too short (B2c–B2e); account enumeration prevention identical code+message (B4b); inactive user denied login (B4c). |
| C1–C2b | JWT + auth middleware | Valid/missing/invalid all 401 uniformly; **disabled user mid-session 401** (C2b — authenticates via fresh `users.status`). |
| D1–D5 | RBAC least-privilege matrix | FINANCE denied catalog.write/ai.execute/customers.write; SUPPORT denied payments.create/refund/ai.execute/catalog.write/orders.write; OPERATIONS gets catalog/orders/customers/payments.create+ai.execute but NOT refund/users.write/org.write; VIEWER denied ALL write routes; ORG_ADMIN gets full matrix. |
| E1–E4b | Products + customers + tenant isolation | Full CRUD, validation, search/filter, cross-org GET/PATCH/DELETE all → 404; **multi-org user in Org A+B can access both but NOT Org C (E4b); OrgC product-by-id fetch → 404 (not 403) to prevent enumeration**. |
| G1 | Seed idempotency | Counts (roles ≥5, permissions ≥21) identical before vs after re-seed. |

[tests/agent.test.ts](file:///d:/PayPilot%20AI/backend/tests/agent.test.ts) covers the
catalog filters (tags/price-range/availability/sort/pagination) and the agent-facing
endpoints: agent-shaped response fields, default-active-only behavior, organization
scoping of catalog + search + recommendations, structured `AgentSearchIntent` filtering,
unknown-filter-key rejection, and UPSELL/CROSS_SELL recommendation correctness
(including that a same-category-but-cheaper product is correctly excluded from UPSELL).

[tests/commerce.test.ts](file:///d:/PayPilot%20AI/backend/tests/commerce.test.ts) covers
the AI Commerce Agent (Milestone 4): `/commerce/chat` auth gating, deterministic
PRODUCT_SEARCH ranking with explainable `matchScore`/`matchReasons`, ADD_TO_CART writing
to session memory, session GET/DELETE, organization-scoped session isolation (same
client-supplied `sessionId` in two orgs never leaks cart state), the policy engine
(empty-cart FAIL, inventory-exceeded FAIL with an explanation), order-preview totals
(subtotal/tax/shipping/total), and `/commerce/compare` (2+ product minimum, cross-tenant
id → 404 rather than leaking another organization's product).

Database constraint tests (standalone, rolls everything back) are in
[scripts/validate-step1.ts](file:///d:/PayPilot%20AI/backend/scripts/validate-step1.ts):
5/5 PASS (cross-tenant customer/payment, payment↔order consistency, org delete restriction, order delete restriction).

## Milestone status

- **Milestone 4** (AI Commerce Agent — conversational search, cart, policy engine,
  order preview): built. See the Commerce Agent section above and
  [tests/commerce.test.ts](file:///d:/PayPilot%20AI/backend/tests/commerce.test.ts).
- **Milestone 5** (Razorpay test-mode checkout, payment state machine, webhook
  verification + idempotency, persisted audit trail, inventory
  reservation/restoration, Redis-backed rate limiting): built. See
  `src/modules/checkout/`, `src/modules/payments/`, `src/modules/audit/`, and
  [tests/checkout.test.ts](file:///d:/PayPilot%20AI/backend/tests/checkout.test.ts) /
  [tests/webhook.test.ts](file:///d:/PayPilot%20AI/backend/tests/webhook.test.ts).
  `emitAudit()` now persists to the `audit_logs` table (see `src/utils/audit.ts`)
  in addition to structured stdout logging.
- **Milestone 6** (AI Revenue Growth Engine + Merchant Analytics — deterministic
  revenue opportunities, analytics KPIs, AI copilot, bounded action execution with a
  policy engine): built. See `src/modules/analytics/`, `src/modules/revenue/`
  (including `action-policy.service.ts` and `revenue.execution.ts`), `src/modules/copilot/`.

## Still open

- AI-generated (LLM) intent extraction — both the agent search endpoint and the
  commerce-agent's intent/filter extraction are deterministic pattern-matching today;
  wiring an actual model in is optional future work (see `IntentExtractor` in
  `intent.service.ts`). The Milestone 6 copilot layer does support an optional
  LLM (`ANTHROPIC_API_KEY`/`OPENAI_API_KEY`) with a deterministic template fallback.
- Frontend dashboard (auth-protected) consuming this API.
- Hot catalog read caching (Redis is wired for rate limiting only, not caching).
- Integration tests for `analytics`, `revenue` (including the `/execute` policy engine
  and idempotency), `copilot`, and `audit` — `tests/` currently only covers auth, agent,
  commerce, checkout, webhook. Next up.
- `POST /revenue/opportunities/:id/execute` requires running
  `npm run db:generate && npm run db:migrate` first (see the Revenue Opportunities
  section above) — not yet applied/verified in this environment; typecheck/build/test
  have not been re-run since this change either. Run them and report back.




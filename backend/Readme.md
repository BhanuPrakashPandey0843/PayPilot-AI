# PayPilot AI — Backend

Fastify + TypeScript API for PayPilot AI (Razorpay Track 01 — AI Growth & Agentic Commerce).
Multi-tenant Postgres (Drizzle ORM), JWT auth with bcrypt, **database-backed RBAC** resolved
fresh on every request, organization-scoped queries at the repository layer, Zod validation,
Swagger/OpenAPI docs, and the Razorpay SDK for test-mode payments (Milestone 3+).

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
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | | — | Test-mode Razorpay credentials (Milestone 3+) |
| `CORS_ORIGIN` | | `http://localhost:3000` | Allowed origin (frontend) |

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

## What's intentionally NOT built yet (Milestone 5+)

Milestone 4 (AI Commerce Agent — conversational search, cart, policy engine, order
preview) is now built; see the Commerce Agent section above and
[tests/commerce.test.ts](file:///d:/PayPilot%20AI/backend/tests/commerce.test.ts).
Per the project brief, these still come next:

- Razorpay order creation + test-mode checkout capture + webhook verification
- Orders module + inventory decrement at order time (uses `products` ↔ `order_items` FK)
- Persisted audit trail (DB table + admin viewer) — today `emitAudit()` logs structured
  events to stdout only; see `src/utils/audit.ts` for the swap-in seam.
- Redis-backed rate limiting on auth endpoints + hot catalog read caching.
- AI-generated (LLM) intent extraction — both the agent search endpoint and the
  commerce-agent's intent/filter extraction are deterministic pattern-matching today;
  wiring an actual model in is later (see `IntentExtractor` in `intent.service.ts`).
- Finance / admin analytics views.
- Frontend dashboard (auth-protected).







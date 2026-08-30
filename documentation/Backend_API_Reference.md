# PayPilot AI — Backend API Reference & Revenue/Analytics Engine Deep-Dive

**Companion to:** `documentation/Backend_Architecture.md`
**Scope:** exact request/response contracts for every route (read directly from each module's `*.routes.ts`/`*.schemas.ts`), plus a full internals walkthrough of the analytics repository, the revenue-opportunity scoring formula, the action-execution policy engine, the commerce-agent's intent/policy engines, and the AI copilot's tool layer.

> Every schema below is copied from the actual Zod/JSON-Schema definitions in the codebase, not reconstructed from the README's prose tables — where the two differ in a field name or default, this document reflects what the code actually enforces.

---

## Table of Contents

1. [Auth](#1-auth)
2. [Products / Catalog](#2-products--catalog)
3. [Customers](#3-customers)
4. [Agent Catalog](#4-agent-catalog)
5. [Commerce Agent](#5-commerce-agent)
6. [Checkout](#6-checkout)
7. [Payments](#7-payments)
8. [Webhooks](#8-webhooks)
9. [Audit](#9-audit)
10. [Analytics — full internals](#10-analytics--full-internals)
11. [Revenue Opportunities — full internals](#11-revenue-opportunities--full-internals)
12. [AI Copilot — full internals](#12-ai-copilot--full-internals)
13. [Commerce Agent internals: intent + policy engines](#13-commerce-agent-internals-intent--policy-engines)

---

## 1. Auth

Base path: `/api/v1/auth` — no `ai.*`/`catalog.*` permission required (public except `/me`).

### `POST /auth/register`

No auth required. Response `201`.

```jsonc
// Request body
{
  "email": string,          // trimmed, lowercased, must be valid email
  "password": string,       // 8–128 chars, must contain ≥1 letter AND ≥1 digit
  "firstName": string,      // 1–120 chars
  "lastName": string,       // 1–120 chars
  "organizationName": string // 1–255 chars
}
```

Server-side behavior: one transaction creates `organizations` + `users` + `organization_members` (role resolved server-side by name lookup for `ORG_ADMIN` — never client-selected). `emitAudit(ORGANIZATION_CREATED)` and `emitAudit(USER_REGISTERED)` fire only after commit.

```jsonc
// Response 201
{
  "success": true,
  "data": {
    "token": string,          // NOT actually returned by /register — only user+organization; see /login for the token
    "user": { "id": uuid, "email": string, "firstName": string, "lastName": string },
    "organization": { "id": uuid, "name": string, "slug": string },
    "role": string
  }
}
```

### `POST /auth/login`

No auth required. Response `200`.

```jsonc
// Request body
{ "email": string, "password": string }
```

Returns the same envelope shape as register, but with a real signed JWT in `token`. Unknown-email and wrong-password both throw the identical generic 401.

### `GET /auth/me`

Requires Bearer JWT (`app.authenticate` only — no additional permission). Returns the current user/organization/role **resolved fresh from the database**, not decoded from the JWT payload directly (beyond using its IDs to look the rows up).

---

## 2. Products / Catalog

Base path: `/api/v1/products`. All routes: `app.authenticate` + `requirePermission("catalog.<verb>")`.

### `GET /products` — `catalog.read`

Query params (Zod schema `listProductsQuerySchema`, extends shared pagination):

| Param | Type | Notes |
|---|---|---|
| `page` | int | default 1 |
| `limit` | int | default 20 |
| `search` | string, 1–255 chars | matches name/description |
| `category` | string, 1–128 chars | exact match |
| `isActive` | `"true"` \| `"false"` | string, transformed to boolean |
| `minPrice` / `maxPrice` | coerced int | integer minor units |
| `available` | `"true"` \| `"false"` | `true` = `inventoryQuantity > 0` |
| `tags` | comma-separated string | **ALL** listed tags must match (not any) |
| `sort` | `createdAt` \| `price` \| `name` | default `createdAt` |
| `order` | `asc` \| `desc` | default `desc` |

### `GET /products/:id` — `catalog.read`

`id` must be a UUID. Cross-org id → `404`.

### `POST /products` — `catalog.create` → `201`

```jsonc
{
  "name": string,              // 1–255
  "slug": string,               // optional, auto-derived if omitted; ^[a-z0-9]+(-[a-z0-9]+)*$
  "description": string,        // optional, ≤10,000 chars
  "category": string,           // optional, ≤128
  "tags": string[],              // ≤20 tags, each 1–64 chars, default []
  "price": integer,              // required, minor units, ≥0
  "currency": string,            // 3 chars, uppercased, default "INR"
  "inventoryQuantity": integer,  // ≥0, default 0
  "imageUrl": string,            // optional, valid URL, ≤2048 chars
  "isActive": boolean            // default true
}
```

### `PATCH /products/:id` — `catalog.update`

Same body shape as create, but every field is optional (`.partial()`).

### `DELETE /products/:id` — `catalog.delete`

Returns `{ id }` of the deleted row.

---

## 3. Customers

Base path: `/api/v1/customers`. Permission family: `customers.*`.

### `GET /customers` — `customers.read`

Query: `page`, `limit`, `search` (name/email/phone, 1–255 chars), `status` (`active`\|`inactive`\|`blocked`).

### `GET /customers/:id` — `customers.read`

### `POST /customers` — `customers.create` → `201`

```jsonc
{
  "externalCustomerId": string,  // optional, 1–255
  "name": string,                 // required, 1–255
  "email": string,                 // optional, valid email or "" — lowercased/trimmed
  "phone": string,                  // optional, ≤32 chars or ""
  "status": "active" | "inactive" | "blocked", // default "active"
  "metadata": Record<string, unknown>            // optional free-form JSON
}
```

Note there is **no** `PUT`/`DELETE` on customers today — only list/get/create/update (`PATCH`).

### `PATCH /customers/:id` — `customers.update`

Same body, all fields optional.

---

## 4. Agent Catalog

Base path: `/api/v1/agent/catalog`. All routes require `ai.read`. Read-only — never mutates.

### `GET /agent/catalog`

Same filter surface as `/products` (`search`, `category`, `minPrice`, `maxPrice`, `available`, `tags`, `sort`, `order`, `page`, `limit`), **plus** `isActive` defaults to `true` here unless explicitly set `false` (the merchant catalog defaults to showing everything; the agent catalog defaults to sellable-only).

Response shape differs from `/products` — machine-friendly nesting:

```jsonc
{
  "id": uuid, "name": string, "description": string, "category": string, "tags": string[],
  "price": { "amount": integer, "currency": string, "unit": "minor" },
  "availability": { "available": boolean, "inventoryQuantity": integer },
  "imageUrl": string
}
```

No `organizationId`, `metadata`, or any RBAC-internal field is ever included.

### `POST /agent/catalog/search`

Body: a structured `AgentSearchIntent`:

```jsonc
{
  "query": string,           // optional — matched like the merchant `search` param, no LLM parsing yet
  "filters": {
    "category": string, "minPrice": integer, "maxPrice": integer,
    "tags": string[], "available": boolean, "sort": string, "order": "asc"|"desc"
  },
  "page": integer, "limit": integer
}
```

Same response shape as `GET /agent/catalog`.

### `GET /agent/catalog/:productId/recommendations`

Deterministic recommendation engine — no ML/LLM. Response:

```jsonc
{
  "product": { /* agent-shaped product */ },
  "recommendations": [
    {
      "product": { /* agent-shaped product */ },
      "type": "UPSELL" | "CROSS_SELL",
      "score": number,
      "reasons": string[]
    }
  ]
}
```

**Rule definitions (from `agent.service.ts`'s design, confirmed by the routes doc comments):**
- `UPSELL` = same `category`, strictly higher `price` than the source product.
- `CROSS_SELL` = shares at least one `tag`, but a **different** `category` (an accessory, not a competitor).

---

## 5. Commerce Agent

Base path: `/api/v1/commerce`. All routes require `ai.read`. Nothing here writes to `orders`/`payments` — carts live in Redis-backed session memory (30-min TTL, in-process fallback if Redis is unavailable).

### `POST /commerce/chat`

```jsonc
{
  "sessionId": string,       // required — client-generated, namespaces all memory
  "message": string,          // the buyer's free-text message
  "productId": string,         // optional UUID — context for e.g. ADD_TO_CART
  "productIds": string[],       // optional UUIDs — context for e.g. PRODUCT_COMPARE
  "quantity": number             // optional — for ADD_TO_CART
}
```

Response (`CommerceResponse`, all nested objects use `additionalProperties: true` so the service layer's actual shape passes through Fastify's serializer untouched):

```jsonc
{
  "message": string,
  "intent": "PRODUCT_SEARCH" | "PRODUCT_COMPARE" | "PRODUCT_DETAILS" | "ADD_TO_CART" | "REMOVE_FROM_CART" | "ORDER_PREVIEW" | "UNKNOWN",
  "products": object[],       // present for PRODUCT_SEARCH — each has matchScore (0-100) + matchReasons[]
  "recommendations": object[],
  "comparison": object[],      // present for PRODUCT_COMPARE
  "policy": object,             // present for ORDER_PREVIEW — see §13
  "orderPreview": object,        // present for ORDER_PREVIEW, null if policy failed
  "memory": object,               // session snapshot echoed back
  "nextAction": string
}
```

### `GET /commerce/session?sessionId=`

Returns the session's current cart, last classified intent, and last extracted filters.

### `DELETE /commerce/session?sessionId=`

Clears cart/memory/history for that session. Returns `{ sessionId, cleared: true }`.

### `POST /commerce/order-preview`

```jsonc
{
  "sessionId": string,        // required
  "items": [ { "productId": uuid, "quantity": integer } ], // optional — overrides the session's stored cart for a HYPOTHETICAL preview, never written back
  "budget": integer             // optional minor units — defaults to session.lastFilters.maxPrice if omitted
}
```

Runs the full policy engine (§13) before computing totals — a failed check returns `orderPreview: null` and the policy explanation instead of numbers.

### `GET /commerce/compare?productIds=id1,id2,...`

2–5 comma-separated UUIDs required. Deterministic price/category/inventory/tag comparison, no LLM summary. A cross-tenant or missing id in the list surfaces as a 404 for that specific lookup.

---

## 6. Checkout

Base path: `/api/v1/checkout`. Both routes require `ai.execute` (not `ai.read`) **and** are rate-limited.

### `POST /checkout/create-order`

Rate limit: `checkout-create` bucket, 20 requests / 60s, keyed per org+user.

```jsonc
{
  "sessionId": string,          // required
  "customerId": uuid,            // required — verified server-side to belong to this org
  "idempotencyKey": string        // optional, 8–128 chars; if omitted, server derives one from sessionId+cart
}
```

**No `amount` field exists on this request at all** — the server always computes the total from the session's cart via `buildOrderPreview()`.

```jsonc
// Response 200
{
  "orderId": uuid,
  "razorpayOrderId": string,
  "amount": integer,              // minor units
  "currency": string,
  "keyId": string,                 // Razorpay PUBLIC key — safe to expose to a frontend
  "status": "pending" | "paid" | "partially_paid" | "cancelled" | "failed" | "refunded",
  "idempotent": boolean             // true if this replayed an existing in-flight checkout
}
```

### `POST /checkout/verify-payment`

Rate limit: `checkout-verify` bucket, 30 requests / 60s.

```jsonc
{ "razorpayOrderId": string, "razorpayPaymentId": string, "razorpaySignature": string }
```

Verifies the HMAC signature server-side against `RAZORPAY_KEY_SECRET` — never trusts a client-reported success. Idempotent against a racing webhook.

```jsonc
// Response 200
{ "orderId": uuid, "status": string, "paymentId": uuid }
```

---

## 7. Payments

Base path: `/api/v1/payments`. Read-only, requires `payments.read`. Never exposes provider secrets/signatures.

### `GET /payments/history` — registered *before* `/:id` on purpose (route-matching order)

Query: `page`, `limit` (paginated, organization-scoped).

### `GET /payments/:id`

Cross-org id → `404`.

---

## 8. Webhooks

Base path: `/api/v1/webhooks`. Single route: `POST /webhooks/razorpay`.

- **No JWT / `app.authenticate`** — instead, a route-local rate limiter keyed by source IP (`webhook-razorpay` bucket, 300 req/60s — deliberately generous so it never throttles legitimate Razorpay delivery bursts, only caps outright flooding).
- A route-local `addContentTypeParser` captures the exact raw request bytes (needed because HMAC verification would fail against a re-serialized JSON object).
- Signature check: `X-Razorpay-Signature` header, HMAC-SHA256 over the raw body, against `RAZORPAY_WEBHOOK_SECRET`.
- Event id fallback: Razorpay doesn't reliably send a top-level event id across API versions, so the handler derives a **deterministic SHA-256 hash** of `eventType:paymentId:paymentStatus:createdAt` when `parsed.id` is absent — ensuring a redelivery of the same underlying event always hashes to the same dedupe key.
- Dedup via `recordWebhookEventOnce()` → `INSERT ... ON CONFLICT (provider, eventId) DO NOTHING RETURNING id`. No row back = duplicate = `200 { received: true, duplicate: true }` immediately, no state change.
- On first delivery, `handleWebhookEvent()` runs **inside its own DB transaction**, fetching the `payment_attempt` fresh *inside* that transaction (not before) specifically to avoid racing a concurrent `/verify-payment` call — the compare-and-swap in `payment.service.ts` is the final backstop, but this ordering keeps a CAS miss the rare exception rather than the routine case.
- Handles `payment.authorized` (pending→authorized), `payment.captured` (→captured), `payment.failed` (→failed). Unhandled event types are acknowledged as a no-op.
- **Always returns 200** once the signature check passes — even on internal processing failure — because a non-2xx would just make Razorpay retry a delivery whose failure is on PayPilot's side, potentially forever, without fixing anything. A processing failure is instead durably recorded (`webhook_events.status = FAILED`, visible via `GET /audit`) for investigation/replay.

---

## 9. Audit

Base path: `/api/v1/audit`. Requires `audit.read`.

### `GET /audit`

Query: `page`, `limit`, `resourceType` (e.g. `order`, `payment_attempt`), `resourceId`, `action` (e.g. `PAYMENT_CAPTURED`). Organization-scoped — never returns another tenant's events.

---

## 10. Analytics — full internals

Base path: `/api/v1/analytics`. All routes require `analytics.read` and additionally fire an `ANALYTICS_REQUESTED` audit event per call (endpoint + range logged).

### Shared date-range resolution (`analytics.service.ts::resolveDateRange`)

**This is the single place** `"today"`/`"7d"`/`"30d"`/`"90d"`/`"custom"` get turned into concrete `Date` boundaries — every analytics *and* revenue-engine caller goes through it, so "the last 7 days" can never silently drift between two endpoints.

| `range` value | Resolution |
|---|---|
| `today` | `[00:00:00.000 UTC today, now]` |
| `7d` | `[now - 7d, now]` |
| `30d` (default) | `[now - 30d, now]` |
| `90d` | `[now - 90d, now]` |
| `custom` | requires `from`/`to`; if `to` is a bare date (≤10 chars, no time component), it's treated as inclusive end-of-day (`23:59:59.999 UTC`) |

`previousPeriod(range)` — used for growth/comparison — is always the **same-length window immediately preceding** the current range, not a calendar-aligned "previous month."

### `GET /analytics/overview`

```jsonc
{
  "period": { "from": ISO8601, "to": ISO8601 },
  "totalRevenueMinor": integer,
  "currency": "INR",
  "orderCount": integer,
  "successfulPayments": integer, "failedPayments": integer, "pendingPayments": integer,
  "paymentSuccessRatePercent": number | null,   // null if 0 successful+failed attempts
  "averageOrderValueMinor": number | null,        // null if 0 paid orders
  "conversionRatePercent": number | null,
  "conversionRateNote": string,                     // always present — see below
  "revenueGrowthPercent": number | null,
  "topProduct": { "productId": uuid|null, "productName": string, "revenueMinor": integer } | null,
  "revenueAtRiskMinor": integer,                       // sum of stale-pending order totals
  "revenueAtRiskOrderCount": integer
}
```

**Honesty note baked into the API itself:** `conversionRatePercent` is computed as `paidOrders / allOrdersCreatedInPeriod` — this is a **proxy**, not true funnel conversion, because the system has no pre-checkout event tracking (browsing that never reaches an order row isn't observed at all). Rather than mislabel it, the response always includes a literal `conversionRateNote` string explaining exactly this limitation. `pctChange()` (used for `revenueGrowthPercent`) returns `null` — not `0` or `Infinity` — when the previous period's base value was zero and the current isn't, since a percentage-growth-off-zero is mathematically undefined; it returns `0` only when both periods are genuinely zero.

### `GET /analytics/revenue`

```jsonc
{
  "period": {...},
  "current": { "revenueMinor": integer, "orders": integer },
  "previous": { "revenueMinor": integer, "orders": integer },
  "change": { "revenuePercent": number|null, "ordersPercent": number|null },
  "series": [ { "bucket": string, "revenueMinor": integer, "orderCount": integer } ]  // daily buckets
}
```

### `GET /analytics/products`

Query adds `sort`/`order`/`page`/`limit` on top of the date-range params. Response:

```jsonc
{
  "period": {...},
  "data": [ { "productId": uuid|null, "productName": string, "revenueMinor": integer, "unitsSold": integer, "orderCount": integer, "averageSellingPriceMinor": integer, "isActive": boolean } ],
  "meta": { "page": integer, "limit": integer, "total": integer, "totalPages": integer }
}
```

### `GET /analytics/payments`

```jsonc
{
  "period": {...},
  "successCount": integer, "failureCount": integer, "pendingCount": integer,
  "paymentSuccessRatePercent": number|null,
  "failedPaymentValueMinor": integer,
  "failuresByCode": [ { "failureCode": string|null, "count": integer, "valueMinor": integer } ],
  "recoveryOpportunitySignal": {
    "repeatFailureCustomerCount": integer,
    "totalRecoverableValueMinor": integer
  }
}
```

`recoveryOpportunitySignal` is the exact same underlying query (`getRepeatFailureCustomers`) the `PAYMENT_RECOVERY` revenue-opportunity detector uses (§11) — the analytics endpoint and the detector never compute this independently, so the two can't drift apart.

---

## 11. Revenue Opportunities — full internals

Base path: `/api/v1/revenue`. `analytics.read` for read routes; `ai.execute` for approve/reject/execute.

### The scoring formula (`revenue.engine.ts`), reproduced exactly

`score` (0–100) is a transparent sum of four independently capped factors — every factor's raw point value is persisted so a human can re-derive the total by hand:

| Factor | Range | Formula |
|---|---|---|
| **Revenue impact** | 0–40 | `min(40, round(40 × estimatedImpactMinor / IMPACT_CAP_MINOR))`, where `IMPACT_CAP_MINOR = ₹50,000` (5,000,000 paise) — full marks at or above the cap, linear below it |
| **Frequency** | 0–25 | `min(25, round(25 × sampleSize / 20))` — 20+ occurrences maxes this out |
| **Recency** | 0–20 | linear decay: `max(0, round(20 × (1 - max(0, daysAgo - 3) / 11)))` — full 20 pts for evidence within 3 days, decaying to 0 at 14+ days |
| **Severity bonus** | 0–15 | flat: `LOW=0, MEDIUM=5, HIGH=10, CRITICAL=15` |

`confidence` (0–100) is a **separate reliability measure**, not part of `score`: `min(100, round(40 + 60 × sampleSize / 15))` — any opportunity that cleared a detector's minimum sample-size gate starts at a 40% floor and approaches 100% as `sampleSize` grows toward 15 occurrences.

### The five detectors

| Detector | Data source | Trigger condition | `estimatedRevenueImpactMinor` methodology |
|---|---|---|---|
| **CROSS_SELL** | `getCoPurchasePairs` + `getProductPurchaseCounts` over a 60-day lookback | A product pair's attachment rate (co-purchase ÷ anchor-product buyers, whichever direction is stronger) is ≥25%, and the pair count clears `max(2, floor(MIN_CROSS_SELL_SAMPLE_SIZE/2))` | `0.15 × unattachedCustomers × recommendedProductPrice` — documented assumption that 15% of currently-unattached buyers would add the recommended product if actively surfaced |
| **UPSELL** | `getCustomerProductPurchases`, grouped per customer, same-category price-step-up pairs over 60 days | Occurrence count ≥ `max(2, floor(MIN_CROSS_SELL_SAMPLE_SIZE/2))` | `0.20 × occurrences × priceDelta` — documented assumption 20% of future base-tier buyers would take a proactively-offered upgrade |
| **PAYMENT_RECOVERY** | `getRepeatFailureCustomers` + `getFailedPaymentValue`, rolling 7 days | Any failed payment in the last 7 days (severity scales: CRITICAL ≥8 failures, HIGH ≥4, else MEDIUM) | Sum of actual failed-payment value in the window — not an assumption, a direct figure |
| **ABANDONED_CHECKOUT** | `getAbandonedCheckouts(ABANDONED_CHECKOUT_THRESHOLD_MINUTES)` | Any order stuck `pending` longer than the configured threshold (default 180 min) | Sum of the stale orders' actual `totalAmount` |
| **REVENUE_DROP** | `getRevenueTotals` for current vs. previous 7-day window | Current < previous **and** the drop exceeds `REVENUE_DROP_THRESHOLD_PERCENT` (default 10%); skipped entirely if the previous period had zero revenue (no reliable baseline) | The actual revenue difference between periods |

All five run in parallel via `Promise.allSettled` in `detectAllOpportunities()` — **one detector throwing never blocks the others** from contributing their results.

### Persistence & re-running

Every opportunity has a `dedupeKey` (e.g. `CROSS_SELL:<productA>:<productB>`, `REVENUE_DROP:rolling-7d`) that's the target of `UNIQUE(organization_id, dedupe_key)`. Re-running `POST /revenue/detect` is always an **upsert** — the same underlying pattern refreshes its evidence/score in place rather than creating a duplicate open opportunity, so scheduling this on a cron (not currently wired — there's no scheduler in the codebase; it's manually triggered) would be safe.

### Endpoints

| Method | Route | Permission | Behavior |
|---|---|---|---|
| `POST` | `/detect` | `analytics.read` | Runs `detectAllOpportunities()`, upserts, returns `{ detected: count, opportunities: [...] }` |
| `GET` | `/opportunities` | `analytics.read` | Paginated list; query: `type`, `status`, `severity`, `sort` (`score`\|`createdAt`\|`estimatedRevenueImpact`, default `score`), `order` (default `desc`) |
| `GET` | `/opportunities/:id` | `analytics.read` | Full detail including `evidence` |
| `POST` | `/opportunities/:id/approve` | **`ai.execute`** | `OPEN → APPROVED`. Does **not** itself execute anything. |
| `POST` | `/opportunities/:id/reject` | **`ai.execute`** | `OPEN → REJECTED`, optional body `{ "reason": string }` (1–2000 chars) |
| `POST` | `/opportunities/:id/execute` | **`ai.execute`** | See below |

### The `/execute` policy engine (`action-policy.service.ts`)

A **separate** deterministic policy engine from the checkout-cart policy engine (§13) — this one gates "is it safe to auto-execute an already-merchant-approved revenue action," not "is this cart valid." Four named checks, each `PASS`/`FAIL`; **any** failure → `422 BLOCKED` with the concatenated failure messages, **no state change**:

1. **`STATUS_APPROVED`** — `opportunity.status === "APPROVED"`.
2. **`NOT_EXPIRED`** — `opportunity.expiresAt` is null or in the future.
3. **`ACTION_TYPE_EXECUTABLE`** — `recommendedAction.actionType` is one of exactly two values this codebase can carry out server-side: `review_failed_payments` (PAYMENT_RECOVERY) or `follow_up_abandoned_checkout` (ABANDONED_CHECKOUT). `CROSS_SELL`/`UPSELL`/`REVENUE_DROP` always fail this check — they're pure recommendations with no automatable backend action, and the engine says so explicitly rather than fabricating a result.
4. **`WITHIN_AMOUNT_LIMIT`** — `estimatedRevenueImpact <= REVENUE_ACTION_MAX_AMOUNT_MINOR` (env var, default ₹1,00,000).

On `ALLOWED`, execution (`revenue.execution.ts`) does one of two things, both by **reusing `checkout.service.ts`'s existing retry/idempotent-order code path verbatim** — never a separate, parallel payment code path:

- **`review_failed_payments`** → for each `targetCustomerId`, finds their most recent failed order (`getMostRecentFailedOrderForCustomer`) and calls `retryCheckoutOrder()` — re-validates, re-reserves inventory, creates a **new payment attempt against the same order** (never a second order), and a fresh Razorpay order. Per-customer failures (no eligible order, provider error) are recorded as `"skipped"` with a `reason`, not silently dropped — the overall outcome is `ok: true` if *at least one* customer's attempt was prepared.
- **`follow_up_abandoned_checkout`** → for each `targetOrderId`, re-checks the order is still `pending` (not already resolved) and calls `ensureActivePaymentLinkForOrder()` to prepare a fresh Razorpay payment link.

**Critically, execution never charges anyone directly** — every payment gateway requires the buyer to complete their own authorization step (card entry, UPI approval), so "execute" means *prepare a fresh, live payment attempt the buyer can complete*, exactly matching the spec's own framing ("ACTION: Prepare a recovery attempt. APPROVAL: Merchant approval required before execution."). The `APPROVED → EXECUTING` transition itself is a **compare-and-swap** in the repository layer (`casTransitionOpportunityExecution`), so two concurrent execute calls for the same opportunity can never both run the action body — the loser gets `409`, and an opportunity already `EXECUTING`/`EXECUTED`/`FAILED` also returns `409` rather than re-running.

---

## 12. AI Copilot — full internals

Base path: `/api/v1/merchant/ai`. Single route: `POST /merchant/ai/chat`, requires `ai.read` (never `ai.execute`).

### Request / response

```jsonc
// request
{ "message": string }

// response
{ "reply": string, "provider": "anthropic" | "openai" | "template", "toolCalls": [ { "name": string, "input": object, "ok": boolean } ] }
```

### The bounded agentic loop (`copilot.service.ts`)

1. System prompt hard-codes 6 rules (paraphrased): no DB/SQL access — only tools; never invent a number/name/ID; say "I don't know" if the tools can't answer; cannot execute any financial action; every cited figure must trace to a tool call in this conversation; be concise.
2. Loop caps at **`MAX_TOOL_ITERATIONS = 4`** — ask the provider → if it requests a tool, execute *only* that named tool (never arbitrary code) → feed the JSON result back as a `tool_result` block → repeat.
3. If the configured provider (`ANTHROPIC_API_KEY` wins if both are set; falls back to `OPENAI_API_KEY`; falls back further to a deterministic template if neither is set) throws mid-conversation, `generateWithFallback()` emits an `AI_PROVIDER_FAILED` audit event and switches to the template provider **for the rest of that conversation** — it does not keep retrying the failing provider turn after turn.
4. If no final text is produced within 4 iterations, the response is a hard-coded honest fallback message pointing the merchant at `GET /analytics/overview` and `GET /revenue/opportunities` directly, rather than pretending to have an answer.
5. Every tool call — successful or rejected (unknown tool name, execution error) — is both logged in the returned `toolCalls[]` array and separately audited (`AI_TOOL_CALLED` / `AI_TOOL_CALL_REJECTED`).

### The 6 available tools (`copilot.tools.ts`) — every one read-only, org-scoped by the service layer only

| Tool | Wraps | Input |
|---|---|---|
| `getRevenueOverview` | `analytics.service::getOverview` | `{ range }` |
| `getRevenueTrend` | `analytics.service::getRevenueTrend` | `{ range }` |
| `getProductPerformance` | `analytics.service::getProductAnalyticsResult` | `{ range, limit ≤20 }` |
| `getPaymentPerformance` | `analytics.service::getPaymentAnalytics` | `{ range }` |
| `getRevenueOpportunities` | `revenue.service::listOpportunities` | `{ type?, status (default OPEN), limit ≤20 }` |
| `getOpportunityDetails` | `revenue.repository::getOpportunityByIdScoped` | `{ id }` |
| `getProductRecommendations` | `agent.service::getAgentRecommendations` | `{ productId }` |

Two design guarantees worth calling out explicitly: (1) `organizationId` is passed into every tool's `execute()` by `copilot.service.ts` from the **authenticated request context** — it is never accepted as part of the AI model's tool-call `input`, so the model itself cannot smuggle a different org id into a tool call. (2) There is deliberately **no** approve/reject/execute tool — those stay behind their own human-driven REST endpoints in `revenue.routes.ts`; the copilot can discuss an opportunity but can never act on one.

---

## 13. Commerce Agent internals: intent + policy engines

### Intent extraction (`intent.service.ts`)

Pure regex pattern matching today, deliberately isolated behind an `IntentExtractor` interface so an LLM-backed implementation can be swapped in later without touching `commerce.service.ts`. Patterns are checked **in order** (first match wins), most-specific first:

1. `ORDER_PREVIEW` — "checkout", "order preview", "place the order", "proceed to pay/checkout", "review my cart"
2. `PRODUCT_COMPARE` — "compare", "versus"/"vs", "difference between"
3. `REMOVE_FROM_CART` — "remove", "take ... out", "delete ... cart", "don't want"
4. `ADD_TO_CART` — "add", "i'll take", "i want to buy", "put ... in cart"
5. `PRODUCT_DETAILS` — "tell me more", "more details/info", "what is", "details on/about", "about the"
6. `PRODUCT_SEARCH` — broad catch-all: "need", "looking for", "show me", "find", "search", "want", plus product-noun words ("shoes", "socks", "cap", "bottle", "hat")

Falls through to `UNKNOWN` if nothing matches (or the message is empty).

`extractFilters()` also pulls structured data out of free text: `maxPrice`/`minPrice` (regex on "under/below/max ₹X" / "above/over/min ₹X", converted rupees→paise), a color word from a fixed 15-word list, a quantity (`\d+ x|pairs|units|pieces`), tags from a fixed keyword list (waterproof, trekking, running, sports, fitness, lightweight, breathable), an `available`/`in stock` boolean, and a category from a small keyword→category map (e.g. "sneakers"/"shoes" → `Running Shoes`; "socks"/"bottle"/"cap"/"hat" → `Accessories`). Anything the regexes aren't confident about is left `undefined`, never guessed.

### Cart policy engine (`policy.service.ts`)

Distinct from the revenue-execution policy engine in §11 — this one validates a **cart**, not an approved-opportunity execution. Checks, each independently PASS/FAIL/WARNING:

- `CART_NOT_EMPTY` — fails immediately if the cart has zero items.
- Per cart item: `PRODUCT_AVAILABLE` (fails generically — not distinguishing "deleted" from "belongs to another org," so no tenant information leaks through a chat error message), `PRODUCT_ACTIVE`, `QUANTITY_VALID` (`>0`), `INVENTORY_SUFFICIENT` (`quantity <= product.inventoryQuantity`).
- `INVENTORY_LOW` — a **WARNING**, not a FAIL, when remaining stock is at or below `LOW_INVENTORY_WARNING_THRESHOLD` (from `constants.ts`) — the cart can still proceed, but the buyer is told stock is limited.
- `BUDGET_WITHIN_LIMIT` — only evaluated if a `budget` was supplied; fails if the computed subtotal exceeds it.

Overall `status` is `FAIL` if any check failed, else `WARNING` if any check warned, else `PASS`. This exact function backs both `POST /commerce/order-preview` and (indirectly, via `buildOrderPreview()`) `POST /checkout/create-order` — the same policy logic gates a preview and a real checkout, so a preview's "this will work" is never contradicted by checkout actually failing that same check.

---

*This document and `Backend_Architecture.md` together are the full architecture + API reference for the PayPilot AI backend as of 2026-08-30. Both were built by reading the live source tree directly (schemas, routes, services, engines) rather than from memory or a template — see each file's header for scope notes.*

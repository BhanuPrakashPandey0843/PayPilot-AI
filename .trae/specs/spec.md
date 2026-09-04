# PayPilot AI - Full Stack Audit, Stabilization, and Completion

## Overview
- **Summary**: Comprehensive end-to-end audit, repair, and completion of the PayPilot AI merchant dashboard (frontend/admin) connected to the Fastify + Drizzle + Postgres backend. Every admin page must use real backend data wherever the backend supports it, with correct API contracts, authentication, RBAC, multi-tenant isolation, pagination, loading/empty/error states, financial accuracy, and production-quality UX.
- **Purpose**: The application currently has partial implementations, disconnected integrations, potential type mismatches, mock/placeholder data, and frontend screens that may not correspond to real backend endpoints. The goal is a production-quality, fully connected, stable system.
- **Target Users**: Merchant administrators accessing the admin panel at /dashboard/* subroutes.

## Goals
- Audit the actual backend capabilities (routes, schemas, permissions, pagination, filters) from source code — NOT from documentation.
- Audit every frontend admin route, its API calls, state management, and UI states.
- Build a frontend↔backend gap matrix and fix every broken connection.
- Ensure every admin page (dashboard, products, orders, customers, payments, analytics, revenue-opportunities, ai-copilot, commerce-assistant, team, settings/organization, audit-logs, roles, settings/security) uses real backend data wherever supported.
- Remove all fake/mock/hardcoded business data from the admin panel.
- Verify and harden authentication flow, RBAC permission checks, and organization/tenant isolation.
- Ensure financial values use integer minor units with correct formatting (no floating-point money).
- Verify all API contracts: HTTP method, URL, query params, body, headers, response envelope, pagination meta, error shape.
- Implement missing frontend screens where the backend already has functionality.
- Implement missing backend endpoints only where genuinely required for an existing intended admin feature.
- Fix loading, empty, error, validation, pagination, filter, and mutation states.
- Ensure responsive behavior, accessibility, and consistent design-system compliance.
- All TypeScript typechecks pass. All available builds succeed. All available tests pass. Lint passes or has defensibly waived issues with rationale.

## Non-Goals
- Redesign the visual system unless something is broken or inaccessible.
- Invent backend APIs for features that are clearly not part of the intended application and cannot be safely implemented.
- Implement buyer/customer account flows (the `user/` directory is out of scope unless it blocks admin functionality).
- Update documentation until implementation has been independently verified.
- Add new business features not implied by the existing frontend + backend source code.

## Background & Context
- Backend: Node.js, Fastify 5, TypeScript, Drizzle ORM (Postgres via `postgres` driver), @fastify/jwt, Redis (rate limiting), Razorpay integration. API prefix `/api/v1/*` (copilot under `/api/v1/merchant/ai/*`, webhooks under `/api/v1/webhooks/*`).
- Frontend: Next.js 16 app-router, React 19, TypeScript strict, Tailwind v4, TanStack Query is NOT listed as a dependency (custom hooks via `lib/api/*` + `hooks/use*`), Recharts for charts, Lucide icons, Framer Motion, GSAP.
- Multi-tenant: organization-scoped; most routes require `app.authenticate` which sets `request.authUser = { userId, organizationId, roles, permissions }`.
- Response envelope: backend returns `{ success: true, data, meta? }` on success, `{ success: false, error: { code, message, details? } }` on failure; frontend `client.ts` mirrors this via `apiClient.get/post/patch/delete/getPaginated`.
- Pagination meta: `{ page, limit, total, totalPages }` as SIBLING of `data` in envelope (not nested inside `data`).
- Money: backend stores amounts in integer minor units (e.g. paise). Frontend must format, never perform authoritative arithmetic.
- No fabrication rule: UI must only expose fields and actions explicitly supported by backend endpoints.
- Permissions: catalog.read, catalog.write, customers.read, customers.write, orders.read, payments.read, analytics.read, audit.read, ai.read, ai.execute, organization.read, organization.write, team.read, team.write, settings.read, settings.write.

## Functional Requirements
- **FR-1 (Backend Capability Map)**: A complete, source-derived map of every backend route group (auth, products, customers, agent/catalog, commerce, checkout, orders, payments, webhooks, audit, analytics, revenue, merchant/ai copilot) listing HTTP method, URL, auth required, permission required, org scope, request/response schema shape, pagination/filter/sort/search support, mutation semantics, error codes.
- **FR-2 (Frontend Admin Route Map)**: A complete map of every route under `frontend/app/(dashboard)/*` covering existence, renderability, API calls, endpoint existence/contract, auth attachment, org scope, permissions checked, and all 32 audit dimensions enumerated in the task description.
- **FR-3 (Frontend↔Backend Connection)**: Every frontend admin API call traces to an existing backend endpoint with matching HTTP method, URL, path/query params, request body, headers, auth, envelope, and pagination meta. Any mismatch is resolved — prefer fixing frontend to match real backend unless backend is demonstrably wrong.
- **FR-4 (Auth/Session)**: Login, registration, current-user (`/auth/me`), token storage (localStorage/sessionStorage key `paypilot_token`), Bearer header attachment on every authenticated request, logout, 401 → redirect-to-login, 403 → user-friendly permission-denied, 404 → resource-not-found (tenant isolation), 429 rate-limit, 500 → graceful generic error.
- **FR-5 (Dashboard /analytics)**: Uses actual backend analytics endpoints for total revenue, order count, customer count, successful payments, revenue series/trend, top products, recent orders, payment health, revenue opportunities, any other backend-supported metric. No hardcoded statistics.
- **FR-6 (Products)**: List (paginated, search, filter, sort where supported), get by ID, create, update, archive/delete if backend supports it, availability, pricing, tags/categories if supported. Forms validate to backend schemas.
- **FR-7 (Orders)**: List (paginated, search, filters, status, sort), order detail, customer, line items, amounts (from backend), payment state, order status, timestamps, supported actions.
- **FR-8 (Customers)**: List (paginated, search), customer detail, order relationships, customer metrics if available, create/edit if backend supports.
- **FR-9 (Payments)**: List with status/amount/currency/order/customer/method info safe to expose, failure info, timestamps, filters, pagination, detail. No secret Razorpay data exposed.
- **FR-10 (Analytics page)**: All charts/tables driven by backend analytics endpoints. Date ranges, revenue series, order metrics, payment metrics, top products, failure analysis, repeat failures, abandoned checkout signals if supported.
- **FR-11 (Revenue Opportunities)**: List, severity, score, confidence, evidence, recommended action, status, expiration, details, execution state via backend policy. Execution respects authorization, amount limits, status, expiry, idempotency/CAS.
- **FR-12 (AI Copilot / Commerce Assistant)**: Connected only to real existing backend endpoints. No fake AI responses. Auth + `ai.read` (and `ai.execute` where backend supports) enforced. Session, request/response schema, loading, tool/action states, catalog results, recommendations, order preview, comparison only where backend provides them.
- **FR-13 (Team / Roles)**: Member list, roles, permissions, invitations if supported, member management, role changes if supported, removal/deactivation if supported. RBAC-enforced; user cannot grant permissions they lack.
- **FR-14 (Settings / Organization / Security)**: Connected to actual backend settings functionality. Only supported organization info, editing, profile/configuration, security actions. No fake settings APIs.
- **FR-15 (UX States)**: Every admin page has loading (skeletons per project convention, not full-page spinners), empty (useful message + CTA), error (user-friendly + retry), success (real confirmation after mutation). Forms: validation, disabled submit during processing, server validation errors mapped. Tables: responsive, pagination, accessible controls. Dialogs: keyboard-accessible, focus, close behavior, loading + error.
- **FR-16 (Responsive & A11y)**: Works at desktop, laptop, tablet, mobile. Fixes horizontal overflow, broken sidebar, clipped buttons, unreadable charts. Semantic buttons/links, keyboard navigation, visible focus, input labels, accessible dialogs, reasonable contrast, screen-reader states.
- **FR-17 (No Fake Data)**: Admin panel free of mock/fake/dummy/placeholder/sample/hardcoded orders, products, customers, statistics, setTimeout pretending to be API, fake success messages, TODO/FIXME without linked issue, dead buttons, unused API functions, localhost assumptions in production URLs.
- **FR-18 (Audit Logs page)**: Connected to `/api/v1/audit` endpoints with supported filters/summary/timeline.
- **FR-19 (Roles page)**: Connected to backend role/permission data if backend exposes it; otherwise page communicates capabilities accurately.

## Non-Functional Requirements
- **NFR-1 (Type Safety)**: Backend `npm run typecheck` passes; Frontend equivalent typecheck passes (tsc --noEmit or next build's type phase).
- **NFR-2 (Build)**: Backend `npm run build` succeeds; Frontend `npm run build` succeeds.
- **NFR-3 (Tests)**: Backend `npm test` runs without infrastructure-caused failures (env vars may be skipped with clear skip messages; test code must still be type-correct).
- **NFR-4 (Lint)**: Backend and frontend lint passes or only has pre-existing, low-risk, documented waivers.
- **NFR-5 (Financial Integrity)**: All money values pass through integer minor units — never parsed as `Number(float)` for authoritative totals. Display formatting only (divide by currency exponent for display, never for business math).
- **NFR-6 (Security)**: No secrets (Razorpay key_secret, webhook secret, JWT secret) in frontend. Client does not supply organization_id as a substitute for backend auth-derived org isolation. 404 on cross-tenant resources.
- **NFR-7 (Error Handling)**: API errors never silently swallowed. User-facing message never leaks stack traces or raw DB errors.
- **NFR-8 (Performance)**: No waterfalls of redundant requests; data-fetching hooks reuse responses appropriately.
- **NFR-9 (Design System Consistency)**: Existing glassmorphism, spacing, typography, color palette, icon set preserved unless something is inaccessible.
- **NFR-10 (Traceability)**: Every fix links to a specific backend route or frontend component; no "cleanup" that changes behavior without rationale.

## Constraints
- **Technical**: Backend Fastify + Drizzle + Postgres; frontend Next.js 16 app-router + custom API client (no TanStack Query per package.json). Keep existing frameworks.
- **Business**: Money uses minor units. Multi-tenant isolation is authoritative on backend. No Razorpay/webhook/JWT secrets on frontend. No fabrication of features.
- **Dependencies**: Backend routes registered in `index.ts` under `/api/v1/*` are the source of truth for endpoint existence. Permissions enum/checks in backend are authoritative.

## Assumptions
- The user's environment has or can obtain Node/npm. Missing env vars may prevent some tests/runtime but must not cause typecheck/build/lint to fail.
- The backend is meant to serve the admin panel at the routes present under `frontend/app/(dashboard)/*`.
- Routes `/roles` and `/settings/security` exist in the frontend; we will verify backend support and surface only supported functionality.
- The `user/` directory (JSX-based storefront) is out of scope unless it blocks admin completion.
- Spec Mode will require multiple review cycles due to scope.

## Acceptance Criteria

### AC-1: Backend capability map is source-derived and complete
- **Type**: `rule`
- **Given**: The backend source tree exists at `backend/src/modules/*` and route registration in `backend/src/index.ts`.
- **When**: Every module's routes file is inspected for HTTP method, URL, auth/permission, org scope, request/response schemas, pagination/filters/mutations.
- **Then**: A complete capability map exists (recorded in task evidence) covering all 14 route groups.
- **Pass Condition**: Each registered route plugin in `index.ts` has ≥1 entry; total entries ≥ count of route schemas defined per module.
- **Evidence**: Per-module audit summaries stored as completion evidence on Tasks 4.x.

### AC-2: Frontend admin route map covers all (dashboard) routes
- **Type**: `rule`
- **Given**: `frontend/app/(dashboard)/**/page.tsx` files.
- **When**: Each page's imports, hooks, API calls, states, and UI controls are audited across all 32 dimensions.
- **Then**: Every page has an audit record.
- **Pass Condition**: All pages in (dashboard) are listed with concrete yes/no and issue refs.
- **Evidence**: Per-page audit summaries on Tasks 5.x.

### AC-3: 100% of frontend admin API calls match existing backend endpoints
- **Type**: `rule`
- **Given**: All `lib/api/*.ts` and `hooks/use*.ts` that hit the backend.
- **When**: Each call is traced verbatim to a backend route: HTTP method, URL path template, path/query params, body fields, auth requirement, response envelope.
- **Then**: Zero mismatches remain; each discrepancy is either fixed in frontend or backend is corrected and explained.
- **Pass Condition**: For every API call, grep in backend routes finds an exact method+prefix+path match and the request/response shapes line up without silent workarounds.
- **Evidence**: Contract-verification log attached to Task 6 completion.

### AC-4: Authentication and tenant isolation end-to-end
- **Type**: `rule`
- **Given**: A valid user session with known org_id.
- **When**: An authenticated request is made against an org-scoped endpoint, AND a request is made for a resource belonging to a different org.
- **Then**: Same-org returns data; different-org returns 404; missing token returns 401; insufficient permission returns 403; frontend routes user to login on 401 and shows permission error on 403.
- **Pass Condition**: Backend middleware enforces it; frontend handles all 4 status classes.
- **Evidence**: Code paths in backend authenticate/authorize + frontend client/session/routing handlers.

### AC-5: Dashboard has zero hardcoded KPI/chart data
- **Type**: `rule`
- **Given**: Dashboard/home page source.
- **When**: Source is searched for inline numeric arrays of revenue/order/product/customer data, sample objects, setTimeout fake-loads.
- **Then**: No hits remain; every numeric value flows from a hook → `lib/api/dashboard.ts` or `lib/api/analytics.ts` → backend analytics route.
- **Pass Condition**: Grep for suspicious patterns returns zero business-data hits in dashboard components (excluding pure formatters and type definitions).
- **Evidence**: Grep output + screenshot of dashboard running against real backend in Task 8 completion.

### AC-6: Financial correctness — minor units only, no float math
- **Type**: `rule`
- **Given**: All pages that render amounts (dashboard, products, orders, customers, payments, analytics, revenue).
- **When**: Amount reaches display layer.
- **Then**: It is treated as integer minor unit; formatting divides only for rendering; no code path performs `parseFloat`, `Number(stringWithDecimal)`, or `+` / `*` / `/` on two currency strings except in formatters using integer exponent math.
- **Pass Condition**: No authoritative arithmetic on floating currency; only formatters apply currency exponent division.
- **Evidence**: Code review findings + formatters in `dashboard/home/formatters.ts` etc.

### AC-7: All admin pages handle loading / empty / error
- **Type**: `rubric`
- **Dimension**: Per-page state handling coverage
- **Scale**: 1-5
- **Anchors**: 1 = most pages have at least one missing state (spinner, no empty, silent errors); 3 = ≥80% of pages have all three states implemented with basic affordances; 5 = every page uses skeletons (per project convention), informative empty states with contextual CTA, and user-friendly error surfaces with retry.
- **Pass Threshold**: >= 4
- **Evidence**: Per-page state audit in Task 9 with screenshot or source excerpts.

### AC-8: Typecheck + build clean on both projects
- **Type**: `rule`
- **Given**: Fresh `npm install` if node_modules absent.
- **When**: `cd backend && npm run typecheck && npm run build` and `cd frontend && npx tsc --noEmit && npm run build`.
- **Then**: Both commands exit 0.
- **Pass Condition**: Exit code 0 and no TS/build errors in stdout.
- **Evidence**: Captured command outputs attached to Phase Final task.

### AC-9: Backend tests run (pass or explicitly skip with env-var gating)
- **Type**: `rule`
- **Given**: Backend package.json `test` script.
- **When**: `npm test` is executed.
- **Then**: Type errors in tests are fixed. Infrastructure/DB-dependent tests that require env vars may SKIP cleanly with clear messages instead of crashing.
- **Pass Condition**: Script exits 0 OR all failures are SKIP outputs gated by missing.env (in which case tests are updated to skip cleanly + documented).
- **Evidence**: Test run log attached.

### AC-10: Responsive + accessible admin
- **Type**: `rubric`
- **Dimension**: Mobile/a11y quality
- **Scale**: 1-5
- **Anchors**: 1 = broken on tablet/mobile (horizontal scroll, clipped widgets, sidebar inoperable); 3 = usable on tablet, significant issues on phone; 5 = clean layout at all breakpoints, tables horizontal-scroll or card-transform, dialogs focusable/closable via keyboard, focus rings visible.
- **Pass Threshold**: >= 4
- **Evidence**: Breakpoint screenshots / DOM inspection in Task 9 completion.

### AC-11: No fake/mock/placeholder data remaining in admin
- **Type**: `rule`
- **Given**: Entire `frontend/app/(dashboard)` and `frontend/lib` / `frontend/hooks`.
- **When**: Searched for `mock|mocked|fake|dummy|placeholder|sample data|TODO|FIXME|setTimeout|hardcoded|localhost:4000` (except as default fallback in env variable coalescing with NEXT_PUBLIC_API_URL).
- **Then**: No hits except legitimate env-defaults, known tracked TODOs with linked issue, or non-business scaffolding comments.
- **Pass Condition**: Grep returns only allowed matches.
- **Evidence**: Grep output at completion.

### AC-12: API error handling never silently swallows
- **Type**: `rule`
- **Given**: Every hook and mutation handler.
- **When**: An API call throws `ApiError`.
- **Then**: Hook returns or component renders a user-visible error; no empty-catch.
- **Pass Condition**: No `catch {}` or `catch(_) {}` without UI/rethrow in data-fetching paths.
- **Evidence**: Code audit output attached to Task 6.

## Open Questions
- [ ] Does the user expect the `/roles` page to manage roles (backend may or may not expose role management) or only display them? (Resolution: inspect backend roles/permissions routes first; implement only what backend supports.)
- [ ] Does `/settings/security` expect session/2FA/password endpoints? If backend lacks these, surface "Not available" cards per existing `NotAvailableCard.tsx`.
- [ ] Is the `user/` storefront directory considered in scope? (Per task scope: only if it blocks admin completion. Assumption: out of scope.)

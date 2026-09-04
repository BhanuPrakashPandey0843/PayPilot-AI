# PayPilot AI - Implementation Plan

## Task 1: Baseline — Backend typecheck, lint, build, tests
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - Run `npm install` if node_modules missing.
  - Run `npm run typecheck`, capture all TS errors.
  - Run `npm run lint`, capture lint findings.
  - Run `npm run build`, capture build errors.
  - Run `npm test`, capture test failures.
  - Do NOT modify code to hide errors; record all as initial defect list.
- **Acceptance Criteria Addressed**: AC-8, AC-9
- **Test Requirements**:
  - `rule` TR-1.1: All 4 commands (typecheck, lint, build, test) are executed and stdout/stderr captured verbatim; each error is categorized (TS, lint, build, test) with file:line.
  - `rubric` TR-1.2: Defect triage quality; scale 1-5; anchors 1=no categorization 3=simple list 5=per-file ranked with root-cause hint; threshold >= 4; evidence = captured logs + summary.

## Task 2: Baseline — Frontend typecheck, lint, build
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - Run `npm install` if node_modules missing.
  - Run TypeScript strict noEmit check.
  - Run `npm run lint`.
  - Run `npm run build`.
  - Capture all errors as initial frontend defect list.
- **Acceptance Criteria Addressed**: AC-8
- **Test Requirements**:
  - `rule` TR-2.1: typecheck + lint + build executed and output captured; every error has file:line.
  - `rubric` TR-2.2: Defect triage quality; scale 1-5; anchors 1/3/5; threshold >= 4; evidence = logs + summary.

## Task 3.1: Backend audit — Auth, Products, Customers modules
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - Deeply inspect backend modules: auth, products, customers.
  - For every route: HTTP method, URL, auth (app.authenticate?), permission (authorize?), org scope (organization_id filter on queries?), request schema (zod), response shape, pagination, filters, search, sort, mutations, DB queries, error codes.
  - Build per-module capability table.
- **Acceptance Criteria Addressed**: AC-1
- **Test Requirements**:
  - `rule` TR-3.1.1: Every route in auth.routes.ts, products.routes.ts, customers.routes.ts is enumerated with all fields; count matches the number of route handler registrations.

## Task 3.2: Backend audit — Orders, Payments, Checkout, Webhooks
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - Deeply inspect orders, payments, checkout, webhook routes and related services/repos/schemas/constants.
  - Same fields as Task 3.1; additionally note Razorpay-related data that is safe/unsafe to expose.
- **Acceptance Criteria Addressed**: AC-1, FR-9 (security)
- **Test Requirements**:
  - `rule` TR-3.2.1: Every route in orders/payments/checkout/webhook modules enumerated; identify all fields that must NOT be serialized to frontend (key_secret, raw signatures, webhook_secret).

## Task 3.3: Backend audit — Analytics, Revenue, Audit, AI modules
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - Deeply inspect analytics, revenue (opportunities + engine + execution + policy), audit, agent/catalog, commerce-agent, copilot modules.
  - Same fields as Task 3.1; additionally capture analytics metric names, revenue opportunity fields/states/actions, AI request/response schemas, tool availability.
- **Acceptance Criteria Addressed**: AC-1
- **Test Requirements**:
  - `rule` TR-3.3.1: Routes enumerated for analytics, revenue, audit, agent, commerce, copilot. Revenue action policy + amount threshold + states clearly documented with backend source.

## Task 3.4: Backend audit — Middleware, DB schema, permissions, roles, env
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - Inspect authenticate middleware (JWT, authUser shape), authorize middleware (permission checks, roles, RBAC), all schema tables (organizations, organization_members, users, roles, permissions, role_permissions), env parsing, error handling, pagination/response utilities, idempotency, password utils, audit utils.
  - Map permissions enum and role→permission assignments if seeded.
- **Acceptance Criteria Addressed**: AC-1, AC-4
- **Test Requirements**:
  - `rule` TR-3.4.1: authUser shape fully described; every permission name listed; DB tables listed with columns; authorize() behavior described with code references.

## Task 4.1: Frontend audit — Dashboard shell, home, sidebar, navbar, nav config
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - Audit app/(dashboard)/layout.tsx, Sidebar, TopNavbar, DashboardShell, navConfig, FloatingAIButton.
  - Audit dashboard/page.tsx + DashboardHome, KpiGrid, RevenueChart, TopProductsGrid, OpportunitiesPanel, RecentActivity, AuditTimeline, DateRangeTabs, Skeletons, formatters.
  - Answer all 32 audit questions per page; note mock data / fake stats / dead buttons / TODO.
- **Acceptance Criteria Addressed**: AC-2, AC-5
- **Test Requirements**:
  - `rule` TR-4.1.1: Every KPI/chart source traced to a hook → lib/api call; list which ones are real vs hardcoded.

## Task 4.2: Frontend audit — Products, Orders, Customers, Payments
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - Audit products/, orders/, customers/, payments/ pages and their _components: Hero, SummaryCards, Table, Toolbar, View, Detail/Form/Delete modals, meta files.
  - Audit hooks/useProducts, useOrders, useCustomers, usePayments + lib/api/{products,orders,customers,payments}.ts.
- **Acceptance Criteria Addressed**: AC-2, AC-3, AC-6
- **Test Requirements**:
  - `rule` TR-4.2.1: Every table column, summary card, form field, modal action traced to specific API call; list endpoint existence match vs mismatch.

## Task 4.3: Frontend audit — Analytics, Revenue-opportunities, Audit-logs, Roles, Team
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - Audit analytics/ (AnalyticsHero, KpiCards, View, PaymentFailureAnalysis, RiskSignals, TopProductsTable), revenue-opportunities/ (Hero, SummaryCards, Filters, View, OpportunityCard/List, ExecuteConfirmModal, PolicyChecks), audit-logs/ (Hero, Summary, Filters, Table, Timeline, View, eventMeta), roles/ (Hero, View, RoleCards, PermissionMatrix, RoleInsights, roleMeta), team/ (Hero, Summary, Toolbar, Table, View, teamMeta).
  - Audit hooks: useAnalytics, useRevenueOpportunities, useAuditLogs, useTeam, lib/api/{audit,team,dashboard}.ts.
- **Acceptance Criteria Addressed**: AC-2, AC-3
- **Test Requirements**:
  - `rule` TR-4.3.1: Every visualization and action traced to hook → API call. List all hardcoded series/sample arrays.

## Task 4.4: Frontend audit — AI Copilot, Commerce Assistant, Settings, Auth flows
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - Audit ai-copilot/ (page, AICopilotChat, ChatComposer, ChatMessageBubble, SuggestedPrompts, ToolCallBadges, hooks/useCopilotChat, lib/api/copilot.ts).
  - Audit commerce-assistant/ (page, CommerceAssistant, Hero, ChatComposer, ChatMessage, ChatWorkspace, ComparisonWidget, ContextPanel, CustomerPicker, OrderPreviewWidget, PaymentRecoveryCard, PolicyChecklist, ProductCard/Grid, RecommendationRow, SuggestionChips, ThinkingIndicator + hooks/useCommerceChat, useOrderPreview, lib/api/commerce.ts).
  - Audit settings/organization, settings/security (SecurityView, OverviewCard, Password, ActiveSessions, LoginActivity, 2FA, NotAvailable, ChangePassword, SignOut, SecurityHeader + hooks/useSecuritySettings).
  - Audit (auth)/login, signup, forgot-password, reset-password flows + lib/auth/session.ts + lib/api/auth.ts + lib/permissions.ts + hooks/useSession, useSidebar, useApiResource, useDashboardHome.
- **Acceptance Criteria Addressed**: AC-2, AC-3, AC-4, AC-12
- **Test Requirements**:
  - `rule` TR-4.4.1: Every AI/copilot/commerce request shape traced to backend schemas; auth flow has handlers for 401/403/404/429/500; permission helpers match backend permission names.

## Task 5: Gap matrix + contract verification
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 3.1, Task 3.2, Task 3.3, Task 3.4, Task 4.1, Task 4.2, Task 4.3, Task 4.4
- **Description**:
  - Combine backend capability map + frontend audit → gap matrix FEATURE | BACKEND | FRONTEND | CONNECTION | STATUS | ACTION.
  - For every frontend API call: verify HTTP method, URL, path/query params, body, headers, auth, response envelope, pagination meta, error shape against actual backend route. Fix all mismatches (prefer frontend aligning to backend; fix backend only if clearly wrong).
- **Acceptance Criteria Addressed**: AC-3, AC-12
- **Test Requirements**:
  - `rule` TR-5.1: Gap matrix produced with at least 12 feature rows.
  - `rule` TR-5.2: Every lib/api function has a matching backend route verified; mismatches are linked to follow-up fix tasks.

## Task 6.1: Fix — Auth & session (401→login, 403→denied, 404→not-found, token lifecycle)
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 5
- **Description**:
  - Implement proper ApiError status handling across client.
  - Ensure `useSession` + session storage + login/logout flows are robust.
  - Ensure client does NOT embed org_id in requests; backend derives it.
  - Wire permission checks to real `authUser.permissions` shape from `/auth/me`.
- **Acceptance Criteria Addressed**: AC-4, AC-12
- **Test Requirements**:
  - `rule` TR-6.1.1: Frontend API client maps status codes 401→route to /login, 403→user-visible permission message, 404→not-found, 429→rate-limit, 500→generic; client never sends org_id as a param unless backend specifically accepts user input for it.

## Task 6.2: Fix — Dashboard home (remove fake KPIs, wire to real analytics/dashboard endpoints)
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 5
- **Description**:
  - Convert DashboardHome/KpiGrid/RevenueChart/TopProductsGrid/OpportunitiesPanel/RecentActivity to use real backend analytics/revenue endpoints.
  - Implement skeletons (already per convention), empty states, error states.
  - Money formatting via integer minor units.
- **Acceptance Criteria Addressed**: AC-5, AC-6, AC-7
- **Test Requirements**:
  - `rule` TR-6.2.1: No hardcoded order/product/customer/revenue arrays remain in dashboard components; all values flow through hooks → api client.

## Task 6.3: Fix — Products, Orders, Customers, Payments
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 5
- **Description**:
  - Real list/detail/create/update/delete modals aligned to backend routes.
  - Real pagination (use meta.total/totalPages), search, filters, sort if backend supports.
  - Form validation against backend schemas; server errors mapped to form fields.
  - Money minor-unit formatting, no float math.
  - Loading/empty/error states.
  - Remove dead buttons; communicate unsupported actions clearly.
- **Acceptance Criteria Addressed**: AC-3, AC-6, AC-7
- **Test Requirements**:
  - `rule` TR-6.3.1: For each of products/orders/customers/payments, at least list + detail work against real backend; create/update/delete only where backend endpoint exists and permission enforced.

## Task 6.4: Fix — Analytics, Revenue Opportunities, Audit Logs, Roles, Team
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 5
- **Description**:
  - Analytics: all charts to backend analytics endpoints; handle empty series, date ranges, currency formatting.
  - Revenue Opportunities: list, filtering, severity/score/evidence/status; execute with policy checks via backend; show real backend errors.
  - Audit Logs: list, filters, summary, timeline; to backend /audit endpoints.
  - Roles: display roles/permissions if backend exposes; else informative page.
  - Team: member list, roles, invites if supported; management actions only if backend supports.
- **Acceptance Criteria Addressed**: AC-3, AC-7, AC-10
- **Test Requirements**:
  - `rule` TR-6.4.1: Every chart & table in analytics/revenue/audit/team driven by real backend; Roles page either functional or clearly communicates supported scope.

## Task 6.5: Fix — AI Copilot, Commerce Assistant, Settings
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: Task 5
- **Description**:
  - AI Copilot: connect to `/api/v1/merchant/ai/*` routes with real schemas; no fake responses; ai.read permission; ai.execute only for actions backend explicitly supports.
  - Commerce Assistant: connect to `/api/v1/commerce/*` and `/api/v1/agent/catalog/*`; tool states, catalog results, recommendations, order preview, comparison only if backend supports.
  - Settings/Organization: wire to real organization info/edit endpoints.
  - Settings/Security: only actions backend supports; NotAvailableCard for unsupported (2FA, sessions listing, etc.).
- **Acceptance Criteria Addressed**: AC-3, AC-7
- **Test Requirements**:
  - `rule` TR-6.5.1: Copilot and Commerce chat only shows a response if backend returned it; no fallback chatbot fake text; organization settings view/edit only fields backend accepts.

## Task 7: UX quality & responsive & a11y pass
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: Task 6.1–6.5
- **Description**:
  - Verify responsive at desktop/tablet/mobile breakpoints. Tables: horizontal scroll or card transform.
  - Fix sidebar/navbar on mobile (collapse, hamburger).
  - Accessibility: semantic buttons/links, keyboard nav, focus rings, input labels, dialog focus/close.
  - Ensure tables have consistent empty/loading patterns; shimmer skeletons per convention.
- **Acceptance Criteria Addressed**: AC-7, AC-10
- **Test Requirements**:
  - `rubric` TR-7.1: Per-AC-7 scale; threshold >= 4; evidence = breakpoint screenshots + source.
  - `rubric` TR-7.2: Per-AC-10 scale; threshold >= 4; evidence = breakpoint screenshots + focus-visible checks.

## Task 8: Cleanup — Remove fake data, TODO, dead code
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 6.1–6.5
- **Description**:
  - Grep codebase for `mock|mocked|fake|dummy|placeholder|sample data|TODO|FIXME|setTimeout.*api|hardcoded|dead buttons|unused api functions`.
  - Remove or replace each: mock data → real backend hooks, fake success → real mutation result, dead button → disabled with tooltip or hidden, tracked TODOs → linked to spec Open Questions.
  - Remove console.log unless meaningful error logging.
  - Verify no localhost assumptions outside of env default fallback.
- **Acceptance Criteria Addressed**: AC-11
- **Test Requirements**:
  - `rule` TR-8.1: Final grep returns no business-data mock hits. Allowed: env-default coalescing, docs, tracked open-question comments.

## Task 9: Final validation — Typecheck, Build, Tests, Lint, Diagnostics
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 1–8
- **Description**:
  - Re-run backend typecheck, lint, build, tests.
  - Re-run frontend typecheck, lint, build.
  - Iterate until clean.
  - Run IDE diagnostics (GetDiagnostics) on both backend and frontend.
  - Final evidence capture.
- **Acceptance Criteria Addressed**: AC-8, AC-9
- **Test Requirements**:
  - `rule` TR-9.1: backend typecheck + build exit 0; frontend tsc --noEmit + build exit 0; tests pass or skip cleanly.
  - `rule` TR-9.2: GetDiagnostics reports zero TypeScript/lint errors (or only pre-existing low-risk with rationale).

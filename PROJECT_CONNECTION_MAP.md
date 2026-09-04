# PROJECT_CONNECTION_MAP.md
*Frontend screen → frontend API client → backend route → backend module → database table(s). Verified against live source.*

## Auth
- `/login`, `/signup` → `lib/api/auth.ts` (`login`, `registerAndSignIn`) → `POST /auth/login`, `POST /auth/register` → `modules/auth/` → `users`, `organizations`, `organization_members`, `roles`
- `/forgot-password` → `lib/api/auth.ts` (`requestPasswordReset`) → `POST /auth/forgot-password` → **route does not exist** → n/a
- Session bootstrap (every dashboard page) → `lib/api/auth.ts` (`getMe`) → `GET /auth/me` → `modules/auth/` → `users`, `organization_members`, `roles`, `organizations`

## Dashboard Home
- `AnalyticsView`-adjacent `DashboardHome` → `lib/api/dashboard.ts` (`getOverview`, `getRevenueTrend`, `listOpportunities`) → `GET /analytics/overview`, `GET /analytics/revenue`, `GET /revenue/opportunities` → `modules/analytics/`, `modules/revenue/` → `orders`, `payments`, `payment_attempts`, `revenue_opportunities`, `products`

## AI Copilot
- `/ai-copilot` → `lib/api/copilot.ts` (`postCopilotChat`) → `POST /merchant/ai/chat` (fixed this session — was pointed at `/copilot/chat`) → `modules/copilot/` (bounded read-only tool layer over analytics + revenue) → reads `analytics`/`revenue` data indirectly via tool calls, no direct table writes

## Commerce Assistant
- `/commerce-assistant` → `lib/api/commerce.ts` → `POST /commerce/chat`, `/commerce/compare`, order-preview, and `POST /checkout/*` for the actual buy flow → `modules/commerce-agent/`, `modules/checkout/` → `products`, `customers`, `orders`, `order_items`, `payment_attempts`, `payments`

## Products
- `/products` → `lib/api/products.ts` → full CRUD `/products` → `modules/products/` → `products`

## Orders
- `/orders` → `lib/api/orders.ts` → `/orders` (list, detail, summary) → `modules/orders/` → `orders`, `order_items`, `customers`, `payment_attempts`, `payments`

## Customers
- `/customers` → `lib/api/customers.ts` → full CRUD `/customers` → `modules/customers/` → `customers`

## Payments
- `/payments` → `lib/api/payments.ts` (re-exports `PaymentAnalytics` from `dashboard.ts`) → `GET /payments`, `GET /payments/history`, `GET /analytics/payments` → `modules/payments/`, `modules/analytics/` → `payment_attempts`, `payments`, `orders`

## Analytics
- `/analytics` → `hooks/useAnalytics.ts` + reused `hooks/useDashboardHome.ts` hooks → `lib/api/dashboard.ts` (`getOverview`, `getRevenueTrend`, `getProductAnalytics`, `getPaymentAnalytics`) → `GET /analytics/overview\|revenue\|products\|payments` → `modules/analytics/` → `orders`, `order_items`, `products`, `payment_attempts`, `payments`
- Same page's opportunities preview reuses `lib/api/dashboard.ts` (`listOpportunities`) → `GET /revenue/opportunities` → `modules/revenue/` → `revenue_opportunities`

## Revenue Opportunities
- `/revenue-opportunities` → `lib/api/dashboard.ts` / dedicated revenue hooks → `GET /revenue/opportunities`, `GET /revenue/opportunities/:id`, `POST .../approve`, `.../reject`, `.../execute` → `modules/revenue/` (engine + policy + execution) → `revenue_opportunities`, plus whatever table the specific opportunity type acts on (e.g. `orders`/`payments` for a payment-recovery execution)

## Audit Logs
- `/audit-logs` → `lib/api/audit.ts` (`listAudit`) → `GET /audit` → `modules/audit/` → `audit_logs`
- Also reused by Security Settings (login-activity card) with `resourceType=user&resourceId=<self>` filters, and internally by every module's `emitAudit()` call as the write path into `audit_logs`.

## Roles & Permissions
- `/roles` → no dedicated list endpoint; renders the known role/permission structure that mirrors `backend/scripts/seed.ts`'s `PERMISSION_DEFS`/`ROLE_PERMISSIONS` — RBAC itself is enforced live on every request via `middleware/authorize.ts`'s `requirePermission()`, which re-resolves `role_permissions` from the DB every time (never trusts the JWT).

## Team Members
- `/team` → `lib/api/team.ts` (`getCurrentTeamMember`, wraps `getMe`) → `GET /auth/me` only → `users`, `organization_members`, `roles`
- Invite/change-role/remove/list-all-members: **no backend route exists**; `lib/api/team.ts`'s corresponding functions always throw `NotAvailableError` by design, and `TEAM_CAPABILITIES` flags are all `false` — the UI shows this honestly (capability chips, "coming soon"), not fake data.

## Organization Settings
- `/settings/organization` → `lib/api/organization.ts` (`getOrganization`, `updateOrganization`) → `GET/PATCH /organizations/me` (**new this session**) → `modules/organizations/` → `organizations`

## Security Settings
- `/settings/security` → `hooks/useSecuritySettings.ts` (`getMe`, `listAudit`) → `GET /auth/me`, `GET /audit?resourceType=user&...` → `modules/auth/`, `modules/audit/` → `users`, `audit_logs`
- Change password / 2FA / multi-device sessions: **no backend route exists** for any of the three; the frontend functions are written against the contract those routes would need, and always surface a real 404/"not available" rather than faking success.

## Webhooks (not a dashboard screen, but part of the money path)
- Razorpay → `POST /webhooks/razorpay` (signature-verified, not JWT-protected) → `modules/payments/webhook.routes.ts` → `webhook_events`, `payment_attempts`, `payments`, `orders`

---

## Legend for "backend exists but not connected to any screen"
None found — every registered backend route (`backend/src/index.ts`'s `app.register` list) has at least one real frontend caller, except the webhook route (which is provider-initiated, not screen-initiated by design).

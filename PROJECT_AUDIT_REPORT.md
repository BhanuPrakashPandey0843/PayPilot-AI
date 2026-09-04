# PROJECT_AUDIT_REPORT.md
*PayPilot AI — architecture, bugs, security, performance, technical debt. Based on direct inspection of `D:\PayPilot AI\backend` and `D:\PayPilot AI\frontend` across this audit.*

## Architecture (as it actually is — corrects the prompt template's description)
- **Backend**: Fastify (not Express) + TypeScript + Drizzle ORM + PostgreSQL (Neon-compatible) + `@fastify/jwt` + a DB-driven RBAC system (roles/permissions/role_permissions re-resolved on every request, never trusted from the JWT). Razorpay test-mode for payments.
- **Frontend**: Next.js 16 (not 15) + React 19 + Tailwind v4 + App Router. Animation stack is GSAP + Framer Motion + Recharts + React Three Fiber — hand-rolled data hooks (`useApiResource` pattern), not React Query/TanStack Query, and no shadcn/ui/Radix despite what `documentation/Tech_stack.md` claims (see Technical Debt).
- 14 backend feature modules, each following the same routes/schemas/service(/repository) layering, registered under `/api/v1/*` in `backend/src/index.ts`.
- Money handling: integer minor units throughout (no floats for currency), composite foreign keys tying `payments`→`payment_attempts`→`orders`→`organizations` together so a payment can never be attributed to another tenant's order, DB-level idempotency (`UNIQUE` constraints, not just in-memory locks) on checkout and webhook processing.

## Critical bugs found and fixed this audit
1. **AI Copilot called the wrong URL.** `lib/api/copilot.ts` posted to `/copilot/chat`; the backend registers the copilot module at `/merchant/ai/chat`. Every copilot message 404'd despite the backend logic being fully correct. **Fixed.**
2. **Organization Settings was a placeholder with no backend support**, even though the `organizations` table already had real `currency`/`timezone` columns no route exposed. Built `GET/PATCH /organizations/me`, extended `GET /auth/me` to actually select those columns, added the missing `ORGANIZATION_UPDATED` audit-event type (the existing `AuditEventType` is a strict union — using an unregistered string there is a real compile error, caught before it shipped). **Fixed.**

## Real, still-open gaps (not fixed — flagged honestly)
1. **`POST /auth/forgot-password` does not exist.** The frontend already calls it and the code openly documents the gap. Needs a real backend route (token generation, email send or equivalent, generic response regardless of whether the email exists — mirroring the login flow's anti-enumeration behavior).
2. **Team management has no backend beyond `GET /auth/me`.** No member list, invite, role-change, or remove endpoints. `TeamView` is honestly capability-gated rather than faking data — this is correct behavior for the current backend, but it means Team isn't actually usable as "team management" yet.
3. **Password change / 2FA / multi-device sessions have no backend support.** Same honest-gap pattern as Team; Security Settings shows real account status and login history but can't act on the other three.
4. **`POST /revenue/opportunities/:id/execute`'s migration status is unverified** — the backend's own documentation flagged this as needing `db:generate && db:migrate` plus a fresh typecheck/build/test cycle that (as far as this audit could confirm) hadn't been re-run.
5. **No automated tests** for the Analytics, Revenue Opportunities, Copilot, or Audit modules — confirmed by directory listing (only `agent`, `auth`, `checkout`, `commerce`, `webhook` test files exist).
6. **Two Drizzle migration snapshot files are missing** (`0002_icy_quasar`, `0004_add_products_tags`) even though their `.sql` files and journal entries exist — risk on the next `db:generate`.

## Security
Strong points, verified directly in code:
- bcrypt password hashing, generic invalid-credentials error (no account enumeration), cross-org access returns 404 not 403 (no tenant enumeration), webhook auth via HMAC signature rather than JWT, audit-log scrubbing of secrets/tokens/passwords before persistence.
- Every route in this audit derives `organizationId` from the verified JWT (`request.authUser`) — never from a client-supplied parameter. Confirmed for the new Organization Settings routes and every Analytics/Revenue endpoint reused by the Analytics page.
Still-open, previously flagged and unchanged:
- No rate limiting specifically on `/auth/login`/`/auth/register` (checkout/verify/webhook/AI-execute already have it).
- 7-day JWT with no refresh-token rotation — a stolen token is valid a full week.
- CORS/Helmet CSP are permissive defaults, fine for a test-mode hackathon build, not production-hardened.

## Performance
No major issues found. Analytics/dashboard hooks fetch pre-aggregated backend endpoints rather than pulling raw tables into the browser. No evidence of N+1 queries in the repository layer reviewed. Frontend has no code-splitting/lazy-loading audit performed in this pass beyond what Next.js's App Router does by default — not flagged as broken, just not separately verified.

## Technical debt
- Root `Readme.md` describes an "initial scaffolding" state that is many milestones out of date.
- `documentation/Tech_stack.md` lists shadcn/ui, Radix UI, React Hook Form, Embla Carousel, Sonner, and next-themes — none of which are installed. The real stack (GSAP/Framer Motion/Recharts/R3F, hand-rolled hooks) is undocumented.
- Stray root-level `package-lock.json` with no matching root `package.json`.
- Backend's own README RBAC section omits `analytics.read` from its permission list even though later sections require it — a stale internal doc, not a code bug.
- Unusual TypeScript package aliasing in `backend/package.json` devDependencies (`typescript` aliased to `@typescript/typescript6`) — worth confirming intentional.

## Not built, and explicitly out of scope
API Keys, Notifications, and a Reports/export feature were listed in the audit prompt's phase checklists but **do not exist anywhere in this codebase** — no route, no schema, no nav entry. Per the same prompt's own rule ("never invent features outside PayPilot AI's scope"), none of these were fabricated. If any of the three is wanted, it needs to be scoped as new feature work, not treated as a "connection bug."

## Validation status
**Not run**: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run dev` for either frontend or backend. This audit was performed via filesystem read/write/search access only — there is no command-execution tool available against your machine in this environment. Every change made in this session was verified by hand (cross-referencing types, imports, and route registrations against the real source), but that is not a substitute for actually running these commands. **Please run them yourself before treating anything here as fully verified**, especially the new `backend/src/modules/organizations/` module and its Drizzle `.returning()` usage.

# DASHBOARD_CONNECTION_AUDIT.md
*PayPilot AI — verified against live source (backend routes/schemas, frontend page files and their API clients), not assumed. "Verified" means I read the actual route registration and the actual frontend fetch call in this session or an earlier turn of this same audit.*

| Dashboard Screen | Backend Exists? | Connected? | Broken? | Fix Required? |
|---|---|---|---|---|
| Login / Signup | Yes — `POST /auth/register`, `POST /auth/login` | Yes | No | No |
| Forgot Password | **No** — no `/auth/forgot-password` route registered | No | **Yes — dead-ends in a 404** | Yes — build the backend route (see PROJECT_AUDIT_REPORT.md §Gaps) |
| Dashboard Home | Yes — `/analytics/overview`, `/analytics/revenue`, `/revenue/opportunities`, `/payments/history`, `/products` | Yes | No | No |
| AI Copilot | Yes — `POST /merchant/ai/chat` | Yes | **Was broken (wrong URL `/copilot/chat`) — fixed this session** | No (fixed) |
| Commerce Assistant | Yes — `/commerce/*`, `/checkout/*` | Yes | No | No |
| Products | Yes — full CRUD `/products` | Yes | No | No |
| Orders | Yes — `/orders` (list/detail/summary) | Yes | No | No |
| Customers | Yes — full CRUD `/customers` | Yes | No | No |
| Payments | Yes — read-only `/payments` | Yes | No | No |
| Analytics | Yes — `/analytics/overview\|revenue\|products\|payments` | Yes | No | No |
| Revenue Opportunities | Yes — `/revenue/opportunities` (list/detail/approve/reject/execute) | Yes | No | `execute` path's DB migration should be re-verified (see PROJECT_AUDIT_REPORT.md) |
| Audit Logs | Yes — `/audit` | Yes | No | No |
| Roles & Permissions | Yes (RBAC is DB-driven; role/permission data comes from the seed, not a dedicated list endpoint) | Yes | No | No |
| Team Members | **Partial** — only `GET /auth/me` exists; no `/users` list, invite, role-change, or remove endpoints | Partial, honestly | No — page correctly shows real data (the current user) plus "coming soon" for everything else, rather than faking a member list | Yes, if full team management is wanted — see PROJECT_AUDIT_REPORT.md |
| Organization Settings | Yes — `GET/PATCH /organizations/me` | Yes | **Was a placeholder — built this session** | No (fixed) |
| Security Settings | Partial — `GET /auth/me` and `GET /audit` (login history) are real; password change, 2FA, and multi-device sessions have no backend support | Partial, honestly | No — page shows real account status/login history and clearly labels the unsupported sections rather than faking them | Yes, if password-change/2FA/sessions are wanted — real backend work, not yet done |
| API Keys | **No such feature exists anywhere in this codebase** — no route, no schema, no nav item | N/A | N/A | Not in scope — this was in the generic prompt template, not a real PayPilot AI feature. Not built. |
| Notifications | **No such feature exists anywhere in this codebase** — no route, no schema, no nav item | N/A | N/A | Not in scope — same as above. Not built. |
| Reports / export | **No such feature exists** — no export/download route or UI control found | N/A | N/A | Not in scope as currently understood; flag if you actually want CSV/PDF export added as new scope. |

## Notes on this table
- "Broken" only means "a currently-wired UI path calls something that fails." A placeholder page (old Organization Settings, before this session) is not "broken" in that sense — it never called a bad endpoint, it just didn't call anything. Both categories are called out above regardless.
- Team and Security Settings are **not bugs** — they are honestly-scoped UI reflecting real backend gaps. Treat them as feature-completion work, not defect fixes.
- API Keys, Notifications, and Reports are not real features of this project as it stands today. I did not build stub pages or fake endpoints for them, per the "never invent features outside PayPilot AI's scope" rule in the prompt this table was requested from.

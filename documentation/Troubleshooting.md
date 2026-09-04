# Troubleshooting & Operational Runbook

**Scope:** recurring or likely-to-recur operational issues in PayPilot AI, verified against live source (not speculative). Each entry states the symptom, the confirmed root cause, the fix, and how to prevent recurrence.

---

## Table of Contents

1. [`403 Missing required permission: <x>` on an otherwise-correctly-wired page](#1-403-missing-required-permission-x-on-an-otherwise-correctly-wired-page)
2. [General rule: re-seed after any RBAC change](#2-general-rule-re-seed-after-any-rbac-change)

---

## 1. `403 Missing required permission: <x>` on an otherwise-correctly-wired page

### Symptom

A dashboard page (e.g. `/dashboard`, or any `/analytics/*`-backed screen) shows an error banner like:

```
Missing required permission: analytics.read
```

The page's data never loads, even though the frontend→backend wiring looks intact.

### Where this message comes from

This is **not** a frontend bug and **not** a broken connection. It is thrown verbatim, on purpose, by `backend/src/middleware/authorize.ts`'s `requirePermission()` — the fresh, per-request RBAC check described in `Backend_Architecture.md` §8. It fires when:

1. `app.authenticate` succeeded (the JWT is valid, the user is active), **and**
2. The user's `organization_members` row is `active`, **but**
3. A join of `role_permissions ⋈ permissions` for that user's `roleId` finds no row matching the required permission name.

The frontend's `apiClient` (`frontend/lib/api/client.ts`) is deliberately transparent — it surfaces the backend's real `error.message` rather than a generic "something went wrong," which is why the exact permission name shows up in the UI. Confirmed by reading `DashboardHome.tsx` → `useDashboardHome.ts` → `lib/api/dashboard.ts` → `apiClient` end to end: every call target is a real, registered `/analytics/*` route.

### Root cause (confirmed 2026-09-04)

`backend/scripts/seed.ts` is the single source of truth for which roles get which permissions (`ROLE_PERMISSIONS` map). It is **idempotent but not retroactive**: permissions added to `PERMISSION_DEFS`/`ROLE_PERMISSIONS` in the code *after* the last time `npm run db:seed` was run do **not** exist in the database until the seed is run again. `analytics.read` is explicitly commented in the seed script as a `(Milestone 6)` addition — i.e. added after the initial permission set — which is the known way for a database to end up missing this one grant while every other permission works fine.

This means the failure mode isn't "some users have a lesser role" (that's normal, working-as-designed — see the role matrix in `Backend_Architecture.md` §8, e.g. `SUPPORT` correctly has no `analytics.read`). It's specifically: the `role_permissions` table in this database predates a permission that now exists in code.

### Fix

From `backend/`:

```
npm run db:seed
```

This is safe to run in any environment, any number of times — every insert in `seed.ts` targets a column with a real database-level `UNIQUE` constraint and uses `.onConflictDoNothing()`, so re-running it never duplicates rows or errors on existing data. It will insert only what's missing: the `analytics.read` permission row (if absent) and the `role_permissions` links for every role that should have it per the `ROLE_PERMISSIONS` map (`ORG_ADMIN`, `OPERATIONS`, `FINANCE`, `VIEWER` — not `SUPPORT`, by design).

Refresh the page after seeding — no frontend or backend code change is needed.

### If re-seeding doesn't fix it

Check which role the logged-in account actually has (`GET /auth/me`, or the "Roles & Permissions" screen). If it's `SUPPORT`, the 403 is **correct behavior** — that role is deliberately read-focused and does not include `analytics.read` (see the role matrix in `Backend_Architecture.md` §8). Log in as (or grant) an `ORG_ADMIN`/`OPERATIONS`/`FINANCE`/`VIEWER` account instead, or add `analytics.read` to `SUPPORT` in `ROLE_PERMISSIONS` and re-seed if that role should genuinely gain analytics access.

---

## 2. General rule: re-seed after any RBAC change

Because RBAC in this codebase is **data, not code** (`Backend_Architecture.md` §8) — roles and permissions are rows, and `requirePermission()` always re-resolves them fresh from the database rather than trusting anything cached in the JWT — any edit to `backend/scripts/seed.ts`'s `PERMISSION_DEFS`, `ROLE_PERMISSIONS`, or `ROLE_NAMES` only takes effect once `npm run db:seed` is actually run against the target database. There is no migration or build step that does this automatically.

**Practical checklist when adding a new permission or changing a role's grants:**

1. Add/edit the entry in `PERMISSION_DEFS` and/or `ROLE_PERMISSIONS` in `backend/scripts/seed.ts`.
2. Run `npm run db:seed` against every environment that needs it (local, staging, demo, production) — it's idempotent, so this is always safe.
3. Existing logged-in sessions pick up the change on their **very next request** — no re-login needed, since `authorize.ts` re-joins the tables every time rather than trusting the JWT's embedded role beyond identifying which role to look up.

This same idempotent-and-safe-to-rerun property is why `registerUser()` (`backend/src/modules/auth/auth.service.ts`) explicitly throws a clear `ORG_ADMIN role is not seeded. Run \`npm run db:seed\` first.` error rather than silently failing if the roles table is empty — the seed script's absence is always the first thing to check when RBAC-adjacent errors show up on a fresh or partially-provisioned database.

---

*Add new entries above as additional recurring issues are confirmed against live source — this file is a living operational reference, not a one-time incident report. Cross-reference `Backend_Architecture.md` §7–8 for the authentication/authorization design this troubleshooting builds on.*

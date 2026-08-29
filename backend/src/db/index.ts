import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../config/env.js";
import * as organizations from "./schema/organizations.js";
import * as users from "./schema/users.js";
import * as roles from "./schema/roles.js";
import * as permissions from "./schema/permissions.js";
import * as rolePermissions from "./schema/role_permissions.js";
import * as organizationMembers from "./schema/organization_members.js";
import * as customers from "./schema/customers.js";
import * as products from "./schema/products.js";
import * as orders from "./schema/orders.js";
import * as payments from "./schema/payments.js";
import * as auditLogs from "./schema/audit_logs.js";
import * as webhookEvents from "./schema/webhook_events.js";

export const schema = {
  ...organizations,
  ...users,
  ...roles,
  ...permissions,
  ...rolePermissions,
  ...organizationMembers,
  ...customers,
  ...products,
  ...orders,
  ...payments,
  ...auditLogs,
  ...webhookEvents,
};

// Single shared connection pool for the process. `max` kept modest since
// this is a Fastify app, not a serverless function per-request context.
const queryClient = postgres(env.DATABASE_URL, { max: 10 });

export const db = drizzle(queryClient, { schema });

export type Database = typeof db;

/**
 * Type of the `tx` argument inside `db.transaction(async (tx) => {...})`.
 * Structurally compatible with `Database` for every query-builder method
 * used in this codebase (select/insert/update/delete) but is NOT the same
 * nominal type, so a plain `Database` type annotation rejects a real `tx`
 * (and vice versa) unless callers use this union. Milestone 5 repository
 * functions accept `Executor` so a single call can be composed into one
 * atomic transaction by checkout.service.ts (Phase 25) while still working
 * standalone against the shared pool.
 */
export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
export type Executor = Database | Transaction;

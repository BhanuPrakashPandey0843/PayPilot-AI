import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema/users.js";
import { Errors } from "../utils/errors.js";
import { emitAudit } from "../utils/audit.js";
import type { AuthUser, JwtPayload } from "../types/auth.js";

/**
 * Registers `app.authenticate` — a reusable decorator that route handlers
 * pass to Fastify's `onRequest` hook (`{ onRequest: [app.authenticate] }`).
 *
 * On success, sets `request.authUser` from the verified JWT payload.
 * Never trusts anything from the request body/query for identity — the
 * token (signed server-side at login) is the only source of truth.
 *
 * SECURITY: After JWT signature + expiry checks pass, we still re-load
 * `users.status` from the database on EVERY request. If a user was
 * disabled, banned, or deleted AFTER their token was issued, this still
 * catches it — tokens don't confer access if the underlying account is
 * no longer active. (requirePermission() also does its own fresh DB check
 * for membership.status + role, so revocations take effect immediately.)
 */
export function registerAuthenticate(app: FastifyInstance): void {
  app.decorate(
    "authenticate",
    async function authenticate(request: FastifyRequest, _reply: FastifyReply) {
      let payload: JwtPayload;
      try {
        payload = await request.jwtVerify<JwtPayload>();
      } catch {
        // Covers missing token, malformed token, invalid signature, and
        // expired token — @fastify/jwt throws for all of these, and we
        // deliberately don't distinguish them in the response (avoids
        // leaking which case applied).
        emitAudit({
          type: "AUTHENTICATION_FAILED",
          actor: null,
          context: { route: (request.routeOptions?.url ?? request.url), method: request.method, reason: "invalid_or_missing_jwt" },
        });
        throw Errors.unauthorized("Invalid or missing authentication token");
      }

      const [userRow] = await db
        .select({ status: users.status })
        .from(users)
        .where(eq(users.id, payload.sub))
        .limit(1);

      if (!userRow) {
        emitAudit({
          type: "AUTHENTICATION_FAILED",
          actor: { userId: payload.sub },
          context: { route: (request.routeOptions?.url ?? request.url), method: request.method, reason: "user_row_missing" },
        });
        throw Errors.unauthorized("Authentication required");
      }
      if (userRow.status !== "active") {
        emitAudit({
          type: "AUTHENTICATION_FAILED",
          actor: { userId: payload.sub },
          context: { route: (request.routeOptions?.url ?? request.url), method: request.method, reason: "user_not_active", status: userRow.status },
        });
        throw Errors.unauthorized("This account is no longer active");
      }

      const authUser: AuthUser = {
        userId: payload.sub,
        organizationId: payload.organizationId,
        roleId: payload.roleId,
        role: payload.role,
      };

      request.authUser = authUser;
    }
  );
}

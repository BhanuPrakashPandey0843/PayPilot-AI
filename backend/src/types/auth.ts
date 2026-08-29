/**
 * Identity attached to `request.authUser` after `app.authenticate` runs.
 * Everything server-side derives tenant/permission decisions from this —
 * never from anything the client sends in the request body.
 */
export interface AuthUser {
  userId: string;
  organizationId: string;
  roleId: string;
  role: string;
}

/** Shape of the JWT payload we sign and verify. Keep this minimal. */
export interface JwtPayload {
  sub: string; // userId
  organizationId: string;
  roleId: string;
  role: string;
}

// Augment Fastify's request/instance types so `request.authUser` and
// `app.authenticate` are known everywhere without casts.
declare module "fastify" {
  interface FastifyRequest {
    authUser?: AuthUser;
  }

  interface FastifyInstance {
    authenticate: (request: import("fastify").FastifyRequest, reply: import("fastify").FastifyReply) => Promise<void>;
  }
}

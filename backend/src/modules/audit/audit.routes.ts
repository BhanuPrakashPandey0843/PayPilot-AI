/**
 * Audit trail read API (Phase 21–22). This is what lets a merchant
 * operator (or a hackathon judge) answer "who did what, when, and why"
 * for every AI action, checkout step, policy decision, payment
 * transition, and webhook event — see utils/audit.ts for the writer side.
 */
import type { FastifyInstance } from "fastify";
import { requirePermission } from "../../middleware/authorize.js";
import { Errors } from "../../utils/errors.js";
import { ok } from "../../utils/response.js";
import { parseOrThrow } from "../../utils/validate.js";
import { auditQuerySchema, auditQueryJsonSchema, auditListResponseJsonSchema, type AuditQuery } from "./audit.schemas.js";
import { listAuditForOrg } from "./audit.service.js";

export async function auditRoutes(app: FastifyInstance) {
  app.get(
    "/",
    {
      onRequest: [app.authenticate],
      preHandler: [requirePermission("audit.read")],
      schema: {
        tags: ["Audit"],
        summary: "List audit events for the current organization (paginated, filterable)",
        description:
          "Every AI action, checkout step, policy decision, payment state transition, and webhook event that " +
          "touched money or the catalog in this organization — organization-scoped, never returns another " +
          "tenant's events. Optional filters: resourceType (e.g. 'order', 'payment_attempt'), resourceId, action " +
          "(e.g. 'PAYMENT_CAPTURED').",
        security: [{ bearerAuth: [] }],
        querystring: auditQueryJsonSchema,
        response: { 200: auditListResponseJsonSchema },
      },
    },
    async (request, reply) => {
      const authUser = request.authUser;
      if (!authUser) throw Errors.unauthorized();

      const { page, limit, resourceType, resourceId, action } = parseOrThrow<AuditQuery>(auditQuerySchema, request.query);
      const { rows, meta } = await listAuditForOrg(authUser.organizationId, { resourceType, resourceId, action }, { page, limit });
      reply.send(ok(rows, meta));
    }
  );
}

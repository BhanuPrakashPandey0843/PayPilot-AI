import type { FastifyInstance } from "fastify";
import { requirePermission } from "../../middleware/authorize.js";
import { getOrganizationForOrg, updateOrganizationForOrg } from "./organizations.service.js";
import {
  updateOrganizationBodySchema,
  updateOrganizationBodyJsonSchema,
  type UpdateOrganizationBody,
} from "./organizations.schemas.js";
import { parseOrThrow } from "../../utils/validate.js";
import { ok } from "../../utils/response.js";
import { Errors } from "../../utils/errors.js";

const organizationResponseJsonSchema = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    data: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
        name: { type: "string" },
        slug: { type: "string" },
        status: { type: "string", enum: ["active", "suspended", "inactive"] },
        currency: { type: "string" },
        timezone: { type: "string" },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" },
      },
    },
  },
} as const;

/**
 * Organization settings for the currently-authenticated user's own
 * organization only — there is no ":id" param anywhere in this module
 * on purpose. organizationId always comes from the verified JWT
 * (request.authUser), never from the client, so there is no way to
 * read or edit another tenant's organization through this route.
 *
 * GET requires organizations.read (every role has it — see
 * backend/scripts/seed.ts's ROLE_PERMISSIONS); PATCH requires
 * organizations.update (ORG_ADMIN only in the current seed).
 */
export async function organizationsRoutes(app: FastifyInstance) {
  app.get(
    "/me",
    {
      onRequest: [app.authenticate],
      preHandler: [requirePermission("organizations.read")],
      schema: {
        tags: ["Organization"],
        summary: "Get the current organization's settings (name, currency, timezone)",
        security: [{ bearerAuth: [] }],
        response: { 200: organizationResponseJsonSchema },
      },
    },
    async (request, reply) => {
      const authUser = request.authUser;
      if (!authUser) throw Errors.unauthorized();

      const organization = await getOrganizationForOrg(authUser.organizationId);
      reply.send(ok(organization));
    }
  );

  app.patch(
    "/me",
    {
      onRequest: [app.authenticate],
      preHandler: [requirePermission("organizations.update")],
      schema: {
        tags: ["Organization"],
        summary: "Update the current organization's name, currency, or timezone",
        security: [{ bearerAuth: [] }],
        body: updateOrganizationBodyJsonSchema,
        response: { 200: organizationResponseJsonSchema },
      },
    },
    async (request, reply) => {
      const authUser = request.authUser;
      if (!authUser) throw Errors.unauthorized();

      const body = parseOrThrow<UpdateOrganizationBody>(
        updateOrganizationBodySchema,
        request.body
      );
      const organization = await updateOrganizationForOrg(authUser, body);
      reply.send(ok(organization));
    }
  );
}

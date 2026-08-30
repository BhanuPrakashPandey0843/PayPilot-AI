import type { FastifyInstance } from "fastify";
import { requirePermission } from "../../middleware/authorize.js";
import { Errors } from "../../utils/errors.js";
import { ok } from "../../utils/response.js";
import { parseOrThrow } from "../../utils/validate.js";
import { chatBodySchema, chatBodyJsonSchema, chatResponseJsonSchema, type ChatBody } from "./copilot.schemas.js";
import { runCopilotChat } from "./copilot.service.js";

export async function copilotRoutes(app: FastifyInstance) {
  app.post(
    "/chat",
    {
      onRequest: [app.authenticate],
      preHandler: [requirePermission("ai.read")],
      schema: {
        tags: ["AI Copilot"],
        summary: "Ask the merchant AI copilot a question about revenue, products, payments, or opportunities",
        description:
          "The copilot can only see this organization's data through a bounded set of read-only tools (revenue " +
          "overview/trend, product/payment analytics, revenue opportunities) — it has no direct database access " +
          "and cannot execute any financial action. If no AI provider is configured (ANTHROPIC_API_KEY / " +
          "OPENAI_API_KEY), it falls back to a deterministic template that still returns real backend-calculated " +
          "data. Requires ai.read (never ai.execute — this endpoint never moves money).",
        security: [{ bearerAuth: [] }],
        body: chatBodyJsonSchema,
        response: { 200: chatResponseJsonSchema },
      },
    },
    async (request, reply) => {
      const authUser = request.authUser;
      if (!authUser) throw Errors.unauthorized();

      const { message } = parseOrThrow<ChatBody>(chatBodySchema, request.body);
      const result = await runCopilotChat(authUser.organizationId, message, {
        userId: authUser.userId,
        roleId: authUser.roleId,
        role: authUser.role,
      });

      reply.send(ok(result));
    }
  );
}

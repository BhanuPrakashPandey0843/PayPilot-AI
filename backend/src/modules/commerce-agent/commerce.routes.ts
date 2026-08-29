import type { FastifyInstance } from "fastify";
import { requirePermission } from "../../middleware/authorize.js";
import { handleChatMessage, getSessionSummary } from "./commerce.service.js";
import { loadOrCreateSession, clearSession } from "./conversation.service.js";
import { buildOrderPreview } from "./order-preview.service.js";
import { compareProductsTool } from "./tools.service.js";
import {
  chatBodySchema,
  chatBodyJsonSchema,
  sessionQuerySchema,
  sessionQueryJsonSchema,
  orderPreviewBodySchema,
  orderPreviewBodyJsonSchema,
  compareQuerySchema,
  compareQueryJsonSchema,
  type ChatBody,
  type SessionQuery,
  type OrderPreviewBody,
  type CompareQuery,
} from "./commerce.schemas.js";
import { parseOrThrow } from "../../utils/validate.js";
import { ok } from "../../utils/response.js";
import { Errors } from "../../utils/errors.js";

const commerceResponseJsonSchema = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    data: {
      type: "object",
      properties: {
        message: { type: "string" },
        intent: { type: "string" },
        products: { type: "array", items: { type: "object" } },
        recommendations: { type: "array", items: { type: "object" } },
        comparison: { type: "array", items: { type: "object" } },
        policy: { type: "object" },
        orderPreview: { type: "object" },
        memory: { type: "object" },
        nextAction: { type: "string" },
      },
    },
  },
} as const;

/**
 * AI Commerce Agent (Phase 1). Every route requires the `ai.read`
 * permission — this namespace never mutates persisted financial state:
 * carts and sessions live entirely in conversation memory
 * (memory.service.ts) and order previews are quotes, not orders. No
 * route here has a client-suppliable organizationId — every downstream
 * call is scoped to `request.authUser.organizationId`.
 */
export async function commerceAgentRoutes(app: FastifyInstance) {
  // --- POST /commerce/chat ---
  app.post(
    "/chat",
    {
      onRequest: [app.authenticate],
      preHandler: [requirePermission("ai.read")],
      schema: {
        tags: ["Commerce Agent"],
        summary: "Conversational commerce turn — the single entry point for the AI shopping agent",
        description:
          "Classifies buyer intent (PRODUCT_SEARCH, PRODUCT_COMPARE, PRODUCT_DETAILS, ADD_TO_CART, " +
          "REMOVE_FROM_CART, ORDER_PREVIEW) deterministically, calls the matching backend tool, updates the " +
          "session's conversation memory (30-minute TTL, Redis-backed with an in-memory fallback), and returns a " +
          "single structured response the frontend can render directly. No payment is executed by this endpoint.",
        security: [{ bearerAuth: [] }],
        body: chatBodyJsonSchema,
        response: { 200: commerceResponseJsonSchema },
      },
    },
    async (request, reply) => {
      const authUser = request.authUser;
      if (!authUser) throw Errors.unauthorized();

      const body = parseOrThrow<ChatBody>(chatBodySchema, request.body);
      const response = await handleChatMessage(
        authUser.organizationId,
        authUser.userId,
        body.sessionId,
        body.message,
        { productId: body.productId, productIds: body.productIds, quantity: body.quantity }
      );
      reply.send(ok(response));
    }
  );

  // --- GET /commerce/session ---
  app.get(
    "/session",
    {
      onRequest: [app.authenticate],
      preHandler: [requirePermission("ai.read")],
      schema: {
        tags: ["Commerce Agent"],
        summary: "Read a conversation session's current cart, last intent, and last filters",
        security: [{ bearerAuth: [] }],
        querystring: sessionQueryJsonSchema,
        response: { 200: { type: "object" } },
      },
    },
    async (request, reply) => {
      const authUser = request.authUser;
      if (!authUser) throw Errors.unauthorized();

      const { sessionId } = parseOrThrow<SessionQuery>(sessionQuerySchema, request.query);
      const session = await loadOrCreateSession(authUser.organizationId, authUser.userId, sessionId);
      reply.send(ok(await getSessionSummary(session)));
    }
  );

  // --- DELETE /commerce/session ---
  app.delete(
    "/session",
    {
      onRequest: [app.authenticate],
      preHandler: [requirePermission("ai.read")],
      schema: {
        tags: ["Commerce Agent"],
        summary: "Clear a conversation session (cart, memory, and history)",
        security: [{ bearerAuth: [] }],
        querystring: sessionQueryJsonSchema,
        response: { 200: { type: "object" } },
      },
    },
    async (request, reply) => {
      const authUser = request.authUser;
      if (!authUser) throw Errors.unauthorized();

      const { sessionId } = parseOrThrow<SessionQuery>(sessionQuerySchema, request.query);
      await clearSession(authUser.organizationId, sessionId);
      reply.send(ok({ sessionId, cleared: true }));
    }
  );

  // --- POST /commerce/order-preview ---
  app.post(
    "/order-preview",
    {
      onRequest: [app.authenticate],
      preHandler: [requirePermission("ai.read")],
      schema: {
        tags: ["Commerce Agent"],
        summary: "Build a policy-checked order preview (quote only — no payment executed)",
        description:
          "Defaults to the session's stored cart. Passing `items` previews a hypothetical cart without first " +
          "replaying add-to-cart turns through /chat — it is never written back to the session. Every product is " +
          "re-validated (active, in stock, sufficient inventory, within budget) before a total is returned; a " +
          "failed policy check returns the explanation instead of a preview.",
        security: [{ bearerAuth: [] }],
        body: orderPreviewBodyJsonSchema,
        response: { 200: { type: "object" } },
      },
    },
    async (request, reply) => {
      const authUser = request.authUser;
      if (!authUser) throw Errors.unauthorized();

      const body = parseOrThrow<OrderPreviewBody>(orderPreviewBodySchema, request.body);
      const session = await loadOrCreateSession(authUser.organizationId, authUser.userId, body.sessionId);
      const cart = body.items ?? session.cart;
      const budget = body.budget ?? session.lastFilters?.maxPrice;

      const { preview, policy } = await buildOrderPreview(authUser.organizationId, cart, budget);
      reply.send(
        ok({
          message: preview ? "Here's your order preview." : "I can't build an order preview yet — see the policy notes below.",
          orderPreview: preview,
          policy,
        })
      );
    }
  );

  // --- GET /commerce/compare ---
  app.get(
    "/compare",
    {
      onRequest: [app.authenticate],
      preHandler: [requirePermission("ai.read")],
      schema: {
        tags: ["Commerce Agent"],
        summary: "Compare 2–5 products side by side",
        description:
          "Deterministic comparison (price, category, inventory, tags) — no LLM summary. Every product must be " +
          "active, in stock or not per its own listing, and in the caller's organization; a missing or " +
          "cross-tenant id surfaces as a 404 for that lookup.",
        security: [{ bearerAuth: [] }],
        querystring: compareQueryJsonSchema,
        response: { 200: { type: "object" } },
      },
    },
    async (request, reply) => {
      const authUser = request.authUser;
      if (!authUser) throw Errors.unauthorized();

      const { productIds } = parseOrThrow<CompareQuery>(compareQuerySchema, request.query);
      const comparison = await compareProductsTool(authUser.organizationId, productIds);
      reply.send(ok({ comparison }));
    }
  );
}

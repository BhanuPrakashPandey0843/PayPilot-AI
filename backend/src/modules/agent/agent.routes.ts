import type { FastifyInstance } from "fastify";
import { requirePermission } from "../../middleware/authorize.js";
import { getAgentCatalog, agentSearch, getAgentRecommendations } from "./agent.service.js";
import {
  agentCatalogQuerySchema,
  agentCatalogQueryJsonSchema,
  agentSearchBodySchema,
  agentSearchBodyJsonSchema,
  agentProductIdParamsSchema,
  agentProductIdParamsJsonSchema,
  type AgentCatalogQuery,
  type AgentSearchBody,
  type AgentProductIdParams,
} from "./agent.schemas.js";
import { parseOrThrow } from "../../utils/validate.js";
import { ok } from "../../utils/response.js";
import { Errors } from "../../utils/errors.js";

const agentProductJsonSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    name: { type: "string" },
    description: { type: "string" },
    category: { type: "string" },
    tags: { type: "array", items: { type: "string" } },
    price: {
      type: "object",
      properties: {
        amount: { type: "integer", description: "Integer minor units, e.g. paise" },
        currency: { type: "string" },
        unit: { type: "string", enum: ["minor"] },
      },
    },
    availability: {
      type: "object",
      properties: {
        available: { type: "boolean" },
        inventoryQuantity: { type: "integer" },
      },
    },
    imageUrl: { type: "string" },
  },
} as const;

const agentCatalogResponseJsonSchema = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    // `data` is the array itself (route handlers call `ok(result.products,
    // result.meta)`, which puts the array directly in `data` and the
    // pagination info in the separate top-level `meta`) — NOT an object
    // wrapping a `products` key. Fastify serializes responses through this
    // schema (fast-json-stringify), so declaring the wrong shape here
    // silently mangles the real array into `{}` on the wire instead of
    // erroring at write time.
    data: { type: "array", items: agentProductJsonSchema },
    meta: {
      type: "object",
      properties: {
        page: { type: "integer" },
        limit: { type: "integer" },
        total: { type: "integer" },
        totalPages: { type: "integer" },
      },
    },
  },
} as const;

const agentRecommendationsResponseJsonSchema = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    data: {
      type: "object",
      properties: {
        product: agentProductJsonSchema,
        recommendations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              product: agentProductJsonSchema,
              type: { type: "string", enum: ["UPSELL", "CROSS_SELL"] },
              score: { type: "number" },
              reasons: { type: "array", items: { type: "string" } },
            },
          },
        },
      },
    },
  },
} as const;

/**
 * Agent-facing, machine-consumable catalog API. Every route here requires
 * the `ai.read` permission (read-only discovery — no financial state is
 * ever mutated through this namespace) and is organization-scoped through
 * the exact same authenticated-request path as the merchant routes: it
 * calls agent.service.ts, which calls products.service.ts, which calls
 * the organization-scoped repository. There is no separate DB access
 * path and no client-suppliable organizationId anywhere in this file.
 */
export async function agentCatalogRoutes(app: FastifyInstance) {
  // --- AGENT CATALOG (structured, sellable catalog) ---
  app.get(
    "",
    {
      onRequest: [app.authenticate],
      preHandler: [requirePermission("ai.read")],
      schema: {
        tags: ["Agent Catalog"],
        summary: "Machine-readable product catalog for an AI buying agent",
        description:
          "Returns the organization's sellable catalog in a structured shape (price as { amount, currency, unit }, " +
          "availability as { available, inventoryQuantity }). Supports the same search/category/price/tags/available/" +
          "sort/pagination filters as the merchant catalog endpoint. Defaults to active products only unless " +
          "`isActive=false` is explicitly requested.",
        security: [{ bearerAuth: [] }],
        querystring: agentCatalogQueryJsonSchema,
        response: { 200: agentCatalogResponseJsonSchema },
      },
    },
    async (request, reply) => {
      const authUser = request.authUser;
      if (!authUser) throw Errors.unauthorized();

      const query = parseOrThrow<AgentCatalogQuery>(agentCatalogQuerySchema, request.query);
      const { search, category, isActive, minPrice, maxPrice, available, tags, page, limit, sort, order } =
        query;

      const result = await getAgentCatalog(
        authUser.organizationId,
        {
          search,
          category,
          // A sellable catalog defaults to active-only; the merchant can
          // still explicitly ask for isActive=false to audit delisted items.
          isActive: isActive ?? true,
          minPrice,
          maxPrice,
          available,
          tags,
        },
        { page, limit },
        { sort, order }
      );
      reply.send(ok(result.products, result.meta));
    }
  );

  // --- AGENT SEARCH (structured intent) ---
  app.post(
    "/search",
    {
      onRequest: [app.authenticate],
      preHandler: [requirePermission("ai.read")],
      schema: {
        tags: ["Agent Catalog"],
        summary: "Deterministic, filter-driven product search for an AI buying agent",
        description:
          "Accepts a structured AgentSearchIntent (`query` + `filters`). `query` is matched the same way as the " +
          "merchant catalog's `search` param (name/description/category) — no LLM is involved in this milestone. " +
          "This endpoint is the seam a future AI-generated search intent plugs into without changing the catalog " +
          "service underneath. Only active, in-stock-or-not-per-filter products in the caller's organization are " +
          "ever returned.",
        security: [{ bearerAuth: [] }],
        body: agentSearchBodyJsonSchema,
        response: { 200: agentCatalogResponseJsonSchema },
      },
    },
    async (request, reply) => {
      const authUser = request.authUser;
      if (!authUser) throw Errors.unauthorized();

      const body = parseOrThrow<AgentSearchBody>(agentSearchBodySchema, request.body);
      const result = await agentSearch(authUser.organizationId, body);
      reply.send(ok(result.products, result.meta));
    }
  );

  // --- AGENT RECOMMENDATIONS (upsell / cross-sell foundation) ---
  app.get<{ Params: { productId: string } }>(
    "/:productId/recommendations",
    {
      onRequest: [app.authenticate],
      preHandler: [requirePermission("ai.read")],
      schema: {
        tags: ["Agent Catalog"],
        summary: "Explainable upsell/cross-sell recommendations for a product",
        description:
          "Deterministic, rule-based recommendations — no LLM/ML. UPSELL = same category, strictly higher price. " +
          "CROSS_SELL = shares at least one tag but is in a different category (an accessory, not a competitor). " +
          "Every recommended product is a real, active, in-stock, same-organization catalog row and every entry " +
          "carries a human-readable `reasons` array explaining why it was suggested.",
        security: [{ bearerAuth: [] }],
        params: agentProductIdParamsJsonSchema,
        response: { 200: agentRecommendationsResponseJsonSchema },
      },
    },
    async (request, reply) => {
      const authUser = request.authUser;
      if (!authUser) throw Errors.unauthorized();

      const { productId } = parseOrThrow<AgentProductIdParams>(agentProductIdParamsSchema, request.params);
      const result = await getAgentRecommendations(authUser.organizationId, productId);
      reply.send(ok(result));
    }
  );
}

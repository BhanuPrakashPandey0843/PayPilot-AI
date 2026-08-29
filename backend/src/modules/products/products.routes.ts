import type { FastifyInstance } from "fastify";
import { requirePermission } from "../../middleware/authorize.js";
import {
  listProductsForOrg,
  getProductForOrg,
  createProductForOrg,
  updateProductForOrg,
  deleteProductForOrg,
} from "./products.service.js";
import {
  createProductBodySchema,
  updateProductBodySchema,
  listProductsQuerySchema,
  productIdParamsSchema,
  createProductBodyJsonSchema,
  updateProductBodyJsonSchema,
  listProductsQueryJsonSchema,
  productIdParamsJsonSchema,
  type CreateProductBody,
  type UpdateProductBody,
  type ListProductsQuery,
} from "./products.schemas.js";
import { parseOrThrow } from "../../utils/validate.js";
import { ok } from "../../utils/response.js";
import { Errors } from "../../utils/errors.js";

const productResponseJsonSchema = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    data: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
        organizationId: { type: "string", format: "uuid" },
        name: { type: "string" },
        slug: { type: "string" },
        description: { type: "string" },
        category: { type: "string" },
        price: { type: "integer", description: "Integer minor units, e.g. paise" },
        currency: { type: "string" },
        inventoryQuantity: { type: "integer" },
        imageUrl: { type: "string" },
        isActive: { type: "boolean" },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" },
      },
    },
  },
} as const;

const productListResponseJsonSchema = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    data: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          organizationId: { type: "string", format: "uuid" },
          name: { type: "string" },
          slug: { type: "string" },
          description: { type: "string" },
          category: { type: "string" },
          price: { type: "integer" },
          currency: { type: "string" },
          inventoryQuantity: { type: "integer" },
          imageUrl: { type: "string" },
          isActive: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
    },
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

export async function productsRoutes(app: FastifyInstance) {
  // --- LIST ---
  app.get(
    "",
    {
      onRequest: [app.authenticate],
      preHandler: [requirePermission("catalog.read")],
      schema: {
        tags: ["Products / Catalog"],
        summary: "List products for the current organization (paginated, searchable)",
        security: [{ bearerAuth: [] }],
        querystring: listProductsQueryJsonSchema,
        response: { 200: productListResponseJsonSchema },
      },
    },
    async (request, reply) => {
      const authUser = request.authUser;
      if (!authUser) throw Errors.unauthorized();

      const query = parseOrThrow<ListProductsQuery>(listProductsQuerySchema, request.query);
      const { search, category, isActive, minPrice, maxPrice, available, tags, page, limit, sort, order } = query;

      const result = await listProductsForOrg(
        authUser.organizationId,
        { search, category, isActive, minPrice, maxPrice, available, tags },
        { page, limit },
        { sort, order }
      );
      reply.send(ok(result.rows, result.meta));
    }
  );

  // --- GET BY ID ---
  app.get<{ Params: { id: string } }>(
    "/:id",
    {
      onRequest: [app.authenticate],
      preHandler: [requirePermission("catalog.read")],
      schema: {
        tags: ["Products / Catalog"],
        summary: "Get a single product by ID within the current organization",
        security: [{ bearerAuth: [] }],
        params: productIdParamsJsonSchema,
        response: { 200: productResponseJsonSchema },
      },
    },
    async (request, reply) => {
      const authUser = request.authUser;
      if (!authUser) throw Errors.unauthorized();

      const { id } = parseOrThrow(productIdParamsSchema, request.params);
      const product = await getProductForOrg(authUser.organizationId, id);
      reply.send(ok(product));
    }
  );

  // --- CREATE ---
  app.post(
    "",
    {
      onRequest: [app.authenticate],
      preHandler: [requirePermission("catalog.create")],
      schema: {
        tags: ["Products / Catalog"],
        summary: "Create a new product within the current organization",
        security: [{ bearerAuth: [] }],
        body: createProductBodyJsonSchema,
        response: { 201: productResponseJsonSchema },
      },
    },
    async (request, reply) => {
      const authUser = request.authUser;
      if (!authUser) throw Errors.unauthorized();

      const body = parseOrThrow<CreateProductBody>(createProductBodySchema, request.body);
      const product = await createProductForOrg(authUser.organizationId, body);
      reply.code(201).send(ok(product));
    }
  );

  // --- UPDATE ---
  app.patch<{ Params: { id: string } }>(
    "/:id",
    {
      onRequest: [app.authenticate],
      preHandler: [requirePermission("catalog.update")],
      schema: {
        tags: ["Products / Catalog"],
        summary: "Update a product within the current organization",
        security: [{ bearerAuth: [] }],
        params: productIdParamsJsonSchema,
        body: updateProductBodyJsonSchema,
        response: { 200: productResponseJsonSchema },
      },
    },
    async (request, reply) => {
      const authUser = request.authUser;
      if (!authUser) throw Errors.unauthorized();

      const { id } = parseOrThrow(productIdParamsSchema, request.params);
      const body = parseOrThrow<UpdateProductBody>(updateProductBodySchema, request.body);
      const product = await updateProductForOrg(authUser.organizationId, id, body);
      reply.send(ok(product));
    }
  );

  // --- DELETE ---
  app.delete<{ Params: { id: string } }>(
    "/:id",
    {
      onRequest: [app.authenticate],
      preHandler: [requirePermission("catalog.delete")],
      schema: {
        tags: ["Products / Catalog"],
        summary: "Delete a product within the current organization",
        security: [{ bearerAuth: [] }],
        params: productIdParamsJsonSchema,
      },
    },
    async (request, reply) => {
      const authUser = request.authUser;
      if (!authUser) throw Errors.unauthorized();

      const { id } = parseOrThrow(productIdParamsSchema, request.params);
      const deleted = await deleteProductForOrg(authUser.organizationId, id);
      reply.send(ok({ id: deleted.id }));
    }
  );
}

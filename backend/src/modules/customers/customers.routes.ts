import type { FastifyInstance } from "fastify";
import { requirePermission } from "../../middleware/authorize.js";
import {
  listCustomersForOrg,
  getCustomerForOrg,
  createCustomerForOrg,
  updateCustomerForOrg,
} from "./customers.service.js";
import {
  createCustomerBodySchema,
  updateCustomerBodySchema,
  listCustomersQuerySchema,
  customerIdParamsSchema,
  createCustomerBodyJsonSchema,
  updateCustomerBodyJsonSchema,
  listCustomersQueryJsonSchema,
  customerIdParamsJsonSchema,
  type CreateCustomerBody,
  type UpdateCustomerBody,
  type ListCustomersQuery,
} from "./customers.schemas.js";
import { parseOrThrow } from "../../utils/validate.js";
import { ok } from "../../utils/response.js";
import { Errors } from "../../utils/errors.js";

const customerResponseJsonSchema = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    data: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
        organizationId: { type: "string", format: "uuid" },
        externalCustomerId: { type: "string" },
        name: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        status: { type: "string", enum: ["active", "inactive", "blocked"] },
        metadata: { type: "object" },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" },
      },
    },
  },
} as const;

const customerListResponseJsonSchema = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    data: {
      type: "array",
      items: customerResponseJsonSchema.properties.data,
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

export async function customersRoutes(app: FastifyInstance) {
  // --- LIST ---
  app.get(
    "",
    {
      onRequest: [app.authenticate],
      preHandler: [requirePermission("customers.read")],
      schema: {
        tags: ["Customers"],
        summary: "List customers for the current organization (paginated, searchable)",
        security: [{ bearerAuth: [] }],
        querystring: listCustomersQueryJsonSchema,
        response: { 200: customerListResponseJsonSchema },
      },
    },
    async (request, reply) => {
      const authUser = request.authUser;
      if (!authUser) throw Errors.unauthorized();

      const query = parseOrThrow<ListCustomersQuery>(listCustomersQuerySchema, request.query);
      const { search, status, page, limit } = query;

      const result = await listCustomersForOrg(
        authUser.organizationId,
        { search, status },
        { page, limit }
      );
      reply.send(ok(result.rows, result.meta));
    }
  );

  // --- GET BY ID ---
  app.get<{ Params: { id: string } }>(
    "/:id",
    {
      onRequest: [app.authenticate],
      preHandler: [requirePermission("customers.read")],
      schema: {
        tags: ["Customers"],
        summary: "Get a single customer by ID within the current organization",
        security: [{ bearerAuth: [] }],
        params: customerIdParamsJsonSchema,
        response: { 200: customerResponseJsonSchema },
      },
    },
    async (request, reply) => {
      const authUser = request.authUser;
      if (!authUser) throw Errors.unauthorized();

      const { id } = parseOrThrow(customerIdParamsSchema, request.params);
      const customer = await getCustomerForOrg(authUser.organizationId, id);
      reply.send(ok(customer));
    }
  );

  // --- CREATE ---
  app.post(
    "",
    {
      onRequest: [app.authenticate],
      preHandler: [requirePermission("customers.create")],
      schema: {
        tags: ["Customers"],
        summary: "Create a new customer within the current organization",
        security: [{ bearerAuth: [] }],
        body: createCustomerBodyJsonSchema,
        response: { 201: customerResponseJsonSchema },
      },
    },
    async (request, reply) => {
      const authUser = request.authUser;
      if (!authUser) throw Errors.unauthorized();

      const body = parseOrThrow<CreateCustomerBody>(createCustomerBodySchema, request.body);
      const customer = await createCustomerForOrg(authUser.organizationId, body);
      reply.code(201).send(ok(customer));
    }
  );

  // --- UPDATE ---
  app.patch<{ Params: { id: string } }>(
    "/:id",
    {
      onRequest: [app.authenticate],
      preHandler: [requirePermission("customers.update")],
      schema: {
        tags: ["Customers"],
        summary: "Update a customer within the current organization",
        security: [{ bearerAuth: [] }],
        params: customerIdParamsJsonSchema,
        body: updateCustomerBodyJsonSchema,
        response: { 200: customerResponseJsonSchema },
      },
    },
    async (request, reply) => {
      const authUser = request.authUser;
      if (!authUser) throw Errors.unauthorized();

      const { id } = parseOrThrow(customerIdParamsSchema, request.params);
      const body = parseOrThrow<UpdateCustomerBody>(updateCustomerBodySchema, request.body);
      const customer = await updateCustomerForOrg(authUser.organizationId, id, body);
      reply.send(ok(customer));
    }
  );
}

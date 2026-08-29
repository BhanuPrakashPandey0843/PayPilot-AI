import type { FastifyInstance } from "fastify";
import {
  registerBodySchema,
  registerBodyJsonSchema,
  loginBodySchema,
  loginBodyJsonSchema,
} from "./auth.schemas.js";
import { registerUser, loginUser, getMe } from "./auth.service.js";
import { parseOrThrow } from "../../utils/validate.js";
import { ok } from "../../utils/response.js";
import { Errors } from "../../utils/errors.js";

const authResponseSchema = {
  type: "object",
  properties: {
    success: { type: "boolean" },
    data: {
      type: "object",
      properties: {
        token: { type: "string" },
        user: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            email: { type: "string" },
            firstName: { type: "string" },
            lastName: { type: "string" },
          },
        },
        organization: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            slug: { type: "string" },
          },
        },
        role: { type: "string" },
      },
    },
  },
} as const;

export async function authRoutes(app: FastifyInstance) {
  app.post(
    "/register",
    {
      schema: {
        tags: ["Auth"],
        summary: "Register a new user, organization, and ORG_ADMIN membership",
        body: registerBodyJsonSchema,
        response: { 201: authResponseSchema },
      },
    },
    async (request, reply) => {
      const body = parseOrThrow(registerBodySchema, request.body);
      const result = await registerUser(app, body);
      reply.code(201).send(ok(result));
    }
  );

  app.post(
    "/login",
    {
      schema: {
        tags: ["Auth"],
        summary: "Log in with email and password",
        body: loginBodyJsonSchema,
        response: { 200: authResponseSchema },
      },
    },
    async (request, reply) => {
      const body = parseOrThrow(loginBodySchema, request.body);
      const result = await loginUser(app, body);
      reply.send(ok(result));
    }
  );

  app.get(
    "/me",
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ["Auth"],
        summary: "Get the current authenticated user, organization, and role",
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const authUser = request.authUser;
      if (!authUser) {
        throw Errors.unauthorized();
      }
      const result = await getMe(authUser.userId, authUser.organizationId);
      reply.send(ok(result));
    }
  );
}

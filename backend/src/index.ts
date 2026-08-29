import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import jwt from "@fastify/jwt";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";

import { env } from "./config/env.js";
import { registerAuthenticate } from "./middleware/authenticate.js";
import { AppError, Errors } from "./utils/errors.js";
import { fail } from "./utils/response.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { productsRoutes } from "./modules/products/products.routes.js";
import { customersRoutes } from "./modules/customers/customers.routes.js";
import { agentCatalogRoutes } from "./modules/agent/agent.routes.js";
import { commerceAgentRoutes } from "./modules/commerce-agent/commerce.routes.js";

async function buildServer() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "production" ? "info" : "debug",
    },
  });

  await app.register(helmet);
  await app.register(cors, { origin: env.CORS_ORIGIN, credentials: true });
  await app.register(jwt, {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: env.JWT_EXPIRES_IN,
    },
  });

  // Reusable `app.authenticate` onRequest hook — sets request.authUser
  registerAuthenticate(app);

  // --- Swagger (OpenAPI v3) ---
  await app.register(swagger, {
    openapi: {
      info: {
        title: "PayPilot AI API",
        description:
          "Backend API for PayPilot AI — AI Growth & Agentic Commerce. " +
          "Authenticate via POST /api/v1/auth/login to get a Bearer token, " +
          "then click Authorize (top-right) and paste: Bearer <token>.",
        version: "1.0.0",
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description:
              "JWT obtained from POST /api/v1/auth/login or POST /api/v1/auth/register. " +
              "Format: `Bearer <token>`",
          },
        },
      },
      // Tags appear in Swagger UI in this order.
      tags: [
        { name: "Auth", description: "Registration, login, and current user profile." },
        {
          name: "Products / Catalog",
          description:
            "Organization-scoped product catalog. All endpoints require authentication and a matching catalog.* permission.",
        },
        {
          name: "Customers",
          description:
            "Organization-scoped end customers (the business's own customers, not PayPilot users). " +
            "All endpoints require authentication and a matching customers.* permission.",
        },
        {
          name: "Agent Catalog",
          description:
            "Machine-readable, organization-scoped catalog for an AI buying agent: structured product data, " +
            "deterministic filter-driven search, and explainable upsell/cross-sell recommendations. Read-only " +
            "(no financial state is mutated here). Requires authentication and the ai.read permission.",
        },
        {
          name: "Commerce Agent",
          description:
            "Conversational AI shopping agent: intent extraction, conversation memory, product ranking, " +
            "explainable recommendations, policy checks, and order previews. Read-only — no payment is ever " +
            "executed here. Requires authentication and the ai.read permission.",
        },
      ],
    },
  });
  await app.register(swaggerUI, { routePrefix: "/docs" });

  // --- Global error handler ---
  // Translates AppError into the standard {success:false, error:{code,message,details?}}
  // envelope with the correct HTTP status. Anything NOT an AppError is a 500 and
  // we deliberately hide the real message from the client (logged server-side).
  app.setErrorHandler((err, _request, reply) => {
    if (err instanceof AppError) {
      reply.code(err.statusCode).send(fail(err.code, err.message, err.details));
      return;
    }

    // Zod validation errors from Fastify's built-in schema validator use a
    // different code path — catch ZodValidation-like wrappers here too.
    const anyErr = err as { statusCode?: number; validation?: unknown } | undefined;
    if (anyErr?.validation) {
      const code = anyErr?.statusCode === 400 ? "BAD_REQUEST" : "UNPROCESSABLE_ENTITY";
      const statusCode = anyErr?.statusCode && anyErr.statusCode >= 400 ? anyErr.statusCode : 422;
      reply.code(statusCode).send(fail(code, "Validation failed", anyErr.validation));
      return;
    }

    // Always log unexpected errors server-side.
    app.log.error({ err }, "Unhandled request error");

    reply.code(500).send(fail("INTERNAL_ERROR", "Something went wrong"));
  });

  // --- Not-found handler ---
  app.setNotFoundHandler((_request, reply) => {
    const notFound = Errors.notFound("Endpoint not found");
    reply.code(notFound.statusCode).send(fail(notFound.code, notFound.message));
  });

  // --- Health check (unauthenticated) ---
  app.get(
    "/health",
    {
      schema: {
        tags: ["Health"],
        summary: "Service health check (unauthenticated)",
      },
    },
    async () => ({ success: true, data: { status: "ok", uptime: process.uptime() } })
  );

  // --- Feature routes ---
  await app.register(authRoutes, { prefix: "/api/v1/auth" });
  await app.register(productsRoutes, { prefix: "/api/v1/products" });
  await app.register(customersRoutes, { prefix: "/api/v1/customers" });
  await app.register(agentCatalogRoutes, { prefix: "/api/v1/agent/catalog" });
  await app.register(commerceAgentRoutes, { prefix: "/api/v1/commerce" });

  return app;
}

async function start() {
  const app = await buildServer();
  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    app.log.info(`🚀 PayPilot AI backend listening on http://${env.HOST}:${env.PORT}`);
    app.log.info(`📚 API docs available at http://${env.HOST}:${env.PORT}/docs`);
    app.log.info(
      `🔒 Auth: POST /api/v1/auth/register  →  POST /api/v1/auth/login  →  GET /api/v1/auth/me`
    );
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();

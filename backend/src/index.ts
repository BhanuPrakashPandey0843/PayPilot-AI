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
import { checkoutRoutes } from "./modules/checkout/checkout.routes.js";
import { paymentRoutes } from "./modules/payments/payment.routes.js";
import { webhookRoutes } from "./modules/payments/webhook.routes.js";
import { auditRoutes } from "./modules/audit/audit.routes.js";
import { analyticsRoutes } from "./modules/analytics/analytics.routes.js";
import { revenueRoutes } from "./modules/revenue/revenue.routes.js";
import { copilotRoutes } from "./modules/copilot/copilot.routes.js";

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
        {
          name: "Checkout",
          description:
            "End-to-end test-mode checkout: policy-gated, inventory-safe, idempotent order + Razorpay order " +
            "creation, and payment signature verification. Requires authentication and the ai.execute permission " +
            "(never ai.read — this moves money). The AI agent never calls Razorpay directly; every checkout goes " +
            "through here.",
        },
        {
          name: "Payments",
          description:
            "Read-only payment records: single payment lookup and organization-scoped payment history. Requires " +
            "authentication and the payments.read permission.",
        },
        {
          name: "Webhooks",
          description:
            "Provider-initiated webhooks. Not protected by Bearer-JWT auth — protected instead by verifying the " +
            "provider's own request signature.",
        },
        {
          name: "Audit",
          description:
            "Organization-scoped audit trail of every AI action, checkout step, policy decision, payment " +
            "transition, and webhook event. Requires authentication and the audit.read permission.",
        },
        {
          name: "Analytics",
          description:
            "Organization-scoped revenue/order/payment analytics — deterministic, backend-calculated KPIs. " +
            "Requires authentication and the analytics.read permission.",
        },
        {
          name: "Revenue Opportunities",
          description:
            "Deterministically detected, evidence-backed revenue opportunities (cross-sell, upsell, payment " +
            "recovery, abandoned checkout, revenue drop) with transparent scoring and an approval gate. " +
            "Requires authentication and the analytics.read permission (approve/reject require ai.execute).",
        },
        {
          name: "AI Copilot",
          description:
            "Merchant-facing conversational copilot backed by a bounded, read-only tool layer over analytics " +
            "and revenue opportunities. Never invents numbers, never executes financial actions directly. " +
            "Requires authentication and the ai.read permission.",
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
  await app.register(checkoutRoutes, { prefix: "/api/v1/checkout" });
  await app.register(paymentRoutes, { prefix: "/api/v1/payments" });
  // Registered as its own encapsulated plugin (not nested under another
  // route file) so its route-local raw-body content parser (needed for
  // webhook signature verification) can never leak into any other route.
  await app.register(webhookRoutes, { prefix: "/api/v1/webhooks" });
  await app.register(auditRoutes, { prefix: "/api/v1/audit" });
  await app.register(analyticsRoutes, { prefix: "/api/v1/analytics" });
  await app.register(revenueRoutes, { prefix: "/api/v1/revenue" });
  await app.register(copilotRoutes, { prefix: "/api/v1/merchant/ai" });

  return app;
}

async function start() {
  try {
    const app = await buildServer();
    await app.listen({ port: env.PORT, host: env.HOST });
    app.log.info(`🚀 PayPilot AI backend listening on http://${env.HOST}:${env.PORT}`);
    app.log.info(`📚 API docs available at http://${env.HOST}:${env.PORT}/docs`);
    app.log.info(
      `🔒 Auth: POST /api/v1/auth/register  →  POST /api/v1/auth/login  →  GET /api/v1/auth/me`
    );
  } catch (err) {
    // buildServer() failures (bad config, plugin registration errors) land
    // here too now, not just app.listen() failures — previously buildServer()
    // was awaited outside this try/catch, so a failure there was an
    // unhandled promise rejection instead of a clean, logged exit.
    console.error("Failed to start PayPilot AI backend:", err);
    process.exit(1);
  }
}

void start();

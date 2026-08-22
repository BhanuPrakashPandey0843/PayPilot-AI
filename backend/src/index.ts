import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import jwt from "@fastify/jwt";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";

import { env } from "./config/env.js";

async function buildServer() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "production" ? "info" : "debug",
    },
  });

  await app.register(helmet);
  await app.register(cors, { origin: env.CORS_ORIGIN, credentials: true });
  await app.register(jwt, { secret: env.JWT_SECRET });

  await app.register(swagger, {
    openapi: {
      info: {
        title: "PayPilot AI API",
        description: "Backend API for PayPilot AI",
        version: "1.0.0",
      },
    },
  });
  await app.register(swaggerUI, { routePrefix: "/docs" });

  app.get("/health", async () => ({ status: "ok", uptime: process.uptime() }));

  // TODO: register feature routes here, e.g.
  // await app.register(merchantRoutes, { prefix: "/api/merchants" });

  return app;
}

async function start() {
  const app = await buildServer();
  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    app.log.info(`🚀 PayPilot AI backend listening on http://${env.HOST}:${env.PORT}`);
    app.log.info(`📚 API docs available at http://${env.HOST}:${env.PORT}/docs`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();

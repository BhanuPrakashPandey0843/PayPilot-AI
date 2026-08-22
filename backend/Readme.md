# PayPilot AI — Backend

Fastify + TypeScript API for PayPilot AI. Uses Postgres (via Drizzle ORM), Redis, JWT auth, and the Razorpay SDK for test-mode payments.

## Stack

- [Fastify](https://fastify.dev/) — HTTP server
- [Drizzle ORM](https://orm.drizzle.team/) + [`postgres`](https://github.com/porsager/postgres) — database access
- [ioredis](https://github.com/redis/ioredis) — Redis client
- [@fastify/jwt](https://github.com/fastify/fastify-jwt) — authentication
- [@fastify/swagger](https://github.com/fastify/fastify-swagger) + swagger-ui — API docs
- [Razorpay Node SDK](https://github.com/razorpay/razorpay-node) — payments
- [Zod](https://zod.dev/) — schema validation (including env var validation)

## Setup

```bash
npm install
cp .env.example .env
# edit .env with your local Postgres/Redis URLs and Razorpay test keys
npm run dev
```

The server starts on `http://localhost:4000` by default (configurable via `PORT` in `.env`). A health check is available at `GET /health`, and interactive API docs at `GET /docs`.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start the dev server with hot reload (`tsx watch`) |
| `npm run build` | Type-check and compile to `dist/` |
| `npm start` | Run the compiled server from `dist/` |
| `npm run typecheck` | Type-check without emitting output |
| `npm run db:generate` | Generate Drizzle migrations from your schema |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:studio` | Open Drizzle Studio |

## Current status / next steps

This package currently has:
- A working Fastify bootstrap (`src/index.ts`) with CORS, Helmet, JWT, and Swagger registered, plus a `/health` route.
- Env var validation (`src/config/env.ts`).

Not yet built (intentionally left out — these are product decisions rather than scaffolding fixes):
- Database schema and Drizzle config (`drizzle.config.ts`, `src/db/schema.ts`).
- Actual API routes (auth, merchant, catalog, checkout, agent endpoints).
- Razorpay integration logic.

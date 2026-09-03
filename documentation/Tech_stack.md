# Tech Stack



This document lists the technologies chosen for PayPilot AI and the reasoning behind each choice, based on the dependencies currently declared in `backend/package.json` and `frontend/package.json`.

## Backend

| Technology | Role | Why |
|---|---|---|
| **Fastify** | HTTP server / API framework | High-throughput, low-overhead Node.js framework with first-class TypeScript and schema-validation support — well suited to an API that needs to stay fast under agent-driven, high-frequency requests. |
| **TypeScript** | Language | Type safety across the API surface reduces runtime errors in a payments-adjacent system where correctness matters. |
| **Drizzle ORM + `postgres`** | Database access (PostgreSQL) | Drizzle gives typed, SQL-like queries without a heavy abstraction layer, keeping query behavior predictable — important for auditability of money-related operations. |
| **ioredis** | Caching / session / rate-limiting | Redis client for fast, ephemeral state (e.g. rate limiting, caching catalog data, short-lived session/agent context). |
| **@fastify/jwt** + **jsonwebtoken** | Authentication | Stateless token-based auth that scales horizontally and integrates directly into the Fastify request lifecycle. |
| **@fastify/helmet** | Security headers | Sensible default HTTP security headers with minimal configuration. |
| **@fastify/cors** | Cross-origin requests | Controlled access from the Next.js frontend (and any external agent callers) to the API. |
| **@fastify/swagger** + **@fastify/swagger-ui** | API documentation | Auto-generated, always-in-sync OpenAPI docs — useful both for human developers and for making the API "agent-readable," which is directly relevant to the agentic-commerce brief. |
| **bcrypt** | Password hashing | Industry-standard, battle-tested hashing for any stored credentials. |
| **Razorpay Node SDK** | Payments | Required integration target for the hackathon track — Razorpay test-mode APIs. |
| **Zod** | Validation | Runtime validation of request payloads and environment variables, sharing the same schema style across the codebase. |
| **dotenv** | Configuration | Loads environment variables from `.env` in local development. |

## Frontend

| Technology | Role | Why |
|---|---|---|
| **Next.js 16 (App Router)** | Framework | Server-side rendering and routing out of the box, strong TypeScript support, and the framework best documented for the kind of marketing + dashboard hybrid a merchant-facing product needs. |
| **TypeScript** | Language | Shared type discipline with the backend. |
| **Tailwind CSS v4** | Styling | Utility-first styling that keeps the design system consistent and fast to iterate on. |
| **shadcn/ui + Radix UI primitives** | Component library | Accessible, unstyled primitives (dialog, dropdown, tabs, tooltip) composed with Tailwind, giving full control over visual design while keeping accessibility correct by default. |
| **React Hook Form + Zod** | Forms | Performant form state management with schema-based validation shared conceptually with the backend's Zod usage. |
| **GSAP / Motion** | Animation | Rich, controllable animation for a polished, SaaS-grade marketing site (matches the Behance design reference). |
| **Recharts** | Data visualization | Charting for merchant-facing dashboards/analytics. |
| **Embla Carousel** | Carousels | Lightweight, dependency-free carousel for showcasing features/testimonials. |
| **Sonner** | Toast notifications | Lightweight, accessible toast/notification UI. |
| **lucide-react** | Icons | Consistent, tree-shakeable icon set that pairs naturally with shadcn/ui. |
| **next-themes** | Theming | Light/dark mode support. |

## Why this split (Fastify API + Next.js frontend)

Separating the API from the web app keeps the backend independently deployable and callable by non-browser clients — including AI buyer agents — rather than being coupled to server-rendered pages. This lines up with the hackathon goal of making the merchant "transactable end-to-end by an AI buyer": the same Fastify + Swagger API that powers the Next.js frontend can also be the agent-readable surface an external buying agent talks to.

*This document reflects the stack as scaffolded so far. Update it as new libraries are added or decisions change.*

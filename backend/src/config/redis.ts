/**
 * Lazy ioredis singleton (Milestone 5, Phase 24 — rate limiting).
 *
 * `ioredis` was already a declared dependency and REDIS_URL already
 * required at boot (see env.ts), but nothing in the codebase actually
 * connected to Redis or used it for anything — the .env.example comment
 * literally said "Reserved for future catalog caching + rate-limiting;
 * not yet wired into routes." This file is that wiring.
 *
 * Lazily constructed for the same reason razorpay.client.ts's client is
 * lazy: importing this module (transitively, through middleware/rateLimit.ts)
 * must never crash the process at import time — only an actual attempt to
 * use Redis should fail, and it should fail in a way that never blocks a
 * real request (see middleware/rateLimit.ts's fail-open behavior).
 */
import { Redis } from "ioredis";
import { env } from "./env.js";

let client: Redis | null = null;

export function getRedisClient(): Redis {
  if (client) return client;
  client = new Redis(env.REDIS_URL, {
    // Rate limiting must never make the app hang waiting for Redis to
    // come back — a handful of fast retries, then middleware/rateLimit.ts
    // fails open (see its doc comment) rather than blocking requests.
    maxRetriesPerRequest: 1,
    retryStrategy: (times: number) => (times > 3 ? null : Math.min(times * 100, 500)),
    lazyConnect: true,
  });
  client.on("error", (err: Error) => {
    // Never let an unhandled Redis error crash the process — rate
    // limiting is a defense-in-depth layer, not a critical dependency.
    console.error("[redis] connection error (rate limiting will fail open):", err.message);
  });
  return client;
}

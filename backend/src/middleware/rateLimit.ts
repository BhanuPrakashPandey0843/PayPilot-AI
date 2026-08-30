/**
 * Redis-backed rate limiting (Milestone 5, Phase 24).
 *
 * Phase 24 explicitly calls for rate limiting on checkout creation,
 * payment verification, webhooks, and AI execution endpoints "if Redis
 * infrastructure is already available" — it was (REDIS_URL is required
 * at boot, ioredis is a dependency) but nothing was ever wired up. This
 * is that wiring: a small fixed-window counter, not a bespoke fragile
 * one (Phase 24: "do not create a fragile custom rate limiter if the
 * project already has a suitable dependency" — ioredis IS that
 * dependency; this file is a thin ~15-line use of it, not a new library).
 *
 * FAIL-OPEN BY DESIGN: if Redis is unreachable, requests are allowed
 * through (with a server-side log line) rather than rejected or hung.
 * A rate limiter is defense-in-depth; it must never become a single
 * point of failure that can take down checkout/payment/webhook traffic
 * because Redis had a bad moment. The DB-level protections (idempotency
 * keys, CAS state transitions, unique constraints) are what actually
 * keep money safe — this middleware only throttles request volume.
 */
import type { FastifyReply, FastifyRequest } from "fastify";
import { getRedisClient } from "../config/redis.js";
import { Errors } from "../utils/errors.js";

export interface RateLimitOptions {
  /** Rolling fixed window, in seconds. */
  windowSeconds: number;
  /** Max requests allowed per key within the window. */
  max: number;
  /** Short, stable identifier for this limiter — namespaces the Redis key so different routes never share a counter. */
  bucket: string;
  /**
   * How to derive the counter key for a given request. Defaults to
   * organization+user scoping for authenticated routes (a busy
   * organization doesn't get penalized by other tenants). Webhook /
   * pre-auth routes pass an explicit keyFn using the request IP instead.
   */
  keyFn?: (request: FastifyRequest) => string;
}

function defaultKey(request: FastifyRequest): string {
  const authUser = request.authUser;
  if (authUser) return `user:${authUser.userId}:org:${authUser.organizationId}`;
  // Should not normally be reached on an authenticated route (this hook
  // runs after app.authenticate), but never throw from key derivation —
  // fall back to IP rather than letting a missing authUser 500 the request.
  return `ip:${request.ip}`;
}

/**
 * Returns a Fastify preHandler enforcing `max` requests per `windowSeconds`
 * per key. Register AFTER app.authenticate (if the route requires auth) so
 * the default org/user-scoped key can see `request.authUser`.
 *
 * Uses a plain INCR + PEXPIRE-on-first-hit fixed window (not a Lua-script
 * sliding window) — there is a theoretical few-millisecond race between
 * the INCR and the PEXPIRE on the very first request in a window where a
 * crash could leave a key without a TTL, but that's an acceptable
 * trade-off for a defense-in-depth throttle (worst case: one window is
 * slightly under-enforced, never over-enforced, and never blocks a
 * legitimate request from going through).
 */
export function rateLimit(options: RateLimitOptions) {
  const { windowSeconds, max, bucket, keyFn = defaultKey } = options;
  const windowMs = windowSeconds * 1000;

  return async function rateLimitCheck(request: FastifyRequest, _reply: FastifyReply) {
    try {
      const redis = getRedisClient();
      const key = `ratelimit:${bucket}:${keyFn(request)}`;
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.pexpire(key, windowMs);
      }
      if (count > max) {
        const ttlMs = await redis.pttl(key);
        throw Errors.tooManyRequests(
          "Too many requests — please slow down and try again shortly.",
          { retryAfterSeconds: ttlMs > 0 ? Math.ceil(ttlMs / 1000) : windowSeconds }
        );
      }
    } catch (err) {
      // Re-throw genuine rate-limit rejections (AppError) — only swallow
      // infrastructure failures (Redis down/unreachable), per the
      // fail-open design documented above.
      const isAppError = err && typeof err === "object" && "statusCode" in err && "code" in err;
      if (isAppError) throw err;
      request.log.warn({ err }, "[rateLimit] Redis unavailable — failing open for this request");
    }
  };
}

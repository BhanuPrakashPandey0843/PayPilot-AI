/**
 * Conversation memory store (Phase 3).
 *
 * Uses Redis (the `ioredis` client already in package.json — no new
 * dependency) when it's reachable, and transparently falls back to an
 * in-process Map otherwise. This is deliberately best-effort:
 *   - Redis connection is attempted lazily on first use, with a short
 *     connect timeout and NO auto-retry — a misconfigured/unreachable
 *     REDIS_URL degrades to in-memory instantly instead of hanging every
 *     request or crashing the process.
 *   - The in-memory fallback means sessions do NOT survive a process
 *     restart and are NOT shared across multiple server instances. Fine
 *     for a single-process hackathon deployment; the Redis path is what
 *     makes this correct in production once REDIS_URL is reachable.
 *
 * Every key is namespaced by organizationId — a session ID alone is
 * never enough to read another organization's conversation state.
 */
import { Redis } from "ioredis";
import { env } from "../../config/env.js";
import { CONVERSATION_TTL_SECONDS } from "./constants.js";
import type { ConversationSession } from "./types.js";

let redisClient: Redis | null = null;
let redisReady = false;
let redisAttempted = false;

function getRedisClient(): Redis | null {
  if (redisAttempted) return redisClient;
  redisAttempted = true;
  try {
    redisClient = new Redis(env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      connectTimeout: 1500,
      retryStrategy: () => null, // never auto-retry — fall back to memory instead of hanging
    });
    // ioredis throws an unhandled error if 'error' has no listener at all.
    redisClient.on("error", () => {
      redisReady = false;
    });
  } catch {
    redisClient = null;
  }
  return redisClient;
}

async function withRedis<T>(fn: (client: Redis) => Promise<T>): Promise<T | undefined> {
  const client = getRedisClient();
  if (!client) return undefined;
  try {
    if (!redisReady) {
      await client.connect();
      redisReady = true;
    }
    return await fn(client);
  } catch {
    redisReady = false;
    return undefined;
  }
}

// In-memory fallback store: key -> { session, expiresAt }.
const memoryStore = new Map<string, { session: ConversationSession; expiresAt: number }>();

function memoryKey(organizationId: string, sessionId: string): string {
  return `commerce:session:${organizationId}:${sessionId}`;
}

function pruneExpired(): void {
  const now = Date.now();
  for (const [key, entry] of memoryStore) {
    if (entry.expiresAt < now) memoryStore.delete(key);
  }
}

export function createEmptySession(
  organizationId: string,
  userId: string,
  sessionId: string
): ConversationSession {
  return {
    sessionId,
    organizationId,
    userId,
    cart: [],
    messages: [],
    updatedAt: new Date().toISOString(),
  };
}

export async function getSession(
  organizationId: string,
  sessionId: string
): Promise<ConversationSession | null> {
  const key = memoryKey(organizationId, sessionId);

  const fromRedis = await withRedis(async (client) => {
    const raw = await client.get(key);
    return raw ? (JSON.parse(raw) as ConversationSession) : null;
  });
  if (fromRedis !== undefined) return fromRedis;

  pruneExpired();
  const entry = memoryStore.get(key);
  return entry ? entry.session : null;
}

export async function saveSession(session: ConversationSession): Promise<void> {
  session.updatedAt = new Date().toISOString();
  const key = memoryKey(session.organizationId, session.sessionId);
  const serialized = JSON.stringify(session);

  const wroteToRedis = await withRedis(async (client) => {
    await client.set(key, serialized, "EX", CONVERSATION_TTL_SECONDS);
    return true;
  });
  if (wroteToRedis) return;

  memoryStore.set(key, { session, expiresAt: Date.now() + CONVERSATION_TTL_SECONDS * 1000 });
}

export async function deleteSession(organizationId: string, sessionId: string): Promise<void> {
  const key = memoryKey(organizationId, sessionId);
  await withRedis(async (client) => {
    await client.del(key);
    return true;
  });
  memoryStore.delete(key);
}



import "dotenv/config";
import { z } from "zod";

/**
 * Validates and exposes environment variables.
 * Add new variables here as the app grows so missing config
 * fails fast at boot instead of causing obscure runtime errors.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default("0.0.0.0"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),

  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),

  // Optional at the env-schema level so the app can still boot (and the
  // automated test suite, which mocks Razorpay entirely, can still run)
  // without real Razorpay credentials configured. Checkout/payment/webhook
  // routes fail closed with a clear 500 (see razorpay.client.ts) rather
  // than silently no-oping if these are missing at the moment they're
  // actually needed.
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  // HMAC secret configured on the Razorpay Dashboard webhook settings
  // page — NOT the same as RAZORPAY_KEY_SECRET. Used only to verify
  // POST /api/v1/webhooks/razorpay signatures.
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  // JWT access token lifetime, e.g. "15m", "1h", "7d".
  JWT_EXPIRES_IN: z.string().default("7d"),

  CORS_ORIGIN: z.string().default("http://localhost:3000"),

  // --- Milestone 6: AI provider abstraction (src/modules/ai/) ---
  // Both optional by design (Phase 12 — AI failure handling): with neither
  // set, ai/provider.ts falls back to a deterministic template explainer
  // instead of failing to boot or throwing at request time. Set AT MOST
  // one of these in a given environment; if both are set, ANTHROPIC_API_KEY
  // wins (see ai/provider.ts `resolveProvider`).
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default("claude-sonnet-4-6"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),

  // Abandoned-checkout / conversion-drop / payment-recovery thresholds —
  // documented, configurable constants per the spec's "deterministic and
  // documented" requirement (see revenue.engine.ts for where these are
  // consumed).
  ABANDONED_CHECKOUT_THRESHOLD_MINUTES: z.coerce.number().int().positive().default(180),
  REVENUE_DROP_THRESHOLD_PERCENT: z.coerce.number().positive().default(10),
  MIN_CROSS_SELL_SAMPLE_SIZE: z.coerce.number().int().positive().default(5),

  // Phase 9 policy engine — the maximum estimatedRevenueImpact (integer minor
  // units) a revenue opportunity may have and still be auto-executable via
  // POST /api/v1/revenue/opportunities/:id/execute. An APPROVED opportunity
  // above this limit is BLOCKED by the policy engine (see
  // modules/revenue/action-policy.service.ts) — the merchant can still see
  // and approve it, but must act on it manually. Default ₹1,00,000.
  REVENUE_ACTION_MAX_AMOUNT_MINOR: z.coerce.number().int().nonnegative().default(100_000 * 100),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables — see backend/.env.example");
}

export const env = parsed.data;

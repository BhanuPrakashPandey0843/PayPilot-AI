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
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables — see backend/.env.example");
}

export const env = parsed.data;

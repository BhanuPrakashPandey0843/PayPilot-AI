/**
 * Razorpay webhook receiver (Phase 10). Registered as its OWN
 * encapsulated Fastify plugin (see index.ts: `app.register(webhookRoutes,
 * { prefix: "/api/v1/webhooks" })`) specifically so the raw-body content
 * parser below applies ONLY to this route, not the rest of the app.
 *
 * NOT protected by the normal `app.authenticate` Bearer-JWT hook —
 * Razorpay itself is the caller, not a logged-in PayPilot user. Instead,
 * every request must carry a valid `X-Razorpay-Signature` header, HMAC
 * verified against RAZORPAY_WEBHOOK_SECRET and the EXACT raw bytes of the
 * request body (see razorpay.client.ts). The webhook body is NEVER
 * trusted until that check passes.
 */
import type { FastifyInstance } from "fastify";
import { createHash } from "node:crypto";
import { db } from "../../db/index.js";
import { razorpayGateway, isRazorpayWebhookConfigured } from "./razorpay.client.js";
import { emitAudit } from "../../utils/audit.js";
import { ok, fail } from "../../utils/response.js";
import { rateLimit } from "../../middleware/rateLimit.js";
import {
  getPaymentAttemptByProviderOrderId,
} from "./payment.repository.js";
import {
  captureAttempt,
  failAttempt,
  transitionAttempt,
  recordWebhookEventOnce,
  finishWebhookEvent,
} from "./payment.service.js";

declare module "fastify" {
  interface FastifyRequest {
    rawBody?: Buffer;
  }
}

interface RazorpayPaymentEntity {
  id: string;
  order_id: string;
  status: string;
  amount: number;
  currency: string;
  error_code?: string | null;
  error_description?: string | null;
}

interface RazorpayWebhookPayload {
  id?: string;
  event: string;
  created_at?: number;
  payload?: {
    payment?: { entity: RazorpayPaymentEntity };
  };
}

export async function webhookRoutes(app: FastifyInstance) {
  // Captures the EXACT raw bytes Razorpay sent (needed for HMAC
  // signature verification — re-serializing the parsed object with
  // JSON.stringify is not guaranteed to reproduce the identical byte
  // sequence Razorpay signed), while still handing Fastify a normally
  // parsed JSON object for `request.body`. Scoped to this plugin only —
  // Fastify plugin registration is encapsulated by default, so this does
  // not affect JSON parsing anywhere else in the app.
  app.addContentTypeParser("application/json", { parseAs: "buffer" }, (request, body, done) => {
    const buf = body as Buffer;
    request.rawBody = buf;
    try {
      done(null, buf.length ? JSON.parse(buf.toString("utf8")) : {});
    } catch (err) {
      done(err as Error, undefined);
    }
  });

  app.post(
    "/razorpay",
    {
      // Keyed by source IP, not org/user (there is no authenticated user
      // on this route — the caller is Razorpay itself). A generous ceiling:
      // this must never throttle away legitimate Razorpay delivery traffic
      // (a busy account can fire many events in a burst), it only exists to
      // cap outright abuse/flooding of an unauthenticated public endpoint.
      preHandler: [rateLimit({ bucket: "webhook-razorpay", windowSeconds: 60, max: 300, keyFn: (request) => `ip:${request.ip}` })],
      schema: {
        tags: ["Webhooks"],
        summary: "Razorpay webhook receiver",
        description:
          "Handles payment.authorized / payment.captured / payment.failed. NOT protected by Bearer-JWT auth — " +
          "protected by X-Razorpay-Signature HMAC verification against RAZORPAY_WEBHOOK_SECRET and the raw " +
          "request body instead. Configure this exact URL on the Razorpay Dashboard under Settings > Webhooks. " +
          "Always responds 200 once the signature check passes (even for event types this system doesn't act on, " +
          "or for a duplicate redelivery), so Razorpay stops retrying a delivery we've already durably recorded.",
      },
    },
    async (request, reply) => {
      const signatureHeader = request.headers["x-razorpay-signature"];
      const rawBody = request.rawBody ?? Buffer.from(JSON.stringify(request.body ?? {}));

      emitAudit({
        type: "WEBHOOK_RECEIVED",
        actor: { actorType: "SYSTEM" },
        target: { kind: "webhook_event" },
        context: { hasSignatureHeader: typeof signatureHeader === "string" },
      });

      if (!isRazorpayWebhookConfigured()) {
        request.log.error("Razorpay webhook received but RAZORPAY_WEBHOOK_SECRET is not configured");
        reply.code(500).send(fail("INTERNAL_ERROR", "Webhook receiver is not configured on this server"));
        return;
      }

      const signature = typeof signatureHeader === "string" ? signatureHeader : undefined;
      if (!signature || !razorpayGateway.verifyWebhookSignature(rawBody, signature)) {
        emitAudit({
          type: "WEBHOOK_SIGNATURE_INVALID",
          actor: { actorType: "SYSTEM" },
          target: { kind: "webhook_event" },
          context: {},
        });
        reply.code(401).send(fail("UNAUTHORIZED", "Invalid webhook signature"));
        return;
      }

      const parsed = request.body as RazorpayWebhookPayload;
      const eventType = parsed.event;
      const paymentEntity = parsed.payload?.payment?.entity;

      // Razorpay webhook bodies don't reliably carry a single top-level
      // event id across API versions — derive a stable, deterministic id
      // from fields that ARE guaranteed present, so redeliveries of the
      // SAME underlying event always hash to the SAME idempotency key.
      const eventId =
        parsed.id ??
        createHash("sha256")
          .update(`${eventType}:${paymentEntity?.id ?? ""}:${paymentEntity?.status ?? ""}:${parsed.created_at ?? ""}`)
          .digest("hex");

      const claim = await recordWebhookEventOnce({
        provider: "razorpay",
        eventId,
        eventType,
        payload: parsed as unknown as Record<string, unknown>,
      });

      if (!claim.claimed) {
        emitAudit({
          type: "WEBHOOK_DUPLICATE_IGNORED",
          actor: { actorType: "SYSTEM" },
          target: { kind: "webhook_event", extras: { eventId, eventType } },
          context: {},
        });
        reply.code(200).send(ok({ received: true, duplicate: true }));
        return;
      }

      try {
        await handleWebhookEvent(eventType, paymentEntity);
        await finishWebhookEvent(claim.id!, "PROCESSED");
      } catch (err) {
        await finishWebhookEvent(claim.id!, "FAILED");
        emitAudit({
          type: "WEBHOOK_PROCESSING_FAILED",
          actor: { actorType: "SYSTEM" },
          target: { kind: "webhook_event", extras: { eventId, eventType } },
          context: { error: err instanceof Error ? err.message : "unknown error" },
        });
        // Still 200: the event IS durably recorded (status FAILED, visible
        // via GET /api/v1/audit) for investigation/replay. A non-2xx here
        // would just make Razorpay retry a delivery whose failure was on
        // OUR side, potentially forever, without fixing anything.
        reply.code(200).send(ok({ received: true, processed: false }));
        return;
      }

      reply.code(200).send(ok({ received: true, processed: true }));
    }
  );
}

async function handleWebhookEvent(eventType: string, paymentEntity?: RazorpayPaymentEntity): Promise<void> {
  if (!paymentEntity) return; // event types we don't act on (e.g. order.paid) — acknowledged, no-op

  await db.transaction(async (tx) => {
    // Fetched INSIDE the transaction, immediately before use — not before
    // db.transaction() opens. A fetch taken before the transaction starts
    // can go stale (e.g. /verify-payment captures this exact attempt in
    // the gap between the pre-transaction read and this callback running),
    // and passing that stale object into transitionAttempt/captureAttempt/
    // failAttempt would have them reason from a status the row no longer
    // has. payment.service.ts's compare-and-swap is the final backstop,
    // but reading fresh here keeps that CAS miss the rare exception
    // instead of the routine case (and avoids Razorpay-order-not-found
    // fetching "attempt" as a variable name that isn't scoped to tx).
    const attempt = await getPaymentAttemptByProviderOrderId(paymentEntity.order_id, tx);
    if (!attempt) return; // not a Razorpay order this system created (different account/env) — nothing to do

    switch (eventType) {
      case "payment.authorized":
        if (attempt.status === "pending") {
          await transitionAttempt(
            tx,
            attempt,
            "authorized",
            { providerPaymentId: paymentEntity.id },
            { actorType: "SYSTEM" }
          );
        }
        break;
      case "payment.captured":
        await captureAttempt(tx, attempt, paymentEntity.id, { actorType: "SYSTEM" });
        break;
      case "payment.failed":
        await failAttempt(
          tx,
          attempt,
          paymentEntity.error_code ?? null,
          paymentEntity.error_description ?? null,
          { actorType: "SYSTEM" }
        );
        break;
      default:
      // Unhandled event type (Phase 10: "at minimum support the payment
      // lifecycle required by the current implementation") — acknowledged,
      // no state change.
    }
  });
}

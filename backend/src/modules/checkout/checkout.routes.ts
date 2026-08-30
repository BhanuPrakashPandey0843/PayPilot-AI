/**
 * Checkout API (Phase 18). Both endpoints require authentication AND the
 * `ai.execute` permission — never `ai.read` (Rule 4 / Phase 2): reading
 * the catalog and spending money are different permission tiers.
 */
import type { FastifyInstance } from "fastify";
import { requirePermission } from "../../middleware/authorize.js";
import { rateLimit } from "../../middleware/rateLimit.js";
import { Errors } from "../../utils/errors.js";
import { ok } from "../../utils/response.js";
import { parseOrThrow } from "../../utils/validate.js";
import {
  createCheckoutOrderBodySchema,
  createCheckoutOrderBodyJsonSchema,
  checkoutOrderResponseJsonSchema,
  verifyPaymentBodySchema,
  verifyPaymentBodyJsonSchema,
  verifyPaymentResponseJsonSchema,
  type CreateCheckoutOrderBody,
  type VerifyPaymentBody,
} from "./checkout.schemas.js";
import { createCheckoutOrder, verifyCheckoutPayment } from "./checkout.service.js";

export async function checkoutRoutes(app: FastifyInstance) {
  app.post(
    "/create-order",
    {
      onRequest: [app.authenticate],
      preHandler: [requirePermission("ai.execute"), rateLimit({ bucket: "checkout-create", windowSeconds: 60, max: 20 })],
      schema: {
        tags: ["Checkout"],
        summary: "Create a Razorpay Test Mode order for the current cart and start checkout",
        description:
          "Server calculates the amount from the cart on the session (never trusts a client-supplied amount). " +
          "Runs the policy engine, atomically reserves inventory, creates an internal order + payment attempt, " +
          "and creates the corresponding Razorpay order. Idempotent: retrying the same logical checkout (same " +
          "idempotencyKey, or the same session+cart+customer if none is supplied) returns the existing in-flight " +
          "checkout instead of creating a duplicate Razorpay order. Requires ai.execute (not ai.read) — this is a " +
          "money-moving action, not a read.",
        security: [{ bearerAuth: [] }],
        body: createCheckoutOrderBodyJsonSchema,
        response: { 200: checkoutOrderResponseJsonSchema },
      },
    },
    async (request, reply) => {
      const authUser = request.authUser;
      if (!authUser) throw Errors.unauthorized();

      const body = parseOrThrow<CreateCheckoutOrderBody>(createCheckoutOrderBodySchema, request.body);

      const result = await createCheckoutOrder(
        {
          organizationId: authUser.organizationId,
          sessionId: body.sessionId,
          customerId: body.customerId,
          idempotencyKey: body.idempotencyKey,
        },
        { userId: authUser.userId, actorType: "USER" }
      );

      reply.send(ok(result));
    }
  );

  app.post(
    "/verify-payment",
    {
      onRequest: [app.authenticate],
      preHandler: [requirePermission("ai.execute"), rateLimit({ bucket: "checkout-verify", windowSeconds: 60, max: 30 })],
      schema: {
        tags: ["Checkout"],
        summary: "Verify a completed Razorpay Checkout payment",
        description:
          "Verifies the Razorpay payment signature server-side using RAZORPAY_KEY_SECRET — never trusts a " +
          "success status, amount, or organization id reported by the client. On success, marks the order paid " +
          "(idempotent against a webhook that races or arrives first).",
        security: [{ bearerAuth: [] }],
        body: verifyPaymentBodyJsonSchema,
        response: { 200: verifyPaymentResponseJsonSchema },
      },
    },
    async (request, reply) => {
      const authUser = request.authUser;
      if (!authUser) throw Errors.unauthorized();

      const body = parseOrThrow<VerifyPaymentBody>(verifyPaymentBodySchema, request.body);

      const result = await verifyCheckoutPayment(
        {
          organizationId: authUser.organizationId,
          razorpayOrderId: body.razorpayOrderId,
          razorpayPaymentId: body.razorpayPaymentId,
          razorpaySignature: body.razorpaySignature,
        },
        { userId: authUser.userId, actorType: "USER" }
      );

      reply.send(ok(result));
    }
  );
}

/**
 * Milestone 6 Phase 7/8 — bounded action EXECUTION for a merchant-approved
 * revenue opportunity.
 *
 * HARD RULE: this module never invents a result. Every outcome below is
 * either a real, verifiable backend operation (a fresh Razorpay order
 * prepared through the exact same checkout.service.ts code path that
 * already powers buyer-initiated checkout/retry) or an honest "skipped"
 * entry explaining why nothing could be done — never a fabricated
 * success (Rule 12/13).
 *
 * IMPORTANT SCOPE NOTE: no payment gateway lets a merchant unilaterally
 * charge a buyer without the buyer completing an authorization step
 * (entering card/UPI details, approving in their banking app). So
 * "execute" here means PREPARE, exactly as the spec's own example says
 * ("ACTION: Prepare a recovery attempt. APPROVAL: Merchant approval
 * required before execution.") — it produces a fresh, live Razorpay
 * order/payment link the buyer can complete, it does not move money by
 * itself. That's a correct fintech boundary, not a shortcut.
 *
 * Only opportunity types whose recommendedAction.actionType is in
 * action-policy.service.ts's EXECUTABLE_ACTION_TYPES ever reach this
 * module — the policy engine blocks everything else before this runs.
 */
import { getMostRecentFailedOrderForCustomer, getOrderByIdScoped } from "../orders/orders.repository.js";
import { retryCheckoutOrder, ensureActivePaymentLinkForOrder, type ActorInfo } from "../checkout/checkout.service.js";
import type { RevenueOpportunity } from "../../db/schema/revenue_opportunities.js";
import type { RecommendedAction } from "./revenue.types.js";

export interface ExecutionOutcome {
  ok: boolean;
  summary: string;
  details: Record<string, unknown>;
}

export async function executeRecommendedAction(
  opportunity: RevenueOpportunity,
  actor: ActorInfo
): Promise<ExecutionOutcome> {
  const action = opportunity.recommendedAction as unknown as RecommendedAction;

  switch (action.actionType) {
    case "review_failed_payments":
      return executePaymentRecovery(opportunity.organizationId, action, actor);
    case "follow_up_abandoned_checkout":
      return executeAbandonedCheckoutRecovery(opportunity.organizationId, action, actor);
    default:
      // The policy engine (action-policy.service.ts) must have already
      // BLOCKED execution for any other actionType — reaching here would
      // be a bug elsewhere, not a case to silently paper over.
      throw new Error(`Action type "${action.actionType}" has no execution handler in this system.`);
  }
}

interface PaymentRecoveryResult {
  customerId: string;
  status: "prepared" | "skipped";
  orderId?: string;
  razorpayOrderId?: string;
  reason?: string;
}

async function executePaymentRecovery(
  organizationId: string,
  action: RecommendedAction,
  actor: ActorInfo
): Promise<ExecutionOutcome> {
  const customerIds = action.targetCustomerIds ?? [];
  const results: PaymentRecoveryResult[] = [];

  for (const customerId of customerIds) {
    const order = await getMostRecentFailedOrderForCustomer(organizationId, customerId);
    if (!order) {
      results.push({
        customerId,
        status: "skipped",
        reason: "No failed order found for this customer — it may already have been recovered or paid.",
      });
      continue;
    }
    try {
      // Reuses checkout.service.ts's own failed-order retry path
      // verbatim: re-validates + re-reserves inventory, creates a new
      // payment attempt against the SAME order, and creates a fresh
      // Razorpay order for it. Never a second order, never a duplicate
      // charge.
      const checkoutResult = await retryCheckoutOrder(order, actor);
      results.push({
        customerId,
        status: "prepared",
        orderId: checkoutResult.orderId,
        razorpayOrderId: checkoutResult.razorpayOrderId,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error preparing the recovery attempt.";
      results.push({ customerId, status: "skipped", orderId: order.id, reason: message });
    }
  }

  const prepared = results.filter((r) => r.status === "prepared");
  const ok = prepared.length > 0;
  return {
    ok,
    summary: ok
      ? `Prepared ${prepared.length} of ${customerIds.length} recovery payment attempt(s) — each has a fresh Razorpay order the customer can complete.`
      : `Could not prepare any recovery attempts for ${customerIds.length} customer(s) — no eligible failed orders were found, or the payment provider is unavailable. See details for the reason per customer.`,
    details: { results },
  };
}

interface AbandonedCheckoutResult {
  orderId: string;
  status: "prepared" | "skipped";
  razorpayOrderId?: string;
  reason?: string;
}

async function executeAbandonedCheckoutRecovery(
  organizationId: string,
  action: RecommendedAction,
  actor: ActorInfo
): Promise<ExecutionOutcome> {
  const orderIds = action.targetOrderIds ?? [];
  const results: AbandonedCheckoutResult[] = [];

  for (const orderId of orderIds) {
    const order = await getOrderByIdScoped(organizationId, orderId);
    if (!order) {
      results.push({ orderId, status: "skipped", reason: "Order not found." });
      continue;
    }
    if (order.status !== "pending") {
      results.push({ orderId, status: "skipped", reason: `Order is now "${order.status}" — no longer abandoned.` });
      continue;
    }
    try {
      const attempt = await ensureActivePaymentLinkForOrder(order, actor);
      results.push({ orderId, status: "prepared", razorpayOrderId: attempt.providerOrderId ?? undefined });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error preparing the payment link.";
      results.push({ orderId, status: "skipped", reason: message });
    }
  }

  const prepared = results.filter((r) => r.status === "prepared");
  const ok = prepared.length > 0;
  return {
    ok,
    summary: ok
      ? `Prepared a live payment link for ${prepared.length} of ${orderIds.length} abandoned order(s), ready to send to the customer.`
      : `Could not prepare a payment link for any of ${orderIds.length} abandoned order(s) — they may already be resolved, or the payment provider is unavailable. See details for the reason per order.`,
    details: { results },
  };
}

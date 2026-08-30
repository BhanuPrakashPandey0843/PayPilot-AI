/**
 * Milestone 6 Phase 9 — deterministic policy engine for revenue-opportunity
 * ACTION EXECUTION (POST /api/v1/revenue/opportunities/:id/execute).
 *
 * Mirrors the same design language as commerce-agent/policy.service.ts
 * (a list of named, human-readable checks, each PASS or FAIL) but is
 * intentionally a SEPARATE module: that engine gates "is this cart valid
 * to check out", this one gates "is it safe to auto-execute this
 * already-merchant-approved revenue action". Nothing here is decided by
 * an LLM (Rule 9/11) — every check is a single traceable rule.
 *
 * The overall decision is ALLOWED only if every check PASSes; otherwise
 * BLOCKED with a human-readable `reason` built from the failing checks,
 * matching the exact ALLOWED/BLOCKED + Reason shape the spec asks for.
 */
import { env } from "../../config/env.js";
import type { RevenueOpportunity } from "../../db/schema/revenue_opportunities.js";
import type { RecommendedAction } from "./revenue.types.js";

/**
 * The only recommendedAction.actionType values this system can actually
 * carry out server-side without a human doing something outside this
 * codebase (sending an email, applying a manual discount, etc.). Every
 * other action type is a genuine recommendation the merchant must act on
 * themselves — this engine BLOCKS execution for those rather than
 * fabricating a result (Rule 12/13).
 */
const EXECUTABLE_ACTION_TYPES: ReadonlySet<RecommendedAction["actionType"]> = new Set([
  "review_failed_payments",
  "follow_up_abandoned_checkout",
]);

export interface ActionPolicyCheck {
  name: string;
  status: "PASS" | "FAIL";
  message: string;
}

export interface ActionPolicyResult {
  decision: "ALLOWED" | "BLOCKED";
  reason: string;
  checks: ActionPolicyCheck[];
}

export function evaluateExecutionPolicy(opportunity: RevenueOpportunity): ActionPolicyResult {
  const checks: ActionPolicyCheck[] = [];
  const action = (opportunity.recommendedAction as unknown as RecommendedAction | null) ?? null;

  // --- STATUS: must be APPROVED (a human already made the call) ---------
  if (opportunity.status === "APPROVED") {
    checks.push({ name: "STATUS_APPROVED", status: "PASS", message: "Opportunity has been approved by a merchant." });
  } else {
    checks.push({
      name: "STATUS_APPROVED",
      status: "FAIL",
      message: `Opportunity status is "${opportunity.status}" — must be "APPROVED" before it can be executed.`,
    });
  }

  // --- EXPIRY -------------------------------------------------------------
  if (opportunity.expiresAt && opportunity.expiresAt.getTime() < Date.now()) {
    checks.push({
      name: "NOT_EXPIRED",
      status: "FAIL",
      message: `This approval expired at ${opportunity.expiresAt.toISOString()}.`,
    });
  } else {
    checks.push({ name: "NOT_EXPIRED", status: "PASS", message: "Approval has not expired." });
  }

  // --- ACTION TYPE SUPPORTED ----------------------------------------------
  if (action && EXECUTABLE_ACTION_TYPES.has(action.actionType)) {
    checks.push({
      name: "ACTION_TYPE_EXECUTABLE",
      status: "PASS",
      message: `Action type "${action.actionType}" has an automated execution path in this system.`,
    });
  } else {
    checks.push({
      name: "ACTION_TYPE_EXECUTABLE",
      status: "FAIL",
      message: action
        ? `Action type "${action.actionType}" has no automated execution in this system — it requires manual merchant follow-up (e.g. surfacing a recommendation in the storefront).`
        : "This opportunity has no recommended action recorded to execute.",
    });
  }

  // --- AMOUNT LIMIT ---------------------------------------------------------
  if (opportunity.estimatedRevenueImpact <= env.REVENUE_ACTION_MAX_AMOUNT_MINOR) {
    checks.push({
      name: "WITHIN_AMOUNT_LIMIT",
      status: "PASS",
      message: `Estimated impact (${opportunity.estimatedRevenueImpact}) is within the configured maximum (${env.REVENUE_ACTION_MAX_AMOUNT_MINOR} minor units).`,
    });
  } else {
    checks.push({
      name: "WITHIN_AMOUNT_LIMIT",
      status: "FAIL",
      message: `Estimated impact (${opportunity.estimatedRevenueImpact}) exceeds the configured maximum auto-execution amount (${env.REVENUE_ACTION_MAX_AMOUNT_MINOR} minor units, REVENUE_ACTION_MAX_AMOUNT_MINOR). This opportunity must be actioned manually.`,
    });
  }

  const failed = checks.filter((c) => c.status === "FAIL");
  if (failed.length > 0) {
    return { decision: "BLOCKED", reason: failed.map((c) => c.message).join(" "), checks };
  }
  return { decision: "ALLOWED", reason: "All policy checks passed.", checks };
}

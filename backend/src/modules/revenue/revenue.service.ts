import { emitAudit } from "../../utils/audit.js";
import { Errors } from "../../utils/errors.js";
import { detectAllOpportunities, scoreOpportunity } from "./revenue.engine.js";
import { evaluateExecutionPolicy } from "./action-policy.service.js";
import { executeRecommendedAction } from "./revenue.execution.js";
import {
  upsertOpportunity,
  listOpportunitiesForOrg,
  getOpportunityByIdScoped,
  updateOpportunityStatus,
  casTransitionOpportunityExecution,
  type OpportunityFilters,
  type Pagination,
} from "./revenue.repository.js";
import type { RevenueOpportunity } from "../../db/schema/revenue_opportunities.js";

/**
 * Runs every detector for an organization and persists (upserts) each
 * result. This is the only place a `revenue_opportunities` row is
 * written — the copilot/AI layer never writes here directly (Phase 6/7).
 *
 * No scheduler exists in this codebase yet, so this is exposed as an
 * on-demand endpoint (POST /api/v1/revenue/detect) rather than a cron
 * job — safe to call repeatedly (upsert semantics never duplicate rows).
 */
export async function runDetectionForOrg(organizationId: string): Promise<RevenueOpportunity[]> {
  const detected = await detectAllOpportunities(organizationId);
  const persisted: RevenueOpportunity[] = [];

  for (const opp of detected) {
    const { score, confidence } = scoreOpportunity({
      estimatedImpactMinor: opp.estimatedRevenueImpactMinor,
      sampleSize: opp.sampleSize,
      mostRecentEvidenceAt: opp.mostRecentEvidenceAt,
      severity: opp.severity,
    });

    const row = await upsertOpportunity(organizationId, {
      type: opp.type,
      dedupeKey: opp.dedupeKey,
      title: opp.title,
      description: opp.description,
      severity: opp.severity,
      score,
      confidence,
      estimatedRevenueImpact: opp.estimatedRevenueImpactMinor,
      currency: opp.currency,
      evidence: opp.evidence as unknown as Record<string, unknown>,
      recommendedAction: opp.recommendedAction as unknown as Record<string, unknown>,
    });
    persisted.push(row);

    emitAudit({
      type: "REVENUE_OPPORTUNITY_CREATED",
      actor: { organizationId, actorType: "SYSTEM" },
      target: { kind: "revenue_opportunity", id: row.id, extras: { type: row.type, score: row.score } },
      context: { dedupeKey: row.dedupeKey },
    });
  }

  return persisted;
}

export async function listOpportunities(
  organizationId: string,
  filters: OpportunityFilters,
  pagination: Pagination,
  sorting: { sort: "score" | "createdAt" | "estimatedRevenueImpact"; order: "asc" | "desc" }
) {
  return listOpportunitiesForOrg(organizationId, filters, pagination, sorting);
}

export async function getOpportunity(organizationId: string, id: string, actor: { userId: string; roleId: string; role: string }) {
  const row = await getOpportunityByIdScoped(organizationId, id);
  if (!row) throw Errors.notFound("Revenue opportunity not found");

  emitAudit({
    type: "REVENUE_OPPORTUNITY_VIEWED",
    actor: { userId: actor.userId, organizationId, roleId: actor.roleId, role: actor.role },
    target: { kind: "revenue_opportunity", id: row.id },
    context: {},
  });

  return row;
}

/**
 * Approves an opportunity. This only transitions status OPEN -> APPROVED
 * and records who/when — it deliberately does NOT itself execute the
 * recommended action. Actually running it (Phase 8's "bounded action"
 * step) is a separate, policy-gated, opportunity-type-specific operation
 * — see executeOpportunity() below and modules/revenue/action-policy.service.ts /
 * revenue.execution.ts — reachable only via POST .../:id/execute, never
 * automatically on approval.
 */
export async function approveOpportunity(
  organizationId: string,
  id: string,
  actor: { userId: string; roleId: string; role: string }
) {
  const existing = await getOpportunityByIdScoped(organizationId, id);
  if (!existing) throw Errors.notFound("Revenue opportunity not found");
  if (existing.status !== "OPEN") {
    throw Errors.conflict(`Cannot approve an opportunity in status "${existing.status}" (must be OPEN).`);
  }

  const row = await updateOpportunityStatus(organizationId, id, {
    status: "APPROVED",
    approvedBy: actor.userId,
    approvedAt: new Date(),
  });
  if (!row) throw Errors.notFound("Revenue opportunity not found");

  emitAudit({
    type: "REVENUE_OPPORTUNITY_APPROVED",
    actor: { userId: actor.userId, organizationId, roleId: actor.roleId, role: actor.role },
    target: { kind: "revenue_opportunity", id: row.id, extras: { type: row.type } },
    context: {},
  });

  return row;
}

export async function rejectOpportunity(
  organizationId: string,
  id: string,
  reason: string | undefined,
  actor: { userId: string; roleId: string; role: string }
) {
  const existing = await getOpportunityByIdScoped(organizationId, id);
  if (!existing) throw Errors.notFound("Revenue opportunity not found");
  if (existing.status !== "OPEN") {
    throw Errors.conflict(`Cannot reject an opportunity in status "${existing.status}" (must be OPEN).`);
  }

  const row = await updateOpportunityStatus(organizationId, id, {
    status: "REJECTED",
    rejectedReason: reason ?? null,
  });
  if (!row) throw Errors.notFound("Revenue opportunity not found");

  emitAudit({
    type: "REVENUE_OPPORTUNITY_REJECTED",
    actor: { userId: actor.userId, organizationId, roleId: actor.roleId, role: actor.role },
    target: { kind: "revenue_opportunity", id: row.id, extras: { type: row.type, reason: reason ?? null } },
    context: {},
  });

  return row;
}

/**
 * Milestone 6 Phase 7/8/9 — executes an APPROVED opportunity's
 * recommendedAction: APPROVED -> EXECUTING -> EXECUTED|FAILED.
 *
 * Every step is audited (Phase 10 — "what did the AI recommend, why, who
 * approved it, what was executed, what happened" must all be answerable
 * from the audit trail alone). The AI is never in this call path at all
 * — a human already approved the opportunity via a separate endpoint,
 * and this function is only ever invoked by an authenticated route
 * handler gated on the `ai.execute` permission (Rule 6/7/8).
 */
export async function executeOpportunity(
  organizationId: string,
  id: string,
  actor: { userId: string; roleId: string; role: string }
): Promise<RevenueOpportunity> {
  const existing = await getOpportunityByIdScoped(organizationId, id);
  if (!existing) throw Errors.notFound("Revenue opportunity not found");

  // Idempotency guard (Rule 14) — never re-run the action body for an
  // opportunity that's already executing or already reached a terminal
  // execution state. Report the real state instead of silently no-oping.
  if (existing.status === "EXECUTING") {
    throw Errors.conflict("This opportunity's action is already executing.");
  }
  if (existing.status === "EXECUTED" || existing.status === "FAILED") {
    throw Errors.conflict(
      `This opportunity's action was already executed (status "${existing.status}"). Re-run detection to get a fresh opportunity rather than re-executing this one.`
    );
  }

  const policy = evaluateExecutionPolicy(existing);
  emitAudit({
    type: "REVENUE_ACTION_POLICY_CHECKED",
    actor: { userId: actor.userId, organizationId, roleId: actor.roleId, role: actor.role },
    target: { kind: "revenue_opportunity", id: existing.id, extras: { type: existing.type, decision: policy.decision } },
    context: { checks: policy.checks },
  });

  if (policy.decision === "BLOCKED") {
    emitAudit({
      type: "AI_ACTION_FAILED",
      actor: { userId: actor.userId, organizationId, roleId: actor.roleId, role: actor.role },
      target: { kind: "revenue_opportunity", id: existing.id, extras: { type: existing.type, reason: "policy_blocked" } },
      context: { reason: policy.reason, checks: policy.checks },
    });
    throw Errors.unprocessable(policy.reason, { checks: policy.checks });
  }

  emitAudit({
    type: "AI_ACTION_APPROVAL_REQUESTED",
    actor: { userId: actor.userId, organizationId, roleId: actor.roleId, role: actor.role },
    target: { kind: "revenue_opportunity", id: existing.id, extras: { type: existing.type } },
    context: { reason: "Policy checks passed; beginning execution." },
  });

  // CAS APPROVED -> EXECUTING. If this misses, another request already
  // won the race (or the row changed underneath us) — report the real
  // current state rather than double-running the action.
  const executing = await casTransitionOpportunityExecution(organizationId, id, "APPROVED", { status: "EXECUTING" });
  if (!executing) {
    const fresh = await getOpportunityByIdScoped(organizationId, id);
    throw Errors.conflict(
      `This opportunity is no longer in "APPROVED" status (now "${fresh?.status ?? "unknown"}") — it may already be executing.`
    );
  }

  try {
    const outcome = await executeRecommendedAction(executing, { userId: actor.userId, actorType: "USER" });
    const finalStatus: "EXECUTED" | "FAILED" = outcome.ok ? "EXECUTED" : "FAILED";

    const finalRow = await casTransitionOpportunityExecution(organizationId, id, "EXECUTING", {
      status: finalStatus,
      executedBy: actor.userId,
      executedAt: new Date(),
      executionResult: outcome.details,
      executionFailureReason: outcome.ok ? null : outcome.summary,
    });

    emitAudit({
      type: outcome.ok ? "AI_ACTION_EXECUTED" : "AI_ACTION_FAILED",
      actor: { userId: actor.userId, organizationId, roleId: actor.roleId, role: actor.role },
      target: { kind: "revenue_opportunity", id, extras: { type: existing.type, ok: outcome.ok } },
      context: { reason: outcome.summary },
    });

    if (!finalRow) throw Errors.internal("Execution completed but the opportunity's status could not be updated.");
    return finalRow;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown execution error.";
    const finalRow = await casTransitionOpportunityExecution(organizationId, id, "EXECUTING", {
      status: "FAILED",
      executedBy: actor.userId,
      executedAt: new Date(),
      executionFailureReason: message,
    });

    emitAudit({
      type: "AI_ACTION_FAILED",
      actor: { userId: actor.userId, organizationId, roleId: actor.roleId, role: actor.role },
      target: { kind: "revenue_opportunity", id, extras: { type: existing.type } },
      context: { reason: message },
    });

    if (!finalRow) throw Errors.internal("Execution failed and the opportunity's status could not be updated.");
    return finalRow;
  }
}

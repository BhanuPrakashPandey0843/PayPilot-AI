import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { organizations } from "../../db/schema/organizations.js";
import { Errors } from "../../utils/errors.js";
import { emitAudit } from "../../utils/audit.js";
import type { UpdateOrganizationBody } from "./organizations.schemas.js";
import type { AuthUser } from "../../types/auth.js";

export async function getOrganizationForOrg(organizationId: string) {
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1);

  if (!org) {
    // Should be unreachable for an authenticated request (the JWT's
    // organizationId came from a real membership row), but fail
    // explicitly rather than silently returning undefined.
    throw Errors.notFound("Organization not found");
  }
  return org;
}

export async function updateOrganizationForOrg(
  actor: AuthUser,
  body: UpdateOrganizationBody
) {
  const before = await getOrganizationForOrg(actor.organizationId);

  const updateData: Partial<{ name: string; currency: string; timezone: string }> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.currency !== undefined) updateData.currency = body.currency;
  if (body.timezone !== undefined) updateData.timezone = body.timezone;

  // Bare .returning() (no column-selection argument) - same pattern as
  // customers.repository.ts's updateCustomerScoped, the proven
  // precedent for a Drizzle update-and-return in this codebase. Returns
  // every organizations column (including `metadata`); the extra field
  // is harmless since neither this function's nor its callers' return
  // types are asserted narrower than what's actually returned.
  const [updated] = await db
    .update(organizations)
    .set({ ...updateData, updatedAt: new Date() })
    .where(eq(organizations.id, actor.organizationId))
    .returning();

  if (!updated) {
    throw Errors.notFound("Organization not found");
  }

  emitAudit({
    type: "ORGANIZATION_UPDATED",
    actor: {
      userId: actor.userId,
      organizationId: actor.organizationId,
      roleId: actor.roleId,
      role: actor.role,
    },
    target: { kind: "organization", id: actor.organizationId },
    context: {
      before: { name: before.name, currency: before.currency, timezone: before.timezone },
      after: { name: updated.name, currency: updated.currency, timezone: updated.timezone },
    },
  });

  return updated;
}

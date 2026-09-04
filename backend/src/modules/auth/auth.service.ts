import { randomUUID } from "node:crypto";
import { eq, and } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { db } from "../../db/index.js";
import { users } from "../../db/schema/users.js";
import { organizations } from "../../db/schema/organizations.js";
import { organizationMembers } from "../../db/schema/organization_members.js";
import { roles } from "../../db/schema/roles.js";
import { hashPassword, verifyPassword } from "../../utils/password.js";
import { Errors } from "../../utils/errors.js";
import { emitAudit } from "../../utils/audit.js";
import type { RegisterBody, LoginBody } from "./auth.schemas.js";
import type { JwtPayload } from "../../types/auth.js";

const ORG_ADMIN_ROLE_NAME = "ORG_ADMIN";

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const suffix = randomUUID().slice(0, 8);
  return `${base || "org"}-${suffix}`;
}

interface AuthResult {
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  role: string;
}

export async function registerUser(app: FastifyInstance, body: RegisterBody): Promise<AuthResult> {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, body.email))
    .limit(1);

  if (existing.length > 0) {
    throw Errors.conflict("An account with this email already exists");
  }

  const [adminRole] = await db
    .select({ id: roles.id, name: roles.name })
    .from(roles)
    .where(eq(roles.name, ORG_ADMIN_ROLE_NAME))
    .limit(1);

  if (!adminRole) {
    // Seed hasn't been run — this is a server misconfiguration, not a
    // client error.
    throw Errors.internal("ORG_ADMIN role is not seeded. Run `npm run db:seed` first.");
  }

  const passwordHash = await hashPassword(body.password);

  const result = await db.transaction(async (tx) => {
    const [organization] = await tx
      .insert(organizations)
      .values({ name: body.organizationName, slug: slugify(body.organizationName) })
      .returning({ id: organizations.id, name: organizations.name, slug: organizations.slug });

    const [user] = await tx
      .insert(users)
      .values({
        email: body.email,
        passwordHash,
        firstName: body.firstName,
        lastName: body.lastName,
        status: "active",
      })
      .returning({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
      });

    await tx.insert(organizationMembers).values({
      organizationId: organization.id,
      userId: user.id,
      roleId: adminRole.id,
      status: "active",
    });

    return { organization, user };
  });

  const payload: JwtPayload = {
    sub: result.user.id,
    organizationId: result.organization.id,
    roleId: adminRole.id,
    role: adminRole.name,
  };
  const token = app.jwt.sign(payload);

  emitAudit({
    type: "ORGANIZATION_CREATED",
    actor: null,
    target: { kind: "organization", id: result.organization.id, extras: { slug: result.organization.slug } },
    context: { email: body.email, name: body.organizationName },
  });
  emitAudit({
    type: "USER_REGISTERED",
    actor: { userId: result.user.id, organizationId: result.organization.id, roleId: adminRole.id, role: adminRole.name },
    target: { kind: "user", id: result.user.id },
    context: { registration: true },
  });

  return {
    token,
    user: result.user,
    organization: result.organization,
    role: adminRole.name,
  };
}

export async function loginUser(app: FastifyInstance, body: LoginBody): Promise<AuthResult> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, body.email))
    .limit(1);

  // Same generic error whether the email doesn't exist or the password is
  // wrong — never reveal which one it was.
  const genericInvalid = () => Errors.unauthorized("Invalid email or password");

  if (!user) {
    emitAudit({
      type: "USER_LOGIN_FAILED",
      actor: null,
      context: { email: body.email, reason: "unknown_email" },
    });
    throw genericInvalid();
  }

  const passwordValid = await verifyPassword(body.password, user.passwordHash);
  if (!passwordValid) {
    emitAudit({
      type: "USER_LOGIN_FAILED",
      actor: { userId: user.id },
      context: { email: body.email, reason: "bad_password" },
    });
    throw genericInvalid();
  }

  if (user.status !== "active") {
    emitAudit({
      type: "USER_LOGIN_INACTIVE",
      actor: { userId: user.id },
      context: { email: body.email, status: user.status },
    });
    throw Errors.forbidden("This account is not active");
  }

  const [membership] = await db
    .select({
      organizationId: organizationMembers.organizationId,
      roleId: organizationMembers.roleId,
      status: organizationMembers.status,
    })
    .from(organizationMembers)
    .where(and(eq(organizationMembers.userId, user.id), eq(organizationMembers.status, "active")))
    .limit(1);

  if (!membership) {
    emitAudit({
      type: "USER_LOGIN_NO_MEMBERSHIP",
      actor: { userId: user.id },
      context: { email: body.email },
    });
    throw Errors.forbidden("This account has no active organization membership");
  }

  const [organization] = await db
    .select({ id: organizations.id, name: organizations.name, slug: organizations.slug })
    .from(organizations)
    .where(eq(organizations.id, membership.organizationId))
    .limit(1);

  const [role] = await db
    .select({ id: roles.id, name: roles.name })
    .from(roles)
    .where(eq(roles.id, membership.roleId))
    .limit(1);

  if (!organization || !role) {
    throw Errors.internal("Account data is inconsistent");
  }

  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

  emitAudit({
    type: "USER_LOGIN_SUCCESS",
    actor: { userId: user.id, organizationId: organization.id, roleId: role.id, role: role.name },
    target: { kind: "user", id: user.id },
    context: { organizationId: organization.id, role: role.name },
  });

  const payload: JwtPayload = {
    sub: user.id,
    organizationId: organization.id,
    roleId: role.id,
    role: role.name,
  };
  const token = app.jwt.sign(payload);

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    organization,
    role: role.name,
  };
}

export async function getMe(userId: string, organizationId: string) {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      status: users.status,
      lastLoginAt: users.lastLoginAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw Errors.notFound("User not found");
  }

  const [membership] = await db
    .select({ roleId: organizationMembers.roleId })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.organizationId, organizationId)
      )
    )
    .limit(1);

  const [organization] = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      status: organizations.status,
      currency: organizations.currency,
      timezone: organizations.timezone,
    })
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1);

  const role = membership
    ? await db
        .select({ id: roles.id, name: roles.name })
        .from(roles)
        .where(eq(roles.id, membership.roleId))
        .limit(1)
        .then((rows) => rows[0])
    : undefined;

  emitAudit({
    type: "USER_VIEWED_ME",
    actor: { userId, organizationId, roleId: role?.id, role: role?.name },
    target: { kind: "user", id: userId },
    context: {},
  });

  return { user, organization, role };
}

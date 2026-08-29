/**
 * IDEMPOTENT SEED SCRIPT — roles, permissions, role_permissions,
 * and optional DEMO DATA for the fictional merchant "Velocity Run".
 *
 * Safe to run any number of times: every insert targets a column that
 * already has a UNIQUE constraint at the database level (roles.name,
 * permissions.name, role_permissions PK, organizations.slug,
 * users.email, products.org+slug, customers.org+external_customer_id),
 * and uses `.onConflictDoNothing()` — so re-running this never creates
 * duplicates and never errors on a second run.
 *
 * Demo data is gated behind the `SEED_DEMO=1` env var:
 *
 *   SEED_DEMO=1 npm run db:seed
 *
 * Without it, only roles/permissions/role_permissions are seeded, which
 * is what production and automated tests want.
 *
 * Run from the backend/ directory:
 *
 *   npm run db:seed             # roles + permissions only
 *   SEED_DEMO=1 npm run db:seed # + "Velocity Run" demo merchant data
 */
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { db } from "../src/db/index.js";
import { roles } from "../src/db/schema/roles.js";
import { permissions } from "../src/db/schema/permissions.js";
import { rolePermissions } from "../src/db/schema/role_permissions.js";
import { organizations } from "../src/db/schema/organizations.js";
import { users } from "../src/db/schema/users.js";
import { organizationMembers } from "../src/db/schema/organization_members.js";
import { products } from "../src/db/schema/products.js";
import { customers } from "../src/db/schema/customers.js";
import { hashPassword } from "../src/utils/password.js";

// ---------------------------------------------------------------------
// Phase 1 — roles + permissions + role_permissions
// ---------------------------------------------------------------------

const ROLE_NAMES = ["ORG_ADMIN", "OPERATIONS", "FINANCE", "SUPPORT", "VIEWER"] as const;
type RoleName = (typeof ROLE_NAMES)[number];

const ROLE_DESCRIPTIONS: Record<RoleName, string> = {
  ORG_ADMIN: "Full access to everything within the organization.",
  OPERATIONS: "Manages catalog, orders, and customers day-to-day.",
  FINANCE: "Manages payments, refunds, and financial visibility.",
  SUPPORT: "Read-focused, with limited customer updates for support tasks.",
  VIEWER: "Read-only access across the organization.",
};

const PERMISSION_DEFS: Record<string, string> = {
  "organizations.read": "View organization details.",
  "organizations.update": "Update organization settings.",

  "users.read": "View users and members.",
  "users.create": "Invite/create users.",
  "users.update": "Update user details.",

  "customers.read": "View customers.",
  "customers.create": "Create customers.",
  "customers.update": "Update customers.",

  "catalog.read": "View products in the catalog.",
  "catalog.create": "Create products.",
  "catalog.update": "Update products.",
  "catalog.delete": "Delete products.",

  "orders.read": "View orders.",
  "orders.create": "Create orders.",
  "orders.update": "Update orders.",

  "payments.read": "View payments and payment attempts.",
  "payments.create": "Create/initiate payments.",
  "payments.refund": "Refund payments.",

  "ai.read": "View AI agent activity and recommendations.",
  "ai.execute": "Allow the AI agent to take controlled actions (e.g. checkout).",

  "audit.read": "View the audit trail.",
};

/** Which permissions each role gets. ORG_ADMIN always gets everything. */
const ROLE_PERMISSIONS: Record<RoleName, string[]> = {
  ORG_ADMIN: Object.keys(PERMISSION_DEFS),
  OPERATIONS: [
    "organizations.read",
    "users.read",
    "customers.read",
    "customers.create",
    "customers.update",
    "catalog.read",
    "catalog.create",
    "catalog.update",
    "catalog.delete",
    "orders.read",
    "orders.create",
    "orders.update",
    "payments.read",
    "payments.create",
    "ai.read",
    "ai.execute",
    "audit.read",
  ],
  FINANCE: [
    "organizations.read",
    "users.read",
    "customers.read",
    "orders.read",
    "payments.read",
    "payments.create",
    "payments.refund",
    "audit.read",
  ],
  SUPPORT: [
    "organizations.read",
    "users.read",
    "customers.read",
    "customers.update",
    "catalog.read",
    "orders.read",
    "payments.read",
    "audit.read",
  ],
  VIEWER: [
    "organizations.read",
    "users.read",
    "customers.read",
    "catalog.read",
    "orders.read",
    "payments.read",
    "audit.read",
  ],
};

async function seedRoles() {
  await db
    .insert(roles)
    .values(ROLE_NAMES.map((name) => ({ name, description: ROLE_DESCRIPTIONS[name] })))
    .onConflictDoNothing({ target: roles.name });

  const rows = await db
    .select({ id: roles.id, name: roles.name })
    .from(roles)
    .where(inArray(roles.name, [...ROLE_NAMES]));

  const map = new Map<string, string>();
  for (const r of rows) map.set(r.name, r.id);
  return map;
}

async function seedPermissions() {
  const names = Object.keys(PERMISSION_DEFS);

  await db
    .insert(permissions)
    .values(names.map((name) => ({ name, description: PERMISSION_DEFS[name] })))
    .onConflictDoNothing({ target: permissions.name });

  const rows = await db
    .select({ id: permissions.id, name: permissions.name })
    .from(permissions)
    .where(inArray(permissions.name, names));

  const map = new Map<string, string>();
  for (const r of rows) map.set(r.name, r.id);
  return map;
}

async function seedRolePermissions(
  roleIdByName: Map<string, string>,
  permissionIdByName: Map<string, string>
) {
  const rowsToInsert: { roleId: string; permissionId: string }[] = [];

  for (const roleName of ROLE_NAMES) {
    const roleId = roleIdByName.get(roleName);
    if (!roleId) {
      throw new Error(`Seed inconsistency: role "${roleName}" was not created/found.`);
    }
    for (const permissionName of ROLE_PERMISSIONS[roleName]) {
      const permissionId = permissionIdByName.get(permissionName);
      if (!permissionId) {
        throw new Error(
          `Seed inconsistency: permission "${permissionName}" was not created/found.`
        );
      }
      rowsToInsert.push({ roleId, permissionId });
    }
  }

  if (rowsToInsert.length > 0) {
    await db
      .insert(rolePermissions)
      .values(rowsToInsert)
      .onConflictDoNothing({ target: [rolePermissions.roleId, rolePermissions.permissionId] });
  }
}

// ---------------------------------------------------------------------
// Phase 2 — (optional) Velocity Run demo data
// ---------------------------------------------------------------------

const SEED_DEMO = process.env.SEED_DEMO === "1" || process.env.SEED_DEMO === "true";

const DEMO_ORG_SLUG = "velocity-run-demo";
const DEMO_ADMIN_EMAIL = "admin@velocityrun.example";
const DEMO_ADMIN_PASSWORD = "VelocityRun2026!";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

interface DemoProductSeed {
  name: string;
  description: string;
  category: string;
  /** Price in INR (rupees) — converted to paise integer before insert. */
  priceRupees: number;
  inventoryQuantity: number;
  imageUrl?: string;
}

const DEMO_PRODUCTS: DemoProductSeed[] = [
  {
    name: "Velocity Run X",
    description:
      "Everyday running shoe with responsive midsole cushioning and breathable mesh upper. Built for 5K to half-marathon distances.",
    category: "Running Shoes",
    priceRupees: 4799,
    inventoryQuantity: 42,
  },
  {
    name: "Velocity Run Pro",
    description:
      "Premium carbon-plate racing shoe for competitive runners. Ultra-lightweight upper with energy-return foam for race-day PB attempts.",
    category: "Running Shoes",
    priceRupees: 6499,
    inventoryQuantity: 18,
  },
  {
    name: "Performance Socks",
    description:
      "Moisture-wicking running socks with reinforced heel/toe and arch compression. Sold per pair (one-size fits most).",
    category: "Accessories",
    priceRupees: 399,
    inventoryQuantity: 120,
  },
  {
    name: "Hydration Bottle",
    description:
      "BPA-free 750ml squeeze bottle with leak-proof cap. Ergonomic grip designed for mid-run handheld use.",
    category: "Accessories",
    priceRupees: 699,
    inventoryQuantity: 65,
  },
  {
    name: "Running Cap",
    description:
      "Lightweight quick-dry cap with UV protection and adjustable velcro strap. Prevents glare and keeps sweat off your face.",
    category: "Accessories",
    priceRupees: 599,
    inventoryQuantity: 38,
  },
];

interface DemoCustomerSeed {
  name: string;
  email: string;
  phone: string;
  externalId: string;
}

const DEMO_CUSTOMERS: DemoCustomerSeed[] = [
  {
    name: "Arjun Mehta",
    email: "arjun.mehta@example.com",
    phone: "+919810012345",
    externalId: "cust-demo-arjun",
  },
  {
    name: "Priya Sharma",
    email: "priya.sharma@example.com",
    phone: "+919820098765",
    externalId: "cust-demo-priya",
  },
  {
    name: "Rohit Verma",
    email: "rohit.verma@example.com",
    phone: "+919830055512",
    externalId: "cust-demo-rohit",
  },
  {
    name: "Ananya Iyer",
    email: "ananya.iyer@example.com",
    phone: "+919840077788",
    externalId: "cust-demo-ananya",
  },
];

async function seedDemoData(roleIdByName: Map<string, string>) {
  if (!SEED_DEMO) return;

  const orgAdminRoleId = roleIdByName.get("ORG_ADMIN");
  if (!orgAdminRoleId) {
    throw new Error("Seed inconsistency: ORG_ADMIN role not available when creating demo data.");
  }

  console.log("\nSeeding Velocity Run demo data (SEED_DEMO=1)...");

  // ---- Organization ----
  await db
    .insert(organizations)
    .values({
      name: "Velocity Run",
      slug: DEMO_ORG_SLUG,
      status: "active",
      currency: "INR",
      timezone: "Asia/Kolkata",
    })
    .onConflictDoNothing({ target: organizations.slug });

  const [org] = await db
    .select({ id: organizations.id, slug: organizations.slug })
    .from(organizations)
    .where(eq(organizations.slug, DEMO_ORG_SLUG))
    .limit(1);

  if (!org) {
    throw new Error("Seed inconsistency: demo organization could not be retrieved after insert.");
  }
  console.log(`  Organization: ${org.slug} (${org.id})`);

  // ---- Admin user ----
  const passwordHash = await hashPassword(DEMO_ADMIN_PASSWORD);
  const suffix = randomUUID().slice(0, 8);

  await db
    .insert(users)
    .values({
      email: DEMO_ADMIN_EMAIL,
      passwordHash,
      firstName: "Demo",
      lastName: "Admin",
      status: "active",
    })
    .onConflictDoNothing({ target: users.email });

  const [adminUser] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.email, DEMO_ADMIN_EMAIL))
    .limit(1);

  if (!adminUser) {
    throw new Error("Seed inconsistency: demo admin user could not be retrieved after insert.");
  }
  console.log(`  Admin user: ${adminUser.email} / ${DEMO_ADMIN_PASSWORD}`);

  // ---- Organization membership ----
  await db
    .insert(organizationMembers)
    .values({
      organizationId: org.id,
      userId: adminUser.id,
      roleId: orgAdminRoleId,
      status: "active",
    })
    .onConflictDoNothing({
      target: [organizationMembers.organizationId, organizationMembers.userId],
    });

  // ---- Products ----
  const productRows = DEMO_PRODUCTS.map((p) => ({
    organizationId: org.id,
    name: p.name,
    slug: slugify(p.name),
    description: p.description,
    category: p.category,
    // price in integer minor units (paise). e.g. ₹4,799.00 -> 479900.
    price: p.priceRupees * 100,
    currency: "INR",
    inventoryQuantity: p.inventoryQuantity,
    imageUrl: p.imageUrl,
    isActive: true,
  }));

  // Products have a (orgId, slug) unique index — insert one at a time with
  // per-row onConflictDoNothing so a single pre-existing product doesn't
  // abort the whole batch.
  for (const row of productRows) {
    await db.insert(products).values(row).onConflictDoNothing({
      target: [products.organizationId, products.slug],
    });
  }
  console.log(`  Products: ${DEMO_PRODUCTS.length} seeded`);

  // ---- Customers ----
  const customerRows = DEMO_CUSTOMERS.map((c) => ({
    organizationId: org.id,
    externalCustomerId: c.externalId,
    name: c.name,
    email: c.email,
    phone: c.phone,
    status: "active" as const,
  }));

  for (const row of customerRows) {
    await db.insert(customers).values(row).onConflictDoNothing({
      target: [customers.organizationId, customers.externalCustomerId],
    });
  }
  console.log(`  Customers: ${DEMO_CUSTOMERS.length} seeded`);
}

// ---------------------------------------------------------------------
// main
// ---------------------------------------------------------------------

async function main() {
  console.log("Seeding roles...");
  const roleIdByName = await seedRoles();
  console.log(`  ${roleIdByName.size}/${ROLE_NAMES.length} roles present.`);

  console.log("Seeding permissions...");
  const permissionIdByName = await seedPermissions();
  console.log(
    `  ${permissionIdByName.size}/${Object.keys(PERMISSION_DEFS).length} permissions present.`
  );

  console.log("Seeding role_permissions...");
  await seedRolePermissions(roleIdByName, permissionIdByName);
  console.log("  Done.");

  await seedDemoData(roleIdByName);

  console.log("\nSeed complete. Safe to re-run at any time.");
  if (SEED_DEMO) {
    console.log(
      "\nDEMO CREDENTIALS — Velocity Run:" +
        `\n  URL:      POST /api/v1/auth/login` +
        `\n  Email:    ${DEMO_ADMIN_EMAIL}` +
        `\n  Password: ${DEMO_ADMIN_PASSWORD}`
    );
  }
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:");
  console.error(err);
  process.exit(1);
});

/**
 * STEP 1 — FINAL DATABASE CONSTRAINT VALIDATION
 * =============================================
 *
 * TEMPORARY, STANDALONE validation script.
 *
 * - Does NOT modify the schema.
 * - Does NOT touch migrations.
 * - Does NOT touch the frontend.
 * - Does NOT implement any Step 2 functionality.
 *
 * It connects directly to the existing Neon database using the existing
 * DATABASE_URL, runs everything inside a SINGLE transaction, uses
 * SAVEPOINTs so an expected constraint failure doesn't abort the whole
 * transaction, and ROLLS BACK the outer transaction unconditionally at
 * the end — so no test data is ever left behind, pass or fail.
 *
 * Run from the backend/ directory:
 *
 *   npx tsx scripts/validate-step1.ts
 *
 * Delete this file once you're done with it — it's not part of the app.
 */

import "dotenv/config";
import postgres from "postgres";

// ---------------------------------------------------------------------
// Connection — uses the existing DATABASE_URL only. No schema/migration
// files are touched by this script.
// ---------------------------------------------------------------------
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set. Aborting — nothing was run.");
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { max: 1 });

type TestResult = {
  name: string;
  expected: string;
  actual: string;
  pass: boolean;
};

const results: TestResult[] = [];

/**
 * Runs `fn` inside a SAVEPOINT on the given transaction. If `fn` throws,
 * the savepoint is rolled back (so the outer transaction stays usable)
 * and we classify the error: only an error whose code is in
 * `expectedCodes` AND (when `expectedConstraint` is given) whose
 * constraint name matches exactly counts as a PASS. Any other error
 * (syntax error, NOT NULL violation, wrong constraint, wrong code,
 * etc.) is reported as a FAIL with the real cause, and the operation
 * *succeeding* is also a FAIL.
 *
 * By default this checks for PostgreSQL 23503 (foreign_key_violation),
 * which is what Postgres raises for a plain FK insert/update violation
 * (Tests 1–3). Some FK violations — specifically ON DELETE RESTRICT
 * violations on a referenced row that still has dependents (Tests 4–5)
 * — are correctly reported by Postgres as 23001
 * (restrict_violation), not 23503. Callers pass `expectedCodes` to
 * account for that; the constraint name is still checked exactly, so
 * this never becomes a blanket "accept any 23001" — an unrelated
 * restrict_violation on the wrong constraint still FAILs.
 */
async function expectRejection(
  txSql: postgres.TransactionSql,
  name: string,
  expectedDescription: string,
  expectedConstraint: string | null,
  fn: (sp: postgres.TransactionSql) => Promise<unknown>,
  expectedCodes: string[] = ["23503"]
): Promise<TestResult> {
  try {
    await txSql.savepoint(async (sp) => {
      await fn(sp);
    });
    const result: TestResult = {
      name,
      expected: expectedDescription,
      actual: "Operation SUCCEEDED — no constraint violation was raised.",
      pass: false,
    };
    results.push(result);
    return result;
  } catch (err: any) {
    const code = err?.code;
    const constraint = err?.constraint_name ?? err?.constraint ?? null;
    const isExpectedCode = typeof code === "string" && expectedCodes.includes(code);
    const constraintMatches = expectedConstraint === null || constraint === expectedConstraint;

    const pass = isExpectedCode && constraintMatches;
    const result: TestResult = {
      name,
      expected: expectedDescription,
      actual: pass
        ? `Rejected as expected — Postgres error ${code} on constraint "${constraint}".`
        : `UNEXPECTED ERROR — code=${code ?? "n/a"} constraint=${constraint ?? "n/a"} message="${err?.message ?? String(err)}"`,
      pass,
    };
    results.push(result);
    return result;
  }
}

async function main() {
  let rolledBack = false;

  try {
    await sql.begin(async (tx) => {
      // -----------------------------------------------------------------
      // Shared setup: two organizations used throughout the tests.
      // -----------------------------------------------------------------
      const [orgA] = await tx`
        INSERT INTO organizations (name, slug, currency, timezone)
        VALUES ('Step1 Validation Org A', 'step1-validation-org-a-' || gen_random_uuid(), 'INR', 'Asia/Kolkata')
        RETURNING id
      `;
      const [orgB] = await tx`
        INSERT INTO organizations (name, slug, currency, timezone)
        VALUES ('Step1 Validation Org B', 'step1-validation-org-b-' || gen_random_uuid(), 'INR', 'Asia/Kolkata')
        RETURNING id
      `;

      // =================================================================
      // TEST 1 — CROSS-TENANT CUSTOMER PROTECTION
      // =================================================================
      const [customerB] = await tx`
        INSERT INTO customers (organization_id, name)
        VALUES (${orgB.id}, 'Step1 Validation Customer B')
        RETURNING id
      `;

      await expectRejection(
        tx,
        "TEST 1 — Cross-tenant customer protection",
        "Postgres rejects an order in Organization A that references a customer belonging to Organization B (orders_customer_org_fk).",
        "orders_customer_org_fk",
        async (sp) => {
          await sp`
            INSERT INTO orders (organization_id, customer_id, order_number, currency, subtotal_amount, total_amount)
            VALUES (${orgA.id}, ${customerB.id}, 'STEP1-VAL-T1-' || gen_random_uuid(), 'INR', 1000, 1000)
          `;
        }
      );

      // =================================================================
      // TEST 2 — CROSS-TENANT PAYMENT ATTEMPT PROTECTION
      // =================================================================
      const [orderB] = await tx`
        INSERT INTO orders (organization_id, customer_id, order_number, currency, subtotal_amount, total_amount)
        VALUES (${orgB.id}, ${customerB.id}, 'STEP1-VAL-T2-ORDER-' || gen_random_uuid(), 'INR', 1000, 1000)
        RETURNING id
      `;
      const [attemptB] = await tx`
        INSERT INTO payment_attempts (organization_id, order_id, provider, amount, currency, attempt_number)
        VALUES (${orgB.id}, ${orderB.id}, 'razorpay', 1000, 'INR', 1)
        RETURNING id
      `;

      await expectRejection(
        tx,
        "TEST 2 — Cross-tenant payment attempt protection",
        "Postgres rejects a payment in Organization A that references a payment_attempt belonging to Organization B (payments_attempt_org_fk).",
        "payments_attempt_org_fk",
        async (sp) => {
          await sp`
            INSERT INTO payments (organization_id, order_id, payment_attempt_id, provider, provider_payment_id, amount, currency)
            VALUES (${orgA.id}, ${orderB.id}, ${attemptB.id}, 'razorpay', 'step1-val-t2-' || gen_random_uuid(), 1000, 'INR')
          `;
        }
      );

      // =================================================================
      // TEST 3 — PAYMENT / ORDER CONSISTENCY
      // =================================================================
      const [orderA3] = await tx`
        INSERT INTO orders (organization_id, customer_id, order_number, currency, subtotal_amount, total_amount)
        VALUES (${orgB.id}, ${customerB.id}, 'STEP1-VAL-T3-ORDER-A-' || gen_random_uuid(), 'INR', 1000, 1000)
        RETURNING id
      `;
      const [orderB3] = await tx`
        INSERT INTO orders (organization_id, customer_id, order_number, currency, subtotal_amount, total_amount)
        VALUES (${orgB.id}, ${customerB.id}, 'STEP1-VAL-T3-ORDER-B-' || gen_random_uuid(), 'INR', 1000, 1000)
        RETURNING id
      `;
      const [attemptForOrderA3] = await tx`
        INSERT INTO payment_attempts (organization_id, order_id, provider, amount, currency, attempt_number)
        VALUES (${orgB.id}, ${orderA3.id}, 'razorpay', 1000, 'INR', 1)
        RETURNING id
      `;

      await expectRejection(
        tx,
        "TEST 3 — Payment/order consistency",
        "Postgres rejects a payment whose payment_attempt_id belongs to Order A but whose order_id claims Order B (payments_attempt_order_fk).",
        "payments_attempt_order_fk",
        async (sp) => {
          await sp`
            INSERT INTO payments (organization_id, order_id, payment_attempt_id, provider, provider_payment_id, amount, currency)
            VALUES (${orgB.id}, ${orderB3.id}, ${attemptForOrderA3.id}, 'razorpay', 'step1-val-t3-' || gen_random_uuid(), 1000, 'INR')
          `;
        }
      );

      // =================================================================
      // TEST 4 — ORGANIZATION FINANCIAL DELETE PROTECTION
      // =================================================================
      const [orgC] = await tx`
        INSERT INTO organizations (name, slug, currency, timezone)
        VALUES ('Step1 Validation Org C', 'step1-validation-org-c-' || gen_random_uuid(), 'INR', 'Asia/Kolkata')
        RETURNING id
      `;
      const [customerC] = await tx`
        INSERT INTO customers (organization_id, name)
        VALUES (${orgC.id}, 'Step1 Validation Customer C')
        RETURNING id
      `;
      const [orderC] = await tx`
        INSERT INTO orders (organization_id, customer_id, order_number, currency, subtotal_amount, total_amount)
        VALUES (${orgC.id}, ${customerC.id}, 'STEP1-VAL-T4-ORDER-' || gen_random_uuid(), 'INR', 1000, 1000)
        RETURNING id
      `;
      const [attemptC] = await tx`
        INSERT INTO payment_attempts (organization_id, order_id, provider, amount, currency, attempt_number, status)
        VALUES (${orgC.id}, ${orderC.id}, 'razorpay', 1000, 'INR', 1, 'captured')
        RETURNING id
      `;
      await tx`
        INSERT INTO payments (organization_id, order_id, payment_attempt_id, provider, provider_payment_id, amount, currency)
        VALUES (${orgC.id}, ${orderC.id}, ${attemptC.id}, 'razorpay', 'step1-val-t4-' || gen_random_uuid(), 1000, 'INR')
      `;

      await expectRejection(
        tx,
        "TEST 4 — Organization financial delete protection",
        "Postgres rejects DELETE on an organization that still has payment_attempts/payments referencing it (ON DELETE RESTRICT — code 23001 on payment_attempts_organization_id_organizations_id_fk).",
        "payment_attempts_organization_id_organizations_id_fk",
        async (sp) => {
          await sp`DELETE FROM organizations WHERE id = ${orgC.id}`;
        },
        ["23001"]
      );

      // =================================================================
      // TEST 5 — ORDER PAYMENT-HISTORY PROTECTION
      // =================================================================
      await expectRejection(
        tx,
        "TEST 5 — Order payment-history protection",
        "Postgres rejects DELETE on an order that still has a payment referencing it (ON DELETE RESTRICT — code 23001 on payments_order_id_orders_id_fk).",
        "payments_order_id_orders_id_fk",
        async (sp) => {
          await sp`DELETE FROM orders WHERE id = ${orderC.id}`;
        },
        ["23001"]
      );

      // -----------------------------------------------------------------
      // Force rollback of the ENTIRE outer transaction — no test data,
      // including the setup orgs/customers/orders, is ever committed.
      // -----------------------------------------------------------------
      throw new Error("STEP1_VALIDATION_INTENTIONAL_ROLLBACK");
    });
  } catch (err: any) {
    if (err?.message === "STEP1_VALIDATION_INTENTIONAL_ROLLBACK") {
      rolledBack = true;
    } else {
      console.error("UNEXPECTED SETUP FAILURE (not a test assertion) — aborting.");
      console.error(err);
      await sql.end({ timeout: 5 });
      process.exit(1);
    }
  }

  // -------------------------------------------------------------------
  // Verify rollback actually happened: none of the validation orgs
  // should exist in the database after the transaction ended.
  // -------------------------------------------------------------------
  const [{ count }] = await sql<{ count: number }[]>`
    SELECT count(*)::int AS count FROM organizations WHERE slug LIKE 'step1-validation-org-%'
  `;
  const rollbackConfirmed = rolledBack && Number(count) === 0;

  // -------------------------------------------------------------------
  // Report
  // -------------------------------------------------------------------
  console.log("\n# PAYPILOT AI — STEP 1 FINAL DATABASE VALIDATION\n");

  for (const r of results) {
    console.log(`${r.name}`);
    console.log(`  EXPECTED: ${r.expected}`);
    console.log(`  ACTUAL:   ${r.actual}`);
    console.log(`  RESULT:   ${r.pass ? "PASS" : "FAIL"}\n`);
  }

  console.log(
    `Transaction rollback: ${rollbackConfirmed ? "PASS" : "FAIL"} ${
      rollbackConfirmed
        ? "(outer transaction rolled back, 0 validation rows remain)"
        : `(rolledBack=${rolledBack}, remaining validation orgs=${count})`
    }\n`
  );

  const allPass = results.every((r) => r.pass) && rollbackConfirmed;
  console.log(allPass ? "Overall: STEP 1 READY FOR STEP 2" : "Overall: STEP 1 STILL NEEDS FIXES");

  await sql.end({ timeout: 5 });
  process.exit(allPass ? 0 : 1);
}

main().catch(async (err) => {
  console.error("FATAL ERROR running validation script:");
  console.error(err);
  await sql.end({ timeout: 5 });
  process.exit(1);
});

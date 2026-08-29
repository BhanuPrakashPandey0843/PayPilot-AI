-- PayPilot AI — Step 1 constraint verification
-- Safe to run against production: everything happens inside one transaction
-- that ends in ROLLBACK, so no test data is ever actually persisted.
-- Run with:  psql "$DATABASE_URL" -f tests/test-constraints.sql
-- (or paste the whole file into the Neon SQL editor and run it as one script)

BEGIN;

CREATE TEMP TABLE test_ids (
  org_a uuid, org_b uuid,
  cust_a uuid, cust_b uuid,
  ord_a uuid, ord_b uuid,
  attempt_a uuid, attempt_b uuid
);

DO $$
DECLARE
  v_org_a uuid; v_org_b uuid;
  v_cust_a uuid; v_cust_b uuid;
  v_ord_a uuid; v_ord_b uuid;
  v_attempt_a uuid; v_attempt_b uuid;
BEGIN
  INSERT INTO organizations (name, slug) VALUES ('Test Org A', 'test-org-a-' || gen_random_uuid()) RETURNING id INTO v_org_a;
  INSERT INTO organizations (name, slug) VALUES ('Test Org B', 'test-org-b-' || gen_random_uuid()) RETURNING id INTO v_org_b;

  INSERT INTO customers (organization_id, name) VALUES (v_org_a, 'Customer A') RETURNING id INTO v_cust_a;
  INSERT INTO customers (organization_id, name) VALUES (v_org_b, 'Customer B') RETURNING id INTO v_cust_b;

  INSERT INTO orders (organization_id, customer_id, order_number, currency, subtotal_amount, total_amount)
    VALUES (v_org_a, v_cust_a, 'TEST-A-1', 'INR', 10000, 10000) RETURNING id INTO v_ord_a;
  INSERT INTO orders (organization_id, customer_id, order_number, currency, subtotal_amount, total_amount)
    VALUES (v_org_b, v_cust_b, 'TEST-B-1', 'INR', 10000, 10000) RETURNING id INTO v_ord_b;

  INSERT INTO payment_attempts (organization_id, order_id, provider, amount, currency, attempt_number, status)
    VALUES (v_org_a, v_ord_a, 'razorpay', 10000, 'INR', 1, 'captured') RETURNING id INTO v_attempt_a;
  INSERT INTO payment_attempts (organization_id, order_id, provider, amount, currency, attempt_number, status)
    VALUES (v_org_b, v_ord_b, 'razorpay', 10000, 'INR', 1, 'captured') RETURNING id INTO v_attempt_b;

  INSERT INTO test_ids VALUES (v_org_a, v_org_b, v_cust_a, v_cust_b, v_ord_a, v_ord_b, v_attempt_a, v_attempt_b);

  RAISE NOTICE '--- Setup complete ---';
END $$;

-- TEST 1: Organization A order + Organization B customer — must be rejected
DO $$
DECLARE t record;
BEGIN
  SELECT * INTO t FROM test_ids;
  BEGIN
    INSERT INTO orders (organization_id, customer_id, order_number, currency, subtotal_amount, total_amount)
      VALUES (t.org_a, t.cust_b, 'TEST-CROSS-1', 'INR', 5000, 5000);
    RAISE NOTICE 'TEST 1 FAIL — cross-org order/customer insert succeeded (should have been rejected)';
  EXCEPTION WHEN foreign_key_violation THEN
    RAISE NOTICE 'TEST 1 PASS — rejected as expected: %', SQLERRM;
  END;
END $$;

-- TEST 2: Organization A payment + Organization B payment attempt — must be rejected
DO $$
DECLARE t record;
BEGIN
  SELECT * INTO t FROM test_ids;
  BEGIN
    INSERT INTO payments (organization_id, order_id, payment_attempt_id, provider, provider_payment_id, amount, currency)
      VALUES (t.org_a, t.ord_a, t.attempt_b, 'razorpay', 'test_pay_cross_org', 10000, 'INR');
    RAISE NOTICE 'TEST 2 FAIL — cross-org payment/attempt insert succeeded (should have been rejected)';
  EXCEPTION WHEN foreign_key_violation THEN
    RAISE NOTICE 'TEST 2 PASS — rejected as expected: %', SQLERRM;
  END;
END $$;

-- TEST 3: Payment pointing to an attempt belonging to a different order (same org) — must be rejected
DO $$
DECLARE
  t record;
  v_ord_a2 uuid;
BEGIN
  SELECT * INTO t FROM test_ids;
  INSERT INTO orders (organization_id, customer_id, order_number, currency, subtotal_amount, total_amount)
    VALUES (t.org_a, t.cust_a, 'TEST-A-2', 'INR', 5000, 5000) RETURNING id INTO v_ord_a2;
  BEGIN
    INSERT INTO payments (organization_id, order_id, payment_attempt_id, provider, provider_payment_id, amount, currency)
      VALUES (t.org_a, v_ord_a2, t.attempt_a, 'razorpay', 'test_pay_cross_order', 10000, 'INR');
    RAISE NOTICE 'TEST 3 FAIL — cross-order payment/attempt insert succeeded (should have been rejected)';
  EXCEPTION WHEN foreign_key_violation THEN
    RAISE NOTICE 'TEST 3 PASS — rejected as expected: %', SQLERRM;
  END;
END $$;

-- TEST 4: Deleting an organization that has payment records — must be rejected
DO $$
DECLARE t record;
BEGIN
  SELECT * INTO t FROM test_ids;
  BEGIN
    DELETE FROM organizations WHERE id = t.org_a;
    RAISE NOTICE 'TEST 4 FAIL — organization delete succeeded (should have been rejected)';
  EXCEPTION WHEN foreign_key_violation THEN
    RAISE NOTICE 'TEST 4 PASS — rejected as expected: %', SQLERRM;
  END;
END $$;

-- TEST 5: Deleting an order that has payment attempts — must be rejected
DO $$
DECLARE t record;
BEGIN
  SELECT * INTO t FROM test_ids;
  BEGIN
    DELETE FROM orders WHERE id = t.ord_a;
    RAISE NOTICE 'TEST 5 FAIL — order delete succeeded (should have been rejected)';
  EXCEPTION WHEN foreign_key_violation THEN
    RAISE NOTICE 'TEST 5 PASS — rejected as expected: %', SQLERRM;
  END;
END $$;

DO $$ BEGIN RAISE NOTICE '--- All tests complete. Rolling back — no test data was persisted. ---'; END $$;

ROLLBACK;

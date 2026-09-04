"use client";

import { useState } from "react";
import { useSession } from "@/hooks/useSession";
import { usePaymentList, usePaymentAnalytics } from "@/hooks/usePayments";
import { roleHasPermission } from "@/lib/permissions";
import type { PaymentRecord } from "@/lib/api/payments";
import { PaymentsHero } from "./PaymentsHero";
import { PaymentsSummaryCards } from "./PaymentsSummaryCards";
import { PaymentsToolbar } from "./PaymentsToolbar";
import { PaymentsTable } from "./PaymentsTable";
import { PaymentDetailModal } from "./PaymentDetailModal";

const PAGE_SIZE = 20;

type ModalState = { kind: "none" } | { kind: "view"; payment: PaymentRecord };

/**
 * Payments (/payments) — assembled entirely from the real GET /payments/history,
 * GET /payments/:id, and GET /analytics/payments routes (see lib/api/payments.ts
 * for the typed boundary between this page and the backend).
 *
 * Capability honesty — this view deliberately does NOT expose UI for:
 *   - Search / filter / sort:   the backend's paymentHistoryQuerySchema is
 *                               ONLY page + limit today; adding those controls
 *                               would fake functionality the server cannot do.
 *   - Refund / retry / cancel:  payment.routes.ts is 100% read-only; the
 *                               payments.read permission allows nothing but
 *                               SELECTs. A status badge and the Razorpay
 *                               dashboard are the authority.
 *                               The `payments.refund` permission exists in
 *                               RBAC (permissions.ts) but there is no route
 *                               backing it yet — we never show a button that
 *                               would fail.
 *
 * Summary KPI cards are drawn from GET /analytics/payments (real aggregate
 * queries: successCount / failureCount / pendingCount + successRatePercent
 * + failedPaymentValueMinor). Never from a client-side count over one
 * paginated page of history rows.
 */
export function PaymentsView() {
  const { session } = useSession();
  const canRead = roleHasPermission(session?.role, "payments.read");

  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<ModalState>({ kind: "none" });

  const listResult = usePaymentList({ page, limit: PAGE_SIZE });
  const analyticsResult = usePaymentAnalytics("30d");

  function refetchAll() {
    listResult.refetch();
    analyticsResult.refetch();
  }

  if (session && !canRead) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
        <p className="text-sm font-medium text-zinc-200">You don&apos;t have access to Payments</p>
        <p className="max-w-xs text-xs text-zinc-500">
          Ask an organization admin to grant you the payments.read permission.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <PaymentsHero
        organizationName={session?.organization.name ?? "your workspace"}
        onRefresh={refetchAll}
        isRefreshing={listResult.isLoading && !listResult.data}
      />

      <PaymentsSummaryCards result={analyticsResult} />

      <PaymentsToolbar
        onRefresh={refetchAll}
        isRefreshing={listResult.isLoading && !listResult.data}
      />

      <PaymentsTable
        result={listResult}
        page={page}
        onPageChange={setPage}
        onView={(payment) => setModal({ kind: "view", payment })}
      />

      {modal.kind === "view" && (
        <PaymentDetailModal
          paymentId={modal.payment.id}
          initialPayment={modal.payment}
          onClose={() => setModal({ kind: "none" })}
        />
      )}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useSession } from "@/hooks/useSession";
import { useOrderList, useOrdersSummary } from "@/hooks/useOrders";
import { roleHasPermission } from "@/lib/permissions";
import type { OrderListRow } from "@/lib/api/orders";
import { OrdersHero } from "./OrdersHero";
import { OrdersSummaryCards } from "./OrdersSummaryCards";
import {
  OrdersToolbar,
  DEFAULT_ORDER_FILTERS,
  sortOptionToParams,
  toMinorUnitsOrUndefined,
  type OrdersFilterValues,
} from "./OrdersToolbar";
import { OrdersTable } from "./OrdersTable";
import { OrderDetailModal } from "./OrderDetailModal";

const PAGE_SIZE = 20;

type ModalState = { kind: "none" } | { kind: "view"; order: OrderListRow };

/**
 * Orders (/orders) — assembled entirely from the real GET /orders,
 * GET /orders/summary, and GET /orders/:id routes (see lib/api/orders.ts),
 * same structural pattern as ProductsView: owns filter/pagination/modal
 * state, each section owns its own loading/error/empty rendering.
 *
 * There is no create/edit/delete here — orders only ever come from
 * checkout, and there is no refund/cancel/retry endpoint on this backend
 * (see lib/api/orders.ts's doc comment) — so the only actions exposed
 * are "view details" and "copy order ID", both non-destructive and
 * requiring no extra permission beyond orders.read.
 */
export function OrdersView() {
  const { session } = useSession();
  const canRead = roleHasPermission(session?.role, "orders.read");

  const [filters, setFilters] = useState<OrdersFilterValues>(DEFAULT_ORDER_FILTERS);
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<ModalState>({ kind: "none" });

  function updateFilters(next: OrdersFilterValues) {
    setFilters(next);
    setPage(1);
  }

  const { sort, order } = sortOptionToParams(filters.sortOption);

  const listFilters = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: filters.search.trim() || undefined,
      status: filters.status ? filters.status : undefined,
      minAmount: filters.minAmount.trim() ? toMinorUnitsOrUndefined(filters.minAmount) : undefined,
      maxAmount: filters.maxAmount.trim() ? toMinorUnitsOrUndefined(filters.maxAmount) : undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
      sort,
      order,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [page, filters, sort, order]
  );

  const listResult = useOrderList(listFilters);
  const summaryResult = useOrdersSummary();

  function refetchAll() {
    listResult.refetch();
    summaryResult.refetch();
  }

  const hasActiveFilters = Boolean(
    filters.search || filters.status || filters.minAmount || filters.maxAmount || filters.dateFrom || filters.dateTo
  );

  if (session && !canRead) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
        <p className="text-sm font-medium text-zinc-200">You don&apos;t have access to Orders</p>
        <p className="max-w-xs text-xs text-zinc-500">Ask an organization admin to grant you the orders.read permission.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <OrdersHero
        organizationName={session?.organization.name ?? "your workspace"}
        onRefresh={refetchAll}
        isRefreshing={listResult.isLoading}
      />

      <OrdersSummaryCards result={summaryResult} />

      <OrdersToolbar
        value={filters}
        onChange={updateFilters}
        onRefresh={refetchAll}
        isRefreshing={listResult.isLoading}
      />

      <OrdersTable
        result={listResult}
        page={page}
        onPageChange={setPage}
        hasActiveFilters={hasActiveFilters}
        onView={(order) => setModal({ kind: "view", order })}
        onClearFilters={() => updateFilters(DEFAULT_ORDER_FILTERS)}
      />

      {modal.kind === "view" && (
        <OrderDetailModal
          orderId={modal.order.id}
          initialOrder={modal.order}
          onClose={() => setModal({ kind: "none" })}
        />
      )}
    </div>
  );
}

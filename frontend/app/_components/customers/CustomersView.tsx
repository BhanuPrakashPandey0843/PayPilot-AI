"use client";

import { useMemo, useState } from "react";
import { useSession } from "@/hooks/useSession";
import { useCustomerList, useCustomerCount } from "@/hooks/useCustomers";
import { roleHasPermission } from "@/lib/permissions";
import type { Customer } from "@/lib/api/customers";
import { CustomersHero } from "./CustomersHero";
import { CustomersSummaryCards } from "./CustomersSummaryCards";
import { CustomersToolbar, DEFAULT_CUSTOMER_FILTERS, type CustomersFilterValues } from "./CustomersToolbar";
import { CustomersTable } from "./CustomersTable";
import { CustomerFormModal } from "./CustomerFormModal";
import { CustomerDetailModal } from "./CustomerDetailModal";

const PAGE_SIZE = 20;

type ModalState =
  | { kind: "none" }
  | { kind: "create" }
  | { kind: "edit"; customer: Customer }
  | { kind: "view"; customer: Customer };

/**
 * Customers (/customers) — assembled entirely from the real
 * GET/POST/PATCH /customers routes (see lib/api/customers.ts), plus
 * GET /orders?customerId=... for a customer's order history (reused
 * from the Orders module rather than duplicated) and GET /audit for
 * activity. Same structural pattern as OrdersView / ProductsView: owns
 * filter/pagination/modal state, each section owns its own
 * loading/error/empty rendering.
 *
 * There is no delete here — customers.routes.ts has no DELETE route and
 * lib/permissions.ts has no "customers.delete" permission, so unlike
 * Products there's no delete action anywhere in this module. Create/Edit
 * controls are hidden entirely (not just disabled) for roles without
 * customers.create/customers.update — the exact permissions the backend
 * enforces on those routes.
 */
export function CustomersView() {
  const { session } = useSession();
  const canRead = roleHasPermission(session?.role, "customers.read");
  const canCreate = roleHasPermission(session?.role, "customers.create");
  const canUpdate = roleHasPermission(session?.role, "customers.update");

  const [filters, setFilters] = useState<CustomersFilterValues>(DEFAULT_CUSTOMER_FILTERS);
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<ModalState>({ kind: "none" });

  function updateFilters(next: CustomersFilterValues) {
    setFilters(next);
    setPage(1);
  }

  const listFilters = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: filters.search.trim() || undefined,
      status: filters.status ? filters.status : undefined,
    }),
    [page, filters]
  );

  const listResult = useCustomerList(listFilters);

  const totalCount = useCustomerCount();
  const activeCount = useCustomerCount("active");
  const inactiveCount = useCustomerCount("inactive");
  const blockedCount = useCustomerCount("blocked");

  function refetchAll() {
    listResult.refetch();
    totalCount.refetch();
    activeCount.refetch();
    inactiveCount.refetch();
    blockedCount.refetch();
  }

  const hasActiveFilters = Boolean(filters.search || filters.status);

  if (session && !canRead) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
        <p className="text-sm font-medium text-zinc-200">You don&apos;t have access to Customers</p>
        <p className="max-w-xs text-xs text-zinc-500">
          Ask an organization admin to grant you the customers.read permission.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <CustomersHero
        organizationName={session?.organization.name ?? "your workspace"}
        canCreate={canCreate}
        onAddCustomer={() => setModal({ kind: "create" })}
        onRefresh={refetchAll}
        isRefreshing={listResult.isLoading}
      />

      <CustomersSummaryCards
        totalCount={totalCount}
        activeCount={activeCount}
        inactiveCount={inactiveCount}
        blockedCount={blockedCount}
      />

      <CustomersToolbar
        value={filters}
        onChange={updateFilters}
        onRefresh={refetchAll}
        isRefreshing={listResult.isLoading}
      />

      <CustomersTable
        result={listResult}
        page={page}
        onPageChange={setPage}
        canUpdate={canUpdate}
        canCreate={canCreate}
        hasActiveFilters={hasActiveFilters}
        onView={(customer) => setModal({ kind: "view", customer })}
        onEdit={(customer) => setModal({ kind: "edit", customer })}
        onAddCustomer={() => setModal({ kind: "create" })}
        onClearFilters={() => updateFilters(DEFAULT_CUSTOMER_FILTERS)}
      />

      {(modal.kind === "create" || modal.kind === "edit") && (
        <CustomerFormModal
          mode={modal.kind}
          customer={modal.kind === "edit" ? modal.customer : undefined}
          onClose={() => setModal({ kind: "none" })}
          onSaved={() => {
            setModal({ kind: "none" });
            refetchAll();
          }}
        />
      )}

      {modal.kind === "view" && (
        <CustomerDetailModal
          customerId={modal.customer.id}
          initialCustomer={modal.customer}
          onClose={() => setModal({ kind: "none" })}
          canUpdate={canUpdate}
          onEdit={(customer) => setModal({ kind: "edit", customer })}
        />
      )}
    </div>
  );
}

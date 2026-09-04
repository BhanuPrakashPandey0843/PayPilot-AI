"use client";

import { ChevronLeft, ChevronRight, Eye, Mail, Pencil, Phone, Plus, User, Users } from "lucide-react";
import type { UseApiResourceResult } from "@/hooks/useApiResource";
import type { Customer, CustomerListResult } from "@/lib/api/customers";
import { ErrorNote } from "../dashboard/home/Skeletons";
import { CUSTOMER_STATUS_META } from "./customerMeta";

interface CustomersTableProps {
  result: UseApiResourceResult<CustomerListResult>;
  page: number;
  onPageChange: (page: number) => void;
  canUpdate: boolean;
  canCreate: boolean;
  hasActiveFilters: boolean;
  onView: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onAddCustomer: () => void;
  onClearFilters: () => void;
}

function StatusBadge({ status }: { status: Customer["status"] }) {
  const meta = CUSTOMER_STATUS_META[status];
  const Icon = meta.icon;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ background: `color-mix(in srgb, ${meta.color} 16%, transparent)`, color: meta.color }}
    >
      <Icon className="h-3 w-3" /> {meta.label}
    </span>
  );
}

function CustomerAvatar() {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-gradient-to-br from-[var(--accent-violet)]/15 via-white/[0.02] to-[var(--accent-cyan)]/10 text-zinc-400">
      <User className="h-4 w-4" />
    </span>
  );
}

function RowActions({
  customer,
  canUpdate,
  onView,
  onEdit,
}: {
  customer: Customer;
  canUpdate: boolean;
  onView: (c: Customer) => void;
  onEdit: (c: Customer) => void;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        onClick={() => onView(customer)}
        aria-label="View customer"
        title="View"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
      >
        <Eye className="h-3.5 w-3.5" />
      </button>
      {canUpdate && (
        <button
          type="button"
          onClick={() => onEdit(customer)}
          aria-label="Edit customer"
          title="Edit"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export function CustomersTable({
  result,
  page,
  onPageChange,
  canUpdate,
  canCreate,
  hasActiveFilters,
  onView,
  onEdit,
  onAddCustomer,
  onClearFilters,
}: CustomersTableProps) {
  const rows = result.data?.rows ?? [];
  const pageMeta = result.data?.meta;
  const isEmpty = !result.isLoading && !result.error && rows.length === 0 && !hasActiveFilters;
  const isNoResults = !result.isLoading && !result.error && rows.length === 0 && hasActiveFilters;

  return (
    <div className="rounded-3xl border border-[var(--border-subtle)] bg-white/[0.02] p-6">
      <p className="text-sm font-medium text-white">All customers</p>

      {result.error && (
        <div className="mt-4">
          <ErrorNote message={result.error} onRetry={result.refetch} />
        </div>
      )}

      {!result.error && result.isLoading && (
        <div className="mt-4 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-shimmer h-14 w-full rounded-xl bg-white/[0.03]" />
          ))}
        </div>
      )}

      {isEmpty && (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--border-subtle)] py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04]">
            <Users className="h-5 w-5 text-zinc-500" />
          </span>
          <p className="text-sm font-medium text-zinc-200">No customers yet</p>
          <p className="max-w-xs text-xs text-zinc-500">
            Customers will show up here as soon as someone checks out, or you can add one manually.
          </p>
          {canCreate && (
            <button
              type="button"
              onClick={onAddCustomer}
              className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-cyan)] px-4 py-2 text-xs font-medium text-white hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" /> Add Customer
            </button>
          )}
        </div>
      )}

      {isNoResults && (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--border-subtle)] py-14 text-center">
          <p className="text-sm font-medium text-zinc-200">No customers match these filters</p>
          <p className="max-w-xs text-xs text-zinc-500">Try widening your search or clearing filters.</p>
          <button
            type="button"
            onClick={onClearFilters}
            className="mt-2 rounded-xl border border-[var(--border-subtle)] px-4 py-2 text-xs font-medium text-zinc-300 hover:border-[var(--border-strong)] hover:text-white"
          >
            Clear filters
          </button>
        </div>
      )}

      {!result.isLoading && !result.error && rows.length > 0 && (
        <>
          {/* Desktop table */}
          <div className="mt-4 hidden overflow-x-auto md:block">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] text-xs uppercase tracking-wide text-zinc-500">
                  <th className="py-2 pr-4 font-medium">Customer</th>
                  <th className="py-2 pr-4 font-medium">Contact</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Created</th>
                  <th className="py-2 pl-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((customer) => (
                  <tr
                    key={customer.id}
                    className="cursor-pointer border-b border-[var(--border-subtle)]/60 transition-colors hover:bg-white/[0.03]"
                    onClick={() => onView(customer)}
                  >
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <CustomerAvatar />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white" title={customer.name}>
                            {customer.name}
                          </p>
                          {customer.externalCustomerId && (
                            <p className="truncate text-xs text-zinc-500">{customer.externalCustomerId}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-xs text-zinc-400">
                      {customer.email && (
                        <p className="flex items-center gap-1.5 text-zinc-300">
                          <Mail className="h-3 w-3 shrink-0 text-zinc-500" />
                          <span className="truncate">{customer.email}</span>
                        </p>
                      )}
                      {customer.phone && (
                        <p className="mt-0.5 flex items-center gap-1.5">
                          <Phone className="h-3 w-3 shrink-0 text-zinc-500" />
                          {customer.phone}
                        </p>
                      )}
                      {!customer.email && !customer.phone && <span className="text-zinc-600">—</span>}
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={customer.status} />
                    </td>
                    <td className="py-3 pr-4 text-xs text-zinc-500">
                      {new Date(customer.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="py-3 pl-4" onClick={(e) => e.stopPropagation()}>
                      <RowActions customer={customer} canUpdate={canUpdate} onView={onView} onEdit={onEdit} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="mt-4 flex flex-col gap-3 md:hidden">
            {rows.map((customer) => (
              <div
                key={customer.id}
                onClick={() => onView(customer)}
                className="cursor-pointer rounded-2xl border border-[var(--border-subtle)] bg-white/[0.02] p-4 transition-colors hover:border-[var(--border-strong)]"
              >
                <div className="flex items-start gap-3">
                  <CustomerAvatar />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{customer.name}</p>
                    {customer.email && <p className="mt-0.5 truncate text-xs text-zinc-500">{customer.email}</p>}
                    {customer.phone && <p className="mt-0.5 text-xs text-zinc-500">{customer.phone}</p>}
                  </div>
                  <StatusBadge status={customer.status} />
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-[var(--border-subtle)] pt-3">
                  <span className="text-[11px] text-zinc-500">
                    Added{" "}
                    {new Date(customer.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                  <div onClick={(e) => e.stopPropagation()}>
                    <RowActions customer={customer} canUpdate={canUpdate} onView={onView} onEdit={onEdit} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {pageMeta && pageMeta.totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between text-xs text-zinc-500">
          <span>
            Page {pageMeta.page} of {pageMeta.totalPages} · {pageMeta.total} customers
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] px-2.5 py-1.5 font-medium text-zinc-300 hover:border-[var(--border-strong)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </button>
            <button
              type="button"
              disabled={page >= pageMeta.totalPages}
              onClick={() => onPageChange(page + 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] px-2.5 py-1.5 font-medium text-zinc-300 hover:border-[var(--border-strong)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

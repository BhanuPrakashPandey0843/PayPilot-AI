"use client";

import { useMemo, useState } from "react";
import { useSession } from "@/hooks/useSession";
import { useOverview } from "@/hooks/useDashboardHome";
import { useOpportunityList, useOpportunityStatusCount } from "@/hooks/useRevenueOpportunities";
import { approveOpportunity, rejectOpportunity, type RevenueOpportunity } from "@/lib/api/dashboard";
import { ApiError } from "@/lib/api/client";
import { roleHasPermission } from "@/lib/permissions";
import { RevenueHero } from "./RevenueHero";
import { RevenueSummaryCards } from "./RevenueSummaryCards";
import { RevenueFilters, type RevenueFilterValues } from "./RevenueFilters";
import { OpportunityList } from "./OpportunityList";
import { ExecuteConfirmModal } from "./ExecuteConfirmModal";
import { ErrorNote } from "../dashboard/home/Skeletons";

const PAGE_SIZE = 10;

/**
 * Revenue Opportunities (/revenue-opportunities) — assembled entirely
 * from the real GET/POST /revenue/opportunities* routes (see
 * lib/api/dashboard.ts), same structural pattern as AuditLogsView:
 * owns filter/pagination/action state, each section owns its own
 * loading/error/empty rendering.
 *
 * Execution controls (Approve/Reject/Execute) require ai.execute — the
 * same permission the backend enforces on every one of those routes —
 * so they're hidden entirely, not just disabled, for roles that would
 * get a 403 anyway. Every other authenticated role can still view the
 * page (analytics.read), matching how the sidebar already gates the
 * nav link.
 */
export function RevenueOpportunitiesView() {
  const { session } = useSession();
  const canExecute = roleHasPermission(session?.role, "ai.execute");
  const currencyFallback = "INR";

  const [filters, setFilters] = useState<RevenueFilterValues>({ type: "", status: "", sort: "score" });
  const [page, setPage] = useState(1);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [executingOpportunity, setExecutingOpportunity] = useState<RevenueOpportunity | null>(null);

  function updateFilters(next: RevenueFilterValues) {
    setFilters(next);
    setPage(1);
  }

  const listFilters = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      type: filters.type || undefined,
      status: filters.status || undefined,
      sort: filters.sort,
    }),
    [page, filters]
  );

  const listResult = useOpportunityList(listFilters);
  const overview = useOverview("30d");
  const openCount = useOpportunityStatusCount("OPEN");
  const approvedCount = useOpportunityStatusCount("APPROVED");
  const executedCount = useOpportunityStatusCount("EXECUTED");
  const failedCount = useOpportunityStatusCount("FAILED");

  function refetchAll() {
    listResult.refetch();
    openCount.refetch();
    approvedCount.refetch();
    executedCount.refetch();
    failedCount.refetch();
  }

  async function handleApprove(id: string) {
    setPendingId(id);
    setActionError(null);
    try {
      await approveOpportunity(id);
      refetchAll();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Could not approve this opportunity. Please try again.");
    } finally {
      setPendingId(null);
    }
  }

  async function handleReject(id: string, reason?: string) {
    setPendingId(id);
    setActionError(null);
    try {
      await rejectOpportunity(id, reason);
      refetchAll();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Could not reject this opportunity. Please try again.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <RevenueHero organizationName={session?.organization.name ?? "your workspace"} overview={overview} />

      <RevenueSummaryCards
        openCount={openCount}
        approvedCount={approvedCount}
        executedCount={executedCount}
        failedCount={failedCount}
      />

      {actionError && <ErrorNote message={actionError} />}

      <RevenueFilters value={filters} onChange={updateFilters} />

      <OpportunityList
        result={listResult}
        page={page}
        onPageChange={setPage}
        canExecute={canExecute}
        pendingId={pendingId}
        onApprove={handleApprove}
        onReject={handleReject}
        onExecute={setExecutingOpportunity}
        currencyFallback={currencyFallback}
        hasActiveFilters={Boolean(filters.type || filters.status)}
      />

      {executingOpportunity && (
        <ExecuteConfirmModal
          opportunity={executingOpportunity}
          onClose={() => setExecutingOpportunity(null)}
          onSettled={refetchAll}
        />
      )}
    </div>
  );
}

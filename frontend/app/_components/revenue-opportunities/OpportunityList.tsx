"use client";

import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import type { UseApiResourceResult } from "@/hooks/useApiResource";
import type { OpportunityListResult, RevenueOpportunity } from "@/lib/api/dashboard";
import { ErrorNote } from "../dashboard/home/Skeletons";
import { OpportunityCard } from "./OpportunityCard";

interface OpportunityListProps {
  result: UseApiResourceResult<OpportunityListResult>;
  page: number;
  onPageChange: (page: number) => void;
  canExecute: boolean;
  pendingId: string | null;
  onApprove: (id: string) => void;
  onReject: (id: string, reason?: string) => void;
  onExecute: (opportunity: RevenueOpportunity) => void;
  currencyFallback: string;
  hasActiveFilters: boolean;
}

function CardSkeleton() {
  return (
    <div className="animate-shimmer h-40 rounded-3xl border border-[var(--border-subtle)] bg-white/[0.02]" />
  );
}

/**
 * The main list for GET /revenue/opportunities — owns loading skeleton,
 * empty state, error-with-retry, and pagination. Row-level pending
 * state (which card shows a spinner during approve/reject/execute) is
 * passed down rather than owned here, since a single in-flight action
 * shouldn't block the rest of the list from being interactive.
 */
export function OpportunityList({
  result,
  page,
  onPageChange,
  canExecute,
  pendingId,
  onApprove,
  onReject,
  onExecute,
  currencyFallback,
  hasActiveFilters,
}: OpportunityListProps) {
  const rows = result.data?.rows ?? [];
  const pageMeta = result.data?.meta;

  if (result.error) {
    return <ErrorNote message={result.error} onRetry={result.refetch} />;
  }

  if (result.isLoading) {
    return (
      <div className="space-y-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-[var(--border-subtle)] p-12 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.03]">
          <Inbox className="h-5 w-5 text-zinc-500" />
        </span>
        <p className="text-sm font-medium text-white">
          {hasActiveFilters ? "No opportunities match these filters." : "No revenue opportunities yet."}
        </p>
        <p className="max-w-sm text-xs text-zinc-500">
          {hasActiveFilters
            ? "Try clearing the filters above to see everything PayPilot has detected."
            : "PayPilot's detection engine surfaces opportunities from real order and payment activity as it comes in."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((opp) => (
        <OpportunityCard
          key={opp.id}
          opportunity={opp}
          canExecute={canExecute}
          isPending={pendingId === opp.id}
          onApprove={() => onApprove(opp.id)}
          onReject={(reason) => onReject(opp.id, reason)}
          onExecute={() => onExecute(opp)}
          currencyFallback={currencyFallback}
        />
      ))}

      {pageMeta && pageMeta.totalPages > 1 && (
        <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
          <span>
            Page {pageMeta.page} of {pageMeta.totalPages} · {pageMeta.total} opportunities
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

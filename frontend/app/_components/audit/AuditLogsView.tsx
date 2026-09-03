"use client";

import { useMemo, useState } from "react";
import { useSession } from "@/hooks/useSession";
import { useAuditList, useAuditCount } from "@/hooks/useAuditLogs";
import { AuditHero } from "./AuditHero";
import { AuditSummaryCards } from "./AuditSummaryCards";
import { AuditFilters, type AuditFilterValues } from "./AuditFilters";
import { EventTimeline } from "./EventTimeline";
import { AuditTable } from "./AuditTable";

const PAGE_SIZE = 20;

/**
 * Audit Logs (/audit-logs) — assembled entirely from GET /api/v1/audit,
 * the one audit endpoint that actually exists. Owns filter + pagination
 * state; each section below owns its own loading/error/empty rendering
 * so a slow table never blocks the hero or summary cards.
 */
export function AuditLogsView() {
  const { session } = useSession();
  const [filters, setFilters] = useState<AuditFilterValues>({ resourceType: "", action: "", resourceId: "" });
  const [page, setPage] = useState(1);

  function updateFilters(next: AuditFilterValues) {
    setFilters(next);
    setPage(1);
  }

  const tableFilters = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      resourceType: filters.resourceType || undefined,
      action: filters.action || undefined,
      resourceId: filters.resourceId || undefined,
    }),
    [page, filters]
  );

  const tableResult = useAuditList(tableFilters);

  // Unfiltered, recent-first window — powers the Timeline section and
  // the "Failed events" summary card (see AuditSummaryCards' doc
  // comment for why that one card is scoped to "recent" rather than
  // all-time).
  const recentWindow = useAuditList({ page: 1, limit: 100 });

  const totalEvents = useAuditCount({});
  const aiActionEvents = useAuditCount({ resourceType: "ai_action" });
  const paymentEvents = useAuditCount({ resourceType: "payment" });
  const paymentAttemptEvents = useAuditCount({ resourceType: "payment_attempt" });
  const policyBlockedEvents = useAuditCount({ action: "POLICY_REJECTED" });

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <AuditHero organizationName={session?.organization.name ?? "your workspace"} totalEvents={totalEvents} />

      <AuditSummaryCards
        totalEvents={totalEvents}
        aiActionEvents={aiActionEvents}
        paymentEvents={paymentEvents}
        paymentAttemptEvents={paymentAttemptEvents}
        policyBlockedEvents={policyBlockedEvents}
        recentWindow={recentWindow}
      />

      <EventTimeline recentWindow={recentWindow} />

      <AuditFilters value={filters} onChange={updateFilters} />

      <AuditTable result={tableResult} page={page} onPageChange={setPage} />
    </div>
  );
}

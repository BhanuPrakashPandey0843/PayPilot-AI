import type { ReactNode } from "react";

/** Small uppercase label used to separate blocks within a dashboard page (distinct from the page-level `DashboardPageHeader`). */
export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8A8B92]">{title}</h3>
      {action}
    </div>
  );
}

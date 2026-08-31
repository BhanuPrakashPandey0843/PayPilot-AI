import type { ReactNode } from "react";

/** Page-level heading + optional action slot for dashboard pages — the interior counterpart to `layout/PageHeader`. */
export function DashboardPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-[19px] font-bold tracking-[-0.01em] text-[#111217] sm:text-[22px]">{title}</h2>
        {description && <p className="mt-1 text-[13px] leading-[1.5] text-[#8A8B92]">{description}</p>}
      </div>
      {action}
    </div>
  );
}

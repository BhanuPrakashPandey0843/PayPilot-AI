import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

import { cn } from "@/lib/utils";

/** Reusable empty-list panel — no results, no data yet, empty search, etc. */
export function EmptyState({
  icon: Icon = Inbox,
  title = "Nothing here yet",
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-[20px] border border-dashed border-black/[0.1] bg-[#FCFCFB] px-6 py-14 text-center",
        className
      )}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/[0.04]">
        <Icon className="h-5 w-5 text-[#8A8B92]" strokeWidth={1.75} />
      </div>
      <div>
        <p className="text-[14px] font-semibold text-[#111217]">{title}</p>
        {description && (
          <p className="mt-1 max-w-[320px] text-[12.5px] leading-[1.55] text-[#8A8B92]">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

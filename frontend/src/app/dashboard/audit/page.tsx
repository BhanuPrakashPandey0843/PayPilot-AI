import { DashboardPageHeader } from "@/components/dashboard/PageHeader";
import { MOCK_AUDIT_TRAIL } from "@/lib/mock/audit";
import { cn } from "@/lib/utils";

export default function AuditLogPage() {
  return (
    <div>
      <DashboardPageHeader title="Audit Log" description="Every money-relevant action, organization-scoped and explainable." />

      <ol className="relative space-y-5 rounded-[20px] border border-black/[0.06] bg-white p-6">
        {MOCK_AUDIT_TRAIL.map((event, i) => (
          <li key={event.id} className={cn("relative pl-5", i !== MOCK_AUDIT_TRAIL.length - 1 && "border-l border-black/[0.08]")}>
            <span
              className={cn(
                "absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white",
                event.result === "success" && "bg-[#1F9D6C]",
                event.result === "blocked" && "bg-[#E0537A]",
                event.result === "info" && "bg-[#8C7BE0]"
              )}
            />
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-black/[0.05] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#5F6067]">
                {event.actorType.replace("_", " ")}
              </span>
              <span className="text-[11.5px] font-medium text-[#111217]">{event.actor}</span>
              <span className="ml-auto text-[10.5px] text-[#A9AAB1]">{event.timestamp}</span>
            </div>
            <p className="mt-1 text-[13px] leading-[1.5] text-[#3F424C]">{event.action}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

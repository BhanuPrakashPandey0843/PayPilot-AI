import { CreditCard } from "lucide-react";

import { DashboardPageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/states/EmptyState";
import { MOCK_ORDER_STATUS_BREAKDOWN } from "@/lib/mock/analytics";

export default function PaymentsPage() {
  const hasActivity = MOCK_ORDER_STATUS_BREAKDOWN.some((s) => s.count > 0);

  return (
    <div>
      <DashboardPageHeader title="Payments" description="Payment history, read-only — reconciled against Razorpay." />

      {!hasActivity ? (
        <EmptyState icon={CreditCard} title="No payments yet" />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {MOCK_ORDER_STATUS_BREAKDOWN.map((s) => (
            <div key={s.status} className="rounded-[16px] border border-black/[0.06] bg-white p-4">
              <span
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.04em]"
                style={{ color: s.tone }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.tone }} />
                {s.status}
              </span>
              <p className="mt-2 text-[19px] font-bold text-[#111217]">{s.count.toLocaleString("en-IN")}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

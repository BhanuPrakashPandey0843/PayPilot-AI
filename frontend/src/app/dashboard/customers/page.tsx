import { UserPlus } from "lucide-react";

import { DashboardPageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/states/EmptyState";

// No customer mock data exists yet — this list intentionally renders an
// empty state rather than fabricating fake customer records.
export default function CustomersPage() {
  return (
    <div>
      <DashboardPageHeader title="Customers" description="Everyone who's bought from you, in one place." />
      <EmptyState
        icon={UserPlus}
        title="No customers yet"
        description="Customers created via checkout or the API will show up here."
      />
    </div>
  );
}

import { Users, KeyRound } from "lucide-react";

import { DashboardPageHeader } from "@/components/dashboard/PageHeader";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { AuthField } from "@/components/auth/AuthField";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { EmptyState } from "@/components/states/EmptyState";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <DashboardPageHeader title="Settings" description="Organization details, team members, and API access." />

      <section>
        <SectionHeader title="Organization" />
        {/* UI shell only — not wired to a PATCH /organizations endpoint yet */}
        <form className="max-w-md space-y-4 rounded-[18px] border border-black/[0.06] bg-white p-5">
          <AuthField id="orgName" label="Organization name" placeholder="Your organization" />
          <div className="grid grid-cols-2 gap-3">
            <AuthField id="currency" label="Currency" defaultValue="INR" />
            <AuthField id="timezone" label="Timezone" defaultValue="Asia/Kolkata" />
          </div>
          <AuthSubmitButton type="button" className="w-fit px-6">
            Save
          </AuthSubmitButton>
        </form>
      </section>

      <section>
        <SectionHeader title="Team members" />
        <EmptyState
          icon={Users}
          title="No members yet"
          description="Roles are data-driven (ORG_ADMIN, OPERATIONS, FINANCE, SUPPORT, VIEWER) — invite teammates once the invite flow is wired up."
        />
      </section>

      <section>
        <SectionHeader title="API access" action={<KeyRound className="h-3.5 w-3.5 text-[#A9AAB1]" strokeWidth={1.75} />} />
        <EmptyState title="No API keys yet" description="API key management isn't built yet — auth currently uses email/password + JWT." />
      </section>
    </div>
  );
}

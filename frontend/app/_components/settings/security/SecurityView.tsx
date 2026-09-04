"use client";

import { useState } from "react";
import { LogOut, ShieldAlert } from "lucide-react";
import { useSession } from "@/hooks/useSession";
import { useCurrentUserDetails, useLoginActivity } from "@/hooks/useSecuritySettings";
import { SecurityPageHeader } from "./SecurityPageHeader";
import { SecurityOverviewCard } from "./SecurityOverviewCard";
import { PasswordSecurityCard } from "./PasswordSecurityCard";
import { TwoFactorCard } from "./TwoFactorCard";
import { ActiveSessionsCard } from "./ActiveSessionsCard";
import { LoginActivityCard } from "./LoginActivityCard";
import { SignOutDialog } from "./SignOutDialog";

/**
 * Security Settings (/settings/security) — the authenticated user's own
 * account security, assembled from what the backend actually supports
 * today:
 *
 *  - GET /auth/me (useCurrentUserDetails) — real status/lastLoginAt.
 *  - GET /audit?... (useLoginActivity) — real login history, this
 *    account only.
 *  - Password change, 2FA, and multi-device sessions have no backend
 *    support yet (see PasswordSecurityCard / TwoFactorCard /
 *    ActiveSessionsCard's individual doc comments for the exact
 *    missing contract each one is written against) — each section
 *    says so honestly rather than faking success.
 *
 * No RBAC gate here (unlike ProductsView/CustomersView's canRead
 * block): every section on this page reads only the signed-in user's
 * own data (getMe / audit scoped to their own userId), so there's
 * nothing to hide from a lower-permission role — the sidebar link
 * being gated on organizations.update just controls discoverability,
 * same as RolesView (also organizations.update-gated) not adding a
 * redundant in-page block for its own read-only, non-sensitive content.
 */
export function SecurityView() {
  const { session, logout } = useSession();
  const userDetails = useCurrentUserDetails();
  const loginActivity = useLoginActivity(session?.user.id);
  const [signOutOpen, setSignOutOpen] = useState(false);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <SecurityPageHeader />

      <SecurityOverviewCard lastLoginAt={userDetails.data?.lastLoginAt} />

      <PasswordSecurityCard />

      <TwoFactorCard />

      <ActiveSessionsCard onSignOut={() => setSignOutOpen(true)} />

      <LoginActivityCard result={loginActivity} />

      {/* Danger zone */}
      <div className="rounded-3xl border border-[var(--accent-rose)]/20 bg-[var(--accent-rose)]/[0.03] p-6">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="h-4 w-4 text-[var(--accent-rose)]" />
          <p className="text-sm font-medium text-[var(--accent-rose)]">Security actions</p>
        </div>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-200">Sign out of this device</p>
            <p className="mt-0.5 max-w-sm text-xs text-zinc-500">
              Ends your current PayPilot AI session on this browser. You&apos;ll need to log in again.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSignOutOpen(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[var(--accent-rose)]/30 px-4 py-2 text-sm font-medium text-[var(--accent-rose)] transition-colors hover:bg-[var(--accent-rose)]/10"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </div>

      {signOutOpen && (
        <SignOutDialog
          onClose={() => setSignOutOpen(false)}
          onConfirm={() => {
            setSignOutOpen(false);
            logout();
          }}
        />
      )}
    </div>
  );
}

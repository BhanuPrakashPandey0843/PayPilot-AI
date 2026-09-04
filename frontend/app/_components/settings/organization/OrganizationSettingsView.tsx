"use client";

import { Hash, Circle } from "lucide-react";
import { useSession } from "@/hooks/useSession";
import { useOrganizationSettings } from "@/hooks/useOrganizationSettings";
import { roleHasPermission } from "@/lib/permissions";
import { OrganizationHeader } from "./OrganizationHeader";
import { OrganizationSettingsForm } from "./OrganizationSettingsForm";
import { CardSkeleton, ErrorNote } from "../../dashboard/home/Skeletons";

const STATUS_COLOR: Record<string, string> = {
  active: "var(--accent-emerald)",
  suspended: "var(--accent-amber)",
  inactive: "var(--accent-rose)",
};

/**
 * Organization Settings (/settings/organization) - backed by the new
 * GET/PATCH /organizations/me routes (backend/src/modules/
 * organizations/), added specifically to complete this page: the
 * organizations table already had real name/currency/timezone columns,
 * but no route exposed them before this.
 *
 * organizations.read (every role, per backend/scripts/seed.ts) gates
 * viewing the page at all; organizations.update (ORG_ADMIN only today)
 * gates whether the form is editable vs. read-only text - mirrors
 * ProductsView/CustomersView's canRead pattern, plus a second,
 * finer-grained canEdit check the form component itself uses.
 */
export function OrganizationSettingsView() {
  const { session } = useSession();
  const canRead = roleHasPermission(session?.role, "organizations.read");
  const canEdit = roleHasPermission(session?.role, "organizations.update");

  const org = useOrganizationSettings();

  if (session && !canRead) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
        <p className="text-sm font-medium text-zinc-200">You don&apos;t have access to Organization settings</p>
        <p className="max-w-xs text-xs text-zinc-500">
          Ask an organization admin to grant you the organizations.read permission.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <OrganizationHeader />

      {org.error && !org.data && <ErrorNote message={org.error} onRetry={org.refetch} />}

      {org.isLoading && !org.data && (
        <div className="space-y-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      )}

      {org.data && (
        <>
          <div className="rounded-3xl border border-[var(--border-subtle)] bg-white/[0.02] p-6">
            <p className="text-sm font-medium text-white">Workspace</p>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-zinc-500">Slug</p>
                <p className="mt-1 flex items-center gap-1 truncate font-mono text-sm text-zinc-300">
                  <Hash className="h-3 w-3 shrink-0 text-zinc-600" />
                  {org.data.slug}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Status</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm capitalize text-zinc-300">
                  <Circle
                    className="h-2 w-2 shrink-0"
                    fill={STATUS_COLOR[org.data.status] ?? "var(--border-strong)"}
                    stroke="none"
                  />
                  {org.data.status}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Created</p>
                <p className="mt-1 text-sm text-zinc-300">
                  {new Date(org.data.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>

          <OrganizationSettingsForm
            organization={org.data}
            canEdit={canEdit}
            onSaved={(updated) => {
              // Cheaper than a full refetch: the PATCH response already
              // is the fresh row, so just refetch to reconcile
              // useApiResource's cached copy with it.
              void updated;
              org.refetch();
            }}
          />
        </>
      )}
    </div>
  );
}

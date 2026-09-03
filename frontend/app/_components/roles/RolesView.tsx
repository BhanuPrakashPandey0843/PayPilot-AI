"use client";

import { useEffect, useRef, useState } from "react";
import { Wrench } from "lucide-react";
import { useSession } from "@/hooks/useSession";
import { ROLE_NAMES, type RoleName } from "@/lib/permissions";
import { RolesHero } from "./RolesHero";
import { RoleCards } from "./RoleCards";
import { PermissionMatrix } from "./PermissionMatrix";
import { RoleInsights } from "./RoleInsights";

function isRoleName(value: string | undefined): value is RoleName {
  return !!value && (ROLE_NAMES as string[]).includes(value);
}

/** Roles & Permissions (/roles) — entirely frontend, sourced from
 * lib/permissions.ts's client-side mirror of the backend's seeded
 * roles/permissions/role_permissions tables. No custom-role creation
 * here: the backend has no route for it (roles are seed-defined, not
 * CRUD), so that part of the original brief is represented honestly
 * below as "not available yet" rather than a form that would submit
 * to nothing. */
export function RolesView() {
  const { session } = useSession();
  const sessionRole = session?.role;
  const [selectedRole, setSelectedRole] = useState<RoleName>(
    isRoleName(sessionRole) ? sessionRole : "ORG_ADMIN"
  );

  // session loads asynchronously (see useSession's doc comment) — once
  // the real role arrives, default the selection to it, but only if the
  // user hasn't already clicked a different role card themselves.
  const userPicked = useRef(false);
  useEffect(() => {
    if (!userPicked.current && isRoleName(sessionRole)) setSelectedRole(sessionRole);
  }, [sessionRole]);

  function handleSelect(role: RoleName) {
    userPicked.current = true;
    setSelectedRole(role);
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <RolesHero organizationName={session?.organization.name ?? "your workspace"} />

      <RoleCards currentRole={session?.role} selectedRole={selectedRole} onSelect={handleSelect} />

      <PermissionMatrix selectedRole={selectedRole} />

      <RoleInsights />

      <div className="flex items-center gap-3 rounded-3xl border border-dashed border-[var(--border-subtle)] bg-white/[0.01] p-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.04]">
          <Wrench className="h-4 w-4 text-zinc-500" />
        </span>
        <div>
          <p className="text-sm font-medium text-zinc-300">Custom roles</p>
          <p className="text-xs text-zinc-500">
            Roles are currently fixed to the five above. Creating custom roles with hand-picked permissions isn&apos;t
            supported by the backend yet.
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { Check, Minus, Search } from "lucide-react";
import {
  ALL_PERMISSIONS,
  ROLE_NAMES,
  formatRoleLabel,
  permissionsForRole,
  type RoleName,
  type PermissionName,
} from "@/lib/permissions";
import { PERMISSION_CATEGORIES, categoryLabel, permissionCategory, PERMISSION_DESCRIPTIONS, ROLE_ACCENT } from "./roleMeta";

interface PermissionMatrixProps {
  selectedRole: RoleName;
}

export function PermissionMatrix({ selectedRole }: PermissionMatrixProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("");

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = ALL_PERMISSIONS.filter((p) => {
      if (category && permissionCategory(p) !== category) return false;
      if (!q) return true;
      return p.toLowerCase().includes(q) || PERMISSION_DESCRIPTIONS[p].toLowerCase().includes(q);
    });

    const groups = new Map<string, typeof filtered>();
    for (const cat of PERMISSION_CATEGORIES) {
      const rows = filtered.filter((p) => permissionCategory(p) === cat);
      if (rows.length > 0) groups.set(cat, rows);
    }
    return Array.from(groups.entries());
  }, [query, category]);

  return (
    <div className="rounded-3xl border border-[var(--border-subtle)] bg-white/[0.02] p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-white">Permission matrix</p>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search permission…"
              className="w-48 rounded-lg border border-[var(--border-subtle)] bg-white/[0.02] py-1.5 pl-8 pr-2 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-[var(--border-strong)]"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-[var(--border-subtle)] bg-white/[0.02] px-2 py-1.5 text-xs text-white outline-none focus:border-[var(--border-strong)]"
          >
            <option value="">All categories</option>
            {PERMISSION_CATEGORIES.map((c) => (
              <option key={c} value={c} className="bg-[var(--background-elevated)]">
                {categoryLabel(c)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 max-h-[560px] overflow-auto rounded-2xl border border-[var(--border-subtle)]">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-[var(--background-elevated)]">
            <tr className="text-xs uppercase tracking-wide text-zinc-500">
              <th className="sticky left-0 z-20 min-w-[220px] bg-[var(--background-elevated)] px-4 py-3 text-left font-medium">
                Permission
              </th>
              {ROLE_NAMES.map((role) => (
                <th
                  key={role}
                  className={`px-3 py-3 text-center font-medium ${role === selectedRole ? "text-white" : ""}`}
                  style={role === selectedRole ? { color: ROLE_ACCENT[role] } : undefined}
                >
                  {formatRoleLabel(role)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grouped.length === 0 && (
              <tr>
                <td colSpan={ROLE_NAMES.length + 1} className="py-10 text-center text-sm text-zinc-500">
                  No permissions match this search.
                </td>
              </tr>
            )}

            {grouped.map(([cat, perms]) => (
              <PermissionGroup key={cat} category={cat} perms={perms} selectedRole={selectedRole} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PermissionGroup({
  category,
  perms,
  selectedRole,
}: {
  category: string;
  perms: PermissionName[];
  selectedRole: RoleName;
}) {
  return (
    <>
      <tr className="border-t border-[var(--border-subtle)] bg-white/[0.015]">
        <td
          colSpan={ROLE_NAMES.length + 1}
          className="sticky left-0 px-4 py-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500"
        >
          {categoryLabel(category)}
        </td>
      </tr>
      {perms.map((permission) => (
        <tr key={permission} className="border-t border-[var(--border-subtle)]/60 group/row hover:bg-white/[0.02]">
          <td className="sticky left-0 z-10 min-w-[220px] bg-[var(--background)] px-4 py-2.5 group-hover/row:bg-white/[0.02]" title={PERMISSION_DESCRIPTIONS[permission]}>
            <p className="font-mono text-xs text-zinc-300">{permission}</p>
            <p className="text-[11px] text-zinc-500">{PERMISSION_DESCRIPTIONS[permission]}</p>
          </td>
          {ROLE_NAMES.map((role) => {
            const granted = permissionsForRole(role).includes(permission);
            return (
              <td
                key={role}
                className={`px-3 py-2.5 text-center ${role === selectedRole ? "bg-white/[0.02]" : ""}`}
              >
                {granted ? (
                  <Check
                    className="mx-auto h-4 w-4 transition-transform duration-200 group-hover/row:scale-110"
                    style={{ color: ROLE_ACCENT[role] }}
                  />
                ) : (
                  <Minus className="mx-auto h-3.5 w-3.5 text-zinc-700" />
                )}
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}

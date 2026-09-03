"use client";

import { ROLE_NAMES, ROLE_DESCRIPTIONS, permissionsForRole, formatRoleLabel, type RoleName } from "@/lib/permissions";
import { ROLE_ACCENT, ROLE_ICON } from "./roleMeta";

interface RoleCardsProps {
  currentRole: string | undefined;
  selectedRole: RoleName;
  onSelect: (role: RoleName) => void;
}

/** One card per role. Clicking a card scopes the Permission Matrix below
 * to just that role's column (selectedRole) — the matrix itself always
 * shows all 5 for comparison, this just controls which one gets
 * highlighted/scrolled to. No member counts here: there's no team/
 * membership endpoint on the backend to source a real number from (see
 * the /team page's own honesty note), so this only shows what's real —
 * description + permission count. */
export function RoleCards({ currentRole, selectedRole, onSelect }: RoleCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {ROLE_NAMES.map((role) => {
        const Icon = ROLE_ICON[role];
        const color = ROLE_ACCENT[role];
        const count = permissionsForRole(role).length;
        const isYours = currentRole === role;
        const isSelected = selectedRole === role;

        return (
          <button
            key={role}
            type="button"
            onClick={() => onSelect(role)}
            className={`group relative overflow-hidden rounded-3xl border p-5 text-left transition-all duration-300 hover:-translate-y-0.5 ${
              isSelected
                ? "border-[var(--border-strong)] bg-white/[0.05]"
                : "border-[var(--border-subtle)] bg-white/[0.02] hover:bg-white/[0.04]"
            }`}
          >
            <div
              className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20 blur-2xl transition-opacity duration-300 group-hover:opacity-30"
              style={{ background: color }}
            />
            <div className="flex items-center justify-between">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: `color-mix(in srgb, ${color} 18%, transparent)` }}
              >
                <Icon className="h-4 w-4" style={{ color }} />
              </span>
              {isYours && (
                <span className="rounded-full border border-[var(--border-subtle)] bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-zinc-300">
                  Your role
                </span>
              )}
            </div>
            <p className="mt-3 text-base font-semibold text-white">{formatRoleLabel(role)}</p>
            <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{ROLE_DESCRIPTIONS[role]}</p>
            <p className="mt-3 text-[11px] font-medium" style={{ color }}>
              {count} permissions
            </p>
          </button>
        );
      })}
    </div>
  );
}

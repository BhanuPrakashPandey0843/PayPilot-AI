"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, X } from "lucide-react";
import { BrandLogo } from "../BrandLogo";
import { NAV_GROUPS } from "./navConfig";
import { formatRoleLabel, roleHasPermission } from "@/lib/permissions";
import type { PermissionName } from "@/lib/permissions";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  role: string | undefined;
  organizationName: string | undefined;
}

/**
 * Left navigation. Solid elevated surface (--background-elevated), not
 * glass — this product's dashboard is meant to feel dense and
 * operational, and a blurred backdrop over scrolling content is more
 * "marketing site" than "control room". The marketing Navbar keeps its
 * glass-panel treatment; this component intentionally does not use it.
 *
 * Desktop: fixed width, collapses to an icon rail (Step 5). Mobile:
 * off-canvas drawer with a plain scrim backdrop (Step 6) — no blur
 * there either, for the same reason plus mobile GPU cost.
 */
export function Sidebar({
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
  role,
  organizationName,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile scrim */}
      <div
        aria-hidden="true"
        onClick={onCloseMobile}
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity duration-300 lg:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        data-shell-sidebar
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-[var(--border-subtle)] bg-[var(--background-elevated)] transition-[width,transform] duration-300 ease-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:sticky lg:inset-auto lg:top-0 lg:h-screen lg:translate-x-0 ${
          collapsed ? "lg:w-[88px]" : "lg:w-[280px]"
        }`}
      >
        {/* Logo / workspace */}
        <div className="flex h-20 shrink-0 items-center gap-3 border-b border-[var(--border-subtle)] px-5">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5">
            <BrandLogo className="h-7 w-[63px] shrink-0" />
            {!collapsed && (
              <span className="truncate text-sm font-semibold tracking-tight text-white">
                PayPilot AI
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close menu"
            className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-400 hover:bg-white/5 hover:text-white lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Workspace identity. Not an interactive multi-org switcher —
            organization_members ties one user to exactly one org today
            (see backend/src/db/schema/organization_members.ts), so
            there is nothing to switch between yet. Shown as a static
            summary instead of a dropdown that would fake a capability
            the backend doesn't have. */}
        {!collapsed && (
          <div className="border-b border-[var(--border-subtle)] px-5 py-4">
            <p className="truncate text-sm font-medium text-white">
              {organizationName ?? "\u00A0"}
            </p>
            {role && (
              <span className="mt-1 inline-flex items-center rounded-full border border-[var(--border-subtle)] px-2 py-0.5 text-[11px] font-medium text-[var(--muted)]">
                {formatRoleLabel(role)}
              </span>
            )}
          </div>
        )}

        {/* Nav groups */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {NAV_GROUPS.map((group) => {
            const visibleItems = group.items.filter(
              (item) => !item.permission || roleHasPermission(role, item.permission as PermissionName)
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.label} className="mb-5 last:mb-0">
                {!collapsed && (
                  <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    {group.label}
                  </p>
                )}
                <ul className="flex flex-col gap-0.5">
                  {visibleItems.map((item) => {
                    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    const Icon = item.icon;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          title={collapsed ? item.label : undefined}
                          className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-150 ${
                            active
                              ? "bg-white/[0.06] text-white"
                              : "text-zinc-400 hover:bg-white/[0.03] hover:text-white"
                          } ${collapsed ? "justify-center" : ""}`}
                        >
                          {active && (
                            <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-gradient-to-b from-[var(--accent-blue)] to-[var(--accent-cyan)]" />
                          )}
                          <Icon
                            className={`h-[18px] w-[18px] shrink-0 transition-transform duration-150 ${
                              active ? "" : "group-hover:translate-x-0.5"
                            }`}
                          />
                          {!collapsed && <span className="truncate">{item.label}</span>}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="hidden shrink-0 border-t border-[var(--border-subtle)] p-3 lg:block">
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-400 transition-colors duration-150 hover:bg-white/[0.03] hover:text-white"
          >
            <ChevronsLeft
              className={`h-[18px] w-[18px] shrink-0 transition-transform duration-300 ${
                collapsed ? "rotate-180" : ""
              }`}
            />
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

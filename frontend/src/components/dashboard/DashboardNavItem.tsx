"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { dashboardNavigation } from "@/lib/navigation";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Shared nav item list, rendered by both the desktop sidebar and the mobile sheet. */
export function DashboardNavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <ul className="space-y-0.5">
      {dashboardNavigation.map(({ label, href, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-[13px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#111217]/20",
                active
                  ? "bg-[#111217] text-white"
                  : "text-[#5F6067] hover:bg-black/[0.04] hover:text-[#111217]"
              )}
            >
              <Icon className="h-[15px] w-[15px] shrink-0" strokeWidth={1.85} />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

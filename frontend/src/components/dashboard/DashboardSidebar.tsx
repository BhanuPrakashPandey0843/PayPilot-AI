import Image from "next/image";
import Link from "next/link";

import navLogo from "@/assets/Navlogo.png";
import { DashboardNavList } from "./DashboardNavItem";

/** Fixed desktop sidebar — hidden below `lg`, replaced by `DashboardMobileNav` there. */
export function DashboardSidebar() {
  return (
    <aside className="hidden w-[240px] shrink-0 border-r border-black/[0.06] bg-white lg:flex lg:flex-col">
      <div className="flex h-16 items-center gap-2.5 border-b border-black/[0.06] px-5">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-[9px] bg-[#111217]">
            <Image src={navLogo} alt="PayPilot logo" width={20} height={20} className="h-[18px] w-[18px] object-contain" />
          </div>
          <span className="text-[14px] font-semibold tracking-tight text-[#111217]">PayPilot</span>
        </Link>
      </div>

      <nav aria-label="Dashboard" className="flex-1 overflow-y-auto px-3 py-4">
        <DashboardNavList />
      </nav>

      <div className="border-t border-black/[0.06] p-3">
        <Link
          href="/"
          className="block rounded-[10px] px-3 py-2 text-[12.5px] font-medium text-[#8A8B92] transition-colors hover:bg-black/[0.04] hover:text-[#111217]"
        >
          ← Back to site
        </Link>
      </div>
    </aside>
  );
}

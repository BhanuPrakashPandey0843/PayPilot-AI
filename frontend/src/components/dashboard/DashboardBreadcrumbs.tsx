import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type Crumb = { label: string; href?: string };

/** Breadcrumb trail for nested dashboard routes (e.g. Products → Edit product). */
export function DashboardBreadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-[12.5px]">
      {items.map((item, i) => (
        <span key={`${item.label}-${i}`} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="h-3 w-3 text-[#C7C8CE]" strokeWidth={2} />}
          {item.href ? (
            <Link href={item.href} className="text-[#8A8B92] transition-colors hover:text-[#111217]">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-[#111217]">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Standard max-width + horizontal padding wrapper used by every interior
 * page's content, matching the `max-w-6xl` rhythm already established by
 * the landing sections.
 */
export function PageContainer({
  children,
  className,
  size = "default",
}: {
  children: ReactNode;
  className?: string;
  size?: "default" | "narrow" | "wide";
}) {
  return (
    <div
      className={cn(
        "relative mx-auto w-full px-5 sm:px-6 lg:px-8",
        size === "narrow" && "max-w-4xl",
        size === "default" && "max-w-6xl",
        size === "wide" && "max-w-7xl",
        className
      )}
    >
      {children}
    </div>
  );
}

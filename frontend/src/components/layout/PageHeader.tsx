import type { ReactNode } from "react";

import { FadeIn } from "@/components/animations/FadeIn";
import { cn } from "@/lib/utils";

/**
 * Shared hero/header block for interior (non-landing) pages: eyebrow
 * badge, large heading with an optional italic serif accent word, and
 * a supporting paragraph. Matches the landing page's heading scale and
 * tracking so every route reads as part of the same product.
 */
export function PageHeader({
  eyebrow,
  eyebrowIcon,
  title,
  accent,
  description,
  align = "center",
  className,
  children,
}: {
  eyebrow?: string;
  eyebrowIcon?: ReactNode;
  title: ReactNode;
  accent?: string;
  description?: ReactNode;
  align?: "center" | "left";
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className
      )}
    >
      {eyebrow && (
        <FadeIn>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.06] bg-white/70 px-[10px] py-[6px] text-[10px] font-medium text-[#55565D] backdrop-blur-sm sm:text-[11px]">
            {eyebrowIcon}
            <span>{eyebrow}</span>
          </div>
        </FadeIn>
      )}

      <FadeIn delay={0.08}>
        <h1
          className={cn(
            "mt-5 max-w-[820px] text-[38px] font-extrabold leading-[1.02] tracking-[-0.035em] text-[#111217] sm:mt-6 sm:text-[52px] sm:leading-[1] lg:text-[64px] lg:leading-[0.98] lg:tracking-[-0.04em]"
          )}
        >
          {title}
          {accent && (
            <>
              {" "}
              <span className="font-serif italic font-medium">{accent}</span>
            </>
          )}
        </h1>
      </FadeIn>

      {description && (
        <FadeIn delay={0.16}>
          <p
            className={cn(
              "mt-5 max-w-[620px] text-[14px] leading-[1.6] text-[#5F6067] sm:mt-6 sm:text-[16px] lg:text-[17px]",
              align === "center" ? "mx-auto" : ""
            )}
          >
            {description}
          </p>
        </FadeIn>
      )}

      {children}
    </div>
  );
}

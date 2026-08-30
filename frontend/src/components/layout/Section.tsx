import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { PageContainer } from "./PageContainer";

type SectionTone = "light" | "dark" | "muted";

const TONE_CLASSES: Record<SectionTone, string> = {
  light: "bg-[#FAFAF8]",
  dark: "bg-[#111217] text-white",
  muted: "bg-gradient-to-b from-[#FAFAF8] via-[#FDFDFC] to-white",
};

/**
 * Full-width section band with the app's standard vertical rhythm and
 * background tones. Wraps its children in `PageContainer` unless `raw`
 * is set (for sections that need to manage their own inner width, e.g.
 * full-bleed dark panels with an inset card).
 */
export function Section({
  children,
  className,
  containerClassName,
  tone = "light",
  raw = false,
  id,
  containerSize = "default",
}: {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  tone?: SectionTone;
  raw?: boolean;
  id?: string;
  containerSize?: "default" | "narrow" | "wide";
}) {
  return (
    <section
      id={id}
      className={cn(
        "relative isolate w-full overflow-hidden px-0 py-16 scroll-mt-24 sm:py-20 lg:py-24",
        TONE_CLASSES[tone],
        className
      )}
    >
      {raw ? children : (
        <PageContainer size={containerSize} className={containerClassName}>
          {children}
        </PageContainer>
      )}
    </section>
  );
}

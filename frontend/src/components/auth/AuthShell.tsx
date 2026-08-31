import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import navLogo from "@/assets/Navlogo.png";

/**
 * Minimal, chrome-free shell for every `/auth/*` page — no marketing
 * Navbar/Footer, just the mark, an optional back link, and a centered
 * card. Keeps auth flows focused and fast to load.
 */
export function AuthShell({
  title,
  description,
  children,
  footer,
  backHref = "/",
  backLabel = "Back to home",
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#FAFAF8] px-5 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_top,_rgba(140,123,224,0.16),_transparent_60%)]"
      />

      <div className="relative z-10 flex w-full max-w-[400px] flex-col items-center">
        <Link
          href={backHref}
          className="group mb-6 inline-flex items-center gap-1.5 self-start text-[12.5px] font-medium text-[#5F6067] transition-colors hover:text-[#111217]"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover:-translate-x-0.5" />
          {backLabel}
        </Link>

        <Link href="/" className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-[10px] bg-[#111217] shadow-[0_10px_24px_rgba(17,18,23,0.18)]">
          <Image src={navLogo} alt="PayPilot logo" width={22} height={22} className="h-[20px] w-[20px] object-contain" priority />
        </Link>

        <h1 className="mt-4 text-center text-[24px] font-extrabold tracking-[-0.02em] text-[#111217] sm:text-[26px]">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-xs text-center text-[13px] leading-[1.5] text-[#5F6067]">
            {description}
          </p>
        )}

        <div className="mt-7 w-full rounded-[22px] border border-black/[0.06] bg-white p-6 shadow-[0_20px_50px_-24px_rgba(20,20,30,0.16)] sm:p-7">
          {children}
        </div>

        {footer && <div className="mt-5 text-center text-[12.5px] text-[#5F6067]">{footer}</div>}
      </div>
    </div>
  );
}

import type { ReactNode } from "react";

import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

/**
 * Shared chrome for every public marketing/interior page that isn't the
 * home page (home renders `Navbar` itself inside `Hero`, and its own
 * `Footer` at the end of the section list — reusing this wrapper there
 * would double both).
 *
 * `Navbar` is absolutely positioned (it floats over the Hero background),
 * so every consumer needs the same top offset reserved for it — matching
 * the `pt-[104px] sm:pt-[132px] lg:pt-[150px]` rhythm already established
 * by `Hero` and `LegalPage`.
 */
export function MarketingPage({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#FAFAF8]">
      <Navbar />
      <main className="flex flex-1 flex-col pt-[104px] sm:pt-[132px] lg:pt-[150px]">
        {children}
      </main>
      <Footer />
    </div>
  );
}

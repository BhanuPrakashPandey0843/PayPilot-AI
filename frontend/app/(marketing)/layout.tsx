import type { ReactNode } from "react";
import Footer from "../_components/Footer";

/**
 * Shared shell for every public-website page (Home, Demo, About, Contact Us,
 * Privacy Policy, Terms of Service). Route group only — adds no path segment.
 */
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      {/* TODO: public site nav (Home / Demo / About / Contact / Security / Login) */}
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
    </div>
  );
}

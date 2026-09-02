import type { ReactNode } from "react";
import Navbar from "../_components/Navbar";
import Footer from "../_components/Footer";

/**
 * Shared shell for every public-website page (Home, Demo, About, Contact Us,
 * Privacy Policy, Terms of Service). Route group only — adds no path segment.
 * Navbar is `fixed`, so `pt-16` on <main> reserves the space it would
 * otherwise overlap (matches the nav's own h-16).
 */
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <Navbar />
      <main className="flex flex-1 flex-col pt-16">{children}</main>
      <Footer />
    </div>
  );
}

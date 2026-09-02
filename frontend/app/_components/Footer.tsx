import { Mail } from "lucide-react";
import { SectionBadge } from "./SectionBadge";
import { BrandLogo } from "./BrandLogo";

const PAGE_LINKS = [
  { label: "Home", href: "/" },
  { label: "Demo", href: "/demo" },
  { label: "Login", href: "/login" },
];

const COMPANY_LINKS = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact-us" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms of Service", href: "/terms-of-service" },
];

const currentYear = new Date().getFullYear();

/**
 * Single site-wide footer, owned exclusively by the (marketing) route
 * group's layout — do not also render this from the root layout, or it
 * shows twice on every public page.
 */
export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-black">
      <div className="mx-auto max-w-6xl px-6 pt-16">
        {/* Newsletter */}
        <div className="flex flex-col gap-8 border-b border-white/10 pb-12 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <SectionBadge label="Newsletter" />
            <h2 className="mt-4 max-w-md text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Get operational insights and signals, straight to your inbox
            </h2>
          </div>

          <form className="flex w-full max-w-sm items-center gap-1 rounded-full border border-white/15 bg-white/[0.03] p-1 pl-4">
            <Mail className="h-4 w-4 shrink-0 text-zinc-500" />
            <input
              type="email"
              placeholder="example@company.com"
              className="w-full bg-transparent px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
            />
            <button
              type="submit"
              className="shrink-0 rounded-full bg-white px-5 py-2 text-sm font-medium text-black transition-transform duration-200 hover:scale-[1.03] active:scale-95"
            >
              Subscribe
            </button>
          </form>
        </div>

        {/* Brand + link columns */}
        <div className="flex flex-col gap-12 py-12 lg:flex-row lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BrandLogo className="h-6 w-[54px]" />
              <span className="text-lg font-semibold text-white">PayPilot AI</span>
            </div>
            <p className="mt-3 text-sm text-zinc-500">
              &copy; {currentYear} PayPilot AI. All rights reserved.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-10 gap-y-8 sm:grid-cols-3">
            <div>
              <h3 className="text-sm font-semibold text-white">Pages</h3>
              <ul className="mt-4 space-y-3">
                {PAGE_LINKS.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-sm text-zinc-500 transition-colors hover:text-white"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white">Company</h3>
              <ul className="mt-4 space-y-3">
                {COMPANY_LINKS.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-sm text-zinc-500 transition-colors hover:text-white"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white">Contact</h3>
              <ul className="mt-4 space-y-3 text-sm text-zinc-500">
                <li>
                  <a href="mailto:hello@paypilot.ai" className="transition-colors hover:text-white">
                    hello@paypilot.ai
                  </a>
                </li>
                <li>Bengaluru, India</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Oversized faint wordmark */}
      <div
        aria-hidden="true"
        className="pointer-events-none flex items-center justify-center gap-3 overflow-hidden pb-4 text-[18vw] leading-none font-bold text-white/[0.04] select-none sm:gap-4"
      >
        <span className="opacity-[0.55]">
          <BrandLogo className="h-[12vw] w-[26.9vw]" />
        </span>
        PayPilot
      </div>
    </footer>
  );
}

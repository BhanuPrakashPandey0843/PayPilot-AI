"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Mail, Code2, Sparkles, ArrowUpRight } from "lucide-react";

type IconComponent = ComponentType<{ className?: string }>;

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 .5C5.73.5.98 5.24.98 11.52c0 4.94 3.2 9.13 7.65 10.61.56.1.76-.24.76-.54 0-.27-.01-1.16-.02-2.11-3.11.68-3.77-1.32-3.77-1.32-.51-1.3-1.24-1.65-1.24-1.65-1.01-.69.08-.68.08-.68 1.12.08 1.71 1.15 1.71 1.15.99 1.7 2.6 1.21 3.24.92.1-.72.39-1.21.71-1.49-2.48-.28-5.1-1.24-5.1-5.53 0-1.22.44-2.22 1.15-3-.11-.28-.5-1.42.11-2.96 0 0 .94-.3 3.08 1.15a10.7 10.7 0 0 1 5.6 0c2.14-1.45 3.08-1.15 3.08-1.15.61 1.54.22 2.68.11 2.96.72.78 1.15 1.78 1.15 3 0 4.3-2.63 5.24-5.13 5.52.4.35.76 1.03.76 2.08 0 1.5-.01 2.71-.01 3.08 0 .3.2.65.77.54A11.03 11.03 0 0 0 23.02 11.5C23.02 5.24 18.27.5 12 .5Z" />
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5ZM.24 8.25h4.5V23H.24V8.25ZM8.34 8.25h4.32v2.02h.06c.6-1.13 2.06-2.32 4.24-2.32 4.53 0 5.37 2.98 5.37 6.86V23h-4.5v-6.55c0-1.56-.03-3.57-2.18-3.57-2.18 0-2.52 1.7-2.52 3.46V23h-4.5V8.25Z" />
    </svg>
  );
}

type FooterColumn = {
  heading: string;
  links: { label: string; href: string }[];
};

const CONTACT_EMAIL = "bhanupandey0843@gmail.com";

const FOOTER_LINKS: FooterColumn[] = [
  {
    heading: "Company",
    links: [
      { label: "About Us", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Contact", href: `mailto:${CONTACT_EMAIL}` },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Documentation", href: "#" },
      { label: "Help Center", href: "#" },
      { label: "FAQ", href: "#faq" },
      { label: "Security", href: "#security" },
    ],
  },
  {
    heading: "Product",
    links: [
      { label: "Features", href: "#product" },
      { label: "Pricing", href: "#" },
      { label: "Integrations", href: "#" },
      { label: "AI Platform", href: "#product" },
    ],
  },
];

const SOCIALS: { label: string; icon: IconComponent; href: string }[] = [
  {
    label: "LinkedIn",
    icon: LinkedinIcon,
    href: "https://www.linkedin.com/in/bhanu-prakash-pandey-67727b318/",
  },
  {
    label: "GitHub",
    icon: GithubIcon,
    href: "https://github.com/BhanuPrakashPandey0843",
  },
  {
    label: "LeetCode",
    icon: Code2,
    href: "https://leetcode.com/u/3JWvaBbqIs/",
  },
  {
    label: "Email",
    icon: Mail,
    href: "mailto:bhanupandey0843@gmail.com",
  },
];

export function Footer() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const resolveHref = (href: string) => (href.startsWith("#") && !isHome ? `/${href}` : href);

  return (
    <footer className="relative">
      {/* CTA panel */}
      <div className="relative overflow-hidden bg-[#FAFAF8] px-5 pb-16 pt-20 text-center sm:pb-20 sm:pt-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[420px]"
          style={{
            background:
              "radial-gradient(42% 55% at 8% 100%, rgba(140,123,224,0.32) 0%, rgba(140,123,224,0) 70%), " +
              "radial-gradient(42% 55% at 92% 100%, rgba(140,123,224,0.32) 0%, rgba(140,123,224,0) 70%)",
          }}
        />

        <div className="relative mx-auto max-w-2xl">
          <h2 className="text-[clamp(1.6rem,5vw,2.5rem)] font-extrabold leading-[1.15] tracking-[-0.03em] text-[#111217]">
            Ready to put your commerce
            <br />
            <span className="inline-flex items-center gap-2 font-serif font-medium italic text-[#111217]">
              on autopilot
              <Sparkles
                className="h-[0.8em] w-[0.8em] shrink-0 text-[#8C7BE0]"
                strokeWidth={1.75}
              />
              ?
            </span>
          </h2>

          <p className="mx-auto mt-4 max-w-[420px] text-[13px] leading-[1.5] text-[#5F6067] sm:text-[14px]">
            Let PayPilot AI handle discovery, recommendations and checkout —
            so your team can focus on growth, not busywork.
          </p>

          <div className="mt-7 flex flex-col items-center justify-center gap-2.5 sm:mt-8 sm:flex-row">
            <motion.a
              href={resolveHref("#product")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex h-11 w-full max-w-[220px] items-center justify-center rounded-[13px] border border-black/[0.08] bg-white px-6 text-sm font-medium text-[#111217] outline-none focus-visible:ring-2 focus-visible:ring-[#111217]/30 focus-visible:ring-offset-2 sm:h-12 sm:w-auto"
            >
              See the Agents
            </motion.a>
            <motion.a
              href={`mailto:${CONTACT_EMAIL}?subject=Demo%20Request`}
              animate={{ scale: [1, 1.018, 1] }}
              transition={{
                duration: 2.6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              whileHover={{
                scale: 1.06,
                boxShadow: "0 16px 34px rgba(17,18,23,0.32)",
                transition: { duration: 0.25, ease: "easeOut" },
              }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex h-11 w-full max-w-[220px] items-center justify-center gap-1.5 rounded-[13px] bg-[#111217] px-6 text-sm font-medium text-white shadow-[0_10px_24px_rgba(17,18,23,0.18)] outline-none focus-visible:ring-2 focus-visible:ring-[#111217]/50 focus-visible:ring-offset-2 sm:h-12 sm:w-auto"
            >
              Book a Demo
              <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
            </motion.a>
          </div>
        </div>
      </div>

      {/* Dark footer */}
      <div className="relative overflow-hidden bg-[#111217] px-5 pb-8 pt-12 sm:px-8 sm:pt-14 lg:px-12">
        <div className="mx-auto flex w-full max-w-6xl flex-col">
          {/* Link columns + socials */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4 sm:gap-x-8">
            {FOOTER_LINKS.map((col) => (
              <div key={col.heading}>
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-white/40">
                  {col.heading}
                </h3>
                <ul className="mt-3 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={resolveHref(link.href)}
                        className="text-[13px] text-white/75 transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-white/40">
                Follow us
              </h3>
              <ul className="mt-3 flex flex-wrap items-center gap-2">
                {SOCIALS.map(({ label, icon: Icon, href }) => (
                  <li key={label}>
                    <motion.a
                      href={href}
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label={label}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.92 }}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/80 outline-none transition-colors hover:border-white/20 hover:text-white focus-visible:ring-2 focus-visible:ring-white/40"
                    >
                      <Icon className="h-[15px] w-[15px]" />
                    </motion.a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Contact + blurb */}
          <div className="mt-14 flex flex-col gap-6 border-t border-white/[0.08] pt-8 sm:mt-16 sm:flex-row sm:items-start sm:justify-between sm:gap-10 sm:pt-10">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-white/40">
                Our Contact
              </p>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="mt-2 block text-[13px] text-white/80 hover:text-white"
              >
                {CONTACT_EMAIL}
              </a>
            </div>
            <p className="max-w-[380px] text-[12px] leading-[1.6] text-white/45 sm:text-right">
              PayPilot AI is an autonomous commerce agent built to take
              shoppers from product discovery to a secure, explainable
              payment — no manual handoffs required.
            </p>
          </div>

          {/* Big wordmark */}
          <div className="mt-10 flex items-center justify-center overflow-hidden sm:mt-12">
            <p className="select-none whitespace-nowrap text-center font-serif text-[clamp(2.75rem,14vw,8.75rem)] italic leading-none tracking-tight text-white">
              PayPilot
            </p>
          </div>

          {/* Bottom bar */}
          <div className="mt-8 flex flex-col-reverse items-center gap-3 border-t border-white/[0.08] pt-6 sm:mt-6 sm:flex-row sm:justify-between sm:gap-0">
            <p className="text-[11px] text-white/40">
              © {new Date().getFullYear()} PayPilot AI. Built as a hackathon prototype.
            </p>
            <div className="flex items-center gap-5">
              <Link
                href="/privacy-policy"
                className="text-[11px] text-white/40 hover:text-white/70"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms-and-conditions"
                className="text-[11px] text-white/40 hover:text-white/70"
              >
                Terms & Conditions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

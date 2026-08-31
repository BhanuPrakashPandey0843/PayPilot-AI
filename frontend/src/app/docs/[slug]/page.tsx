import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MarketingPage } from "@/components/marketing/MarketingPage";
import { Section } from "@/components/layout/Section";
import { ALL_DOC_ENTRIES, DOCS_NAV, getDocEntry } from "@/lib/docs";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return ALL_DOC_ENTRIES.map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = getDocEntry(slug);

  return {
    title: entry ? `${entry.title} — Docs — PayPilot AI` : "Docs — PayPilot AI",
    description: entry?.description,
  };
}

export default async function DocArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = getDocEntry(slug);

  if (!entry) {
    notFound();
  }

  return (
    <MarketingPage>
      <Section tone="light" className="pb-16 pt-0 sm:pb-20">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
          {/* Sidebar nav */}
          <nav aria-label="Documentation" className="hidden lg:block">
            <div className="sticky top-32 space-y-6">
              {DOCS_NAV.map((group) => (
                <div key={group.heading}>
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#A9AAB1]">
                    {group.heading}
                  </p>
                  <ul className="mt-2 space-y-1">
                    {group.entries.map((item) => (
                      <li key={item.slug}>
                        <Link
                          href={`/docs/${item.slug}`}
                          className={cn(
                            "block rounded-[8px] px-2 py-1.5 text-[13px] transition-colors",
                            item.slug === slug
                              ? "bg-black/[0.05] font-medium text-[#111217]"
                              : "text-[#5F6067] hover:text-[#111217]"
                          )}
                        >
                          {item.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </nav>

          {/* Article body */}
          <article>
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8C7A16]">
              Documentation
            </p>
            <h1 className="mt-2 text-[30px] font-extrabold tracking-[-0.03em] text-[#111217] sm:text-[36px]">
              {entry!.title}
            </h1>
            <p className="mt-3 max-w-xl text-[14.5px] leading-[1.6] text-[#5F6067]">
              {entry!.description}
            </p>

            <div className="mt-8 rounded-[20px] border border-dashed border-black/[0.12] bg-[#FAFAF8] p-6">
              <p className="text-[13px] leading-[1.6] text-[#8A8B92]">
                Full reference content for this section is coming soon. In the meantime,{" "}
                <code className="rounded bg-black/[0.06] px-1.5 py-0.5 text-[12px] text-[#111217]">
                  documentation/Backend_API_Reference.md
                </code>{" "}
                in the repository has the exact request/response contracts this page will
                document.
              </p>
            </div>
          </article>
        </div>
      </Section>
    </MarketingPage>
  );
}

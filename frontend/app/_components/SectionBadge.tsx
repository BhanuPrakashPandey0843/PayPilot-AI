interface SectionBadgeProps {
  label: string;
}

/**
 * Small uppercase eyebrow label (dot + tracked text) used above section
 * headings across the marketing site — Footer's "Newsletter", Faq's "FAQ",
 * Blogs' "Blogs", etc. Centralized here so the styling only ever needs to
 * change in one place and every section stays visually identical.
 */
export function SectionBadge({ label }: SectionBadgeProps) {
  return (
    <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
      {label}
    </p>
  );
}

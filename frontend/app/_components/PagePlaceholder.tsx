interface PagePlaceholderProps {
  title: string;
  description?: string;
}

/**
 * Temporary stand-in used across every route while the UI is still being
 * designed (see PAYPILOT AI — WEBSITE & APP PAGE FLOW). It exists purely so
 * every route in the sitemap resolves to *something* real — swap it out for
 * actual markup on a page-by-page basis once designs land. Not meant to ship.
 */
export function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-16 text-center">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
        Route scaffold — UI pending
      </p>
      <h1 className="text-2xl font-semibold text-zinc-900">{title}</h1>
      {description ? (
        <p className="max-w-md text-sm text-zinc-500">{description}</p>
      ) : null}
    </div>
  );
}

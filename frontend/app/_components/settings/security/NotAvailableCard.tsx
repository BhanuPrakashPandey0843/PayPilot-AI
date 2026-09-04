import type { LucideIcon } from "lucide-react";

interface NotAvailableCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

/**
 * Same dashed-border "not supported by the backend yet" treatment as
 * RolesView's "Custom roles" note — reused here rather than invented
 * fresh, so every place this app admits a missing capability looks and
 * reads the same way.
 */
export function NotAvailableCard({ icon: Icon, title, description }: NotAvailableCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-3xl border border-dashed border-[var(--border-subtle)] bg-white/[0.01] p-5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.04]">
        <Icon className="h-4 w-4 text-zinc-500" />
      </span>
      <div>
        <p className="text-sm font-medium text-zinc-300">{title}</p>
        <p className="text-xs text-zinc-500">{description}</p>
      </div>
    </div>
  );
}

/**
 * Shared shimmer skeletons for Dashboard Home. Every widget renders one
 * of these while its `useApiResource`-backed hook is loading, so a slow
 * section never causes layout shift when its real content arrives.
 * Uses the .animate-shimmer keyframe already defined in globals.css.
 */

export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-shimmer rounded-2xl bg-white/[0.03] ${className}`} />;
}

export function KpiCardSkeleton() {
  return (
    <div className="rounded-3xl border border-[var(--border-subtle)] bg-white/[0.02] p-5">
      <SkeletonBlock className="h-4 w-24" />
      <SkeletonBlock className="mt-4 h-7 w-20" />
      <SkeletonBlock className="mt-3 h-3 w-16" />
    </div>
  );
}

export function ChartSkeleton({ height = "h-72" }: { height?: string }) {
  return (
    <div className={`rounded-3xl border border-[var(--border-subtle)] bg-white/[0.02] p-6 ${height}`}>
      <SkeletonBlock className="h-4 w-40" />
      <SkeletonBlock className="mt-6 h-[70%] w-full" />
    </div>
  );
}

export function ListRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-white/[0.02] p-3">
      <SkeletonBlock className="h-9 w-9 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <SkeletonBlock className="h-3 w-1/3" />
        <SkeletonBlock className="h-3 w-1/2" />
      </div>
      <SkeletonBlock className="h-4 w-14 shrink-0" />
    </div>
  );
}

export function CardSkeleton({ className = "h-40" }: { className?: string }) {
  return (
    <div className={`rounded-3xl border border-[var(--border-subtle)] bg-white/[0.02] p-5 ${className}`}>
      <SkeletonBlock className="h-full w-full" />
    </div>
  );
}

export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-[var(--accent-rose)]/30 bg-[var(--accent-rose)]/[0.06] p-4 text-sm text-[var(--accent-rose)]">
      <p>{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 text-xs font-medium underline underline-offset-2 hover:text-white"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}

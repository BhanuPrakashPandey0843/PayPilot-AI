/**
 * Shared formatting helpers for Dashboard Home. Every money value from
 * the backend is an integer in minor units (paise for INR — see
 * lib/api/dashboard.ts / backend products.routes.ts's "Integer minor
 * units, e.g. paise" doc comment), so dividing by 100 lives in exactly
 * one place instead of being repeated (and risking drift) per widget.
 */

export function formatMoney(minor: number | null | undefined, currency = "INR"): string {
  if (minor === null || minor === undefined) return "—";
  const major = minor / 100;
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: major >= 100000 ? 0 : 2,
    }).format(major);
  } catch {
    return `${currency} ${major.toLocaleString("en-IN")}`;
  }
}

/** Compact form for tight card headlines — ₹1.2L instead of ₹1,20,000. */
export function formatMoneyCompact(minor: number | null | undefined, currency = "INR"): string {
  if (minor === null || minor === undefined) return "—";
  const major = minor / 100;
  const symbol = currency === "INR" ? "₹" : `${currency} `;
  if (Math.abs(major) >= 10000000) return `${symbol}${(major / 10000000).toFixed(2)}Cr`;
  if (Math.abs(major) >= 100000) return `${symbol}${(major / 100000).toFixed(2)}L`;
  if (Math.abs(major) >= 1000) return `${symbol}${(major / 1000).toFixed(1)}K`;
  return `${symbol}${major.toFixed(major % 1 === 0 ? 0 : 2)}`;
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-IN").format(value);
}

export function formatPercent(value: number | null | undefined, opts: { signed?: boolean } = {}): string {
  if (value === null || value === undefined) return "—";
  const sign = opts.signed && value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffSec = Math.round(diffMs / 1000);
  if (diffSec < 5) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/** Human label for a bucket key from /analytics/revenue's `series`
 * (day-granularity ISO date strings, per analytics.repository.ts). */
export function formatBucketLabel(bucket: string): string {
  const d = new Date(bucket);
  if (Number.isNaN(d.getTime())) return bucket;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

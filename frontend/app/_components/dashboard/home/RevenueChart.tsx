"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { UseApiResourceResult } from "@/hooks/useApiResource";
import type { RevenueTrend } from "@/lib/api/dashboard";
import { formatBucketLabel, formatMoney, formatMoneyCompact, formatPercent } from "./formatters";
import { ChartSkeleton, ErrorNote } from "./Skeletons";

interface RevenueChartProps {
  trend: UseApiResourceResult<RevenueTrend>;
  currency: string;
}

interface TooltipPayloadItem {
  value: number;
}

function ChartTooltip({ active, payload, label, currency }: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  currency: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--background-elevated)] px-3 py-2 text-xs shadow-[0_16px_40px_-12px_rgba(0,0,0,0.6)]">
      <p className="text-zinc-400">{label ? formatBucketLabel(label) : ""}</p>
      <p className="mt-0.5 font-semibold text-white">{formatMoney(payload[0]?.value, currency)}</p>
    </div>
  );
}

/** Step 7 — revenue-over-time area chart, sourced from GET
 * /analytics/revenue's `series`. Also renders the same endpoint's
 * current-vs-previous-period comparison as header chips instead of a
 * second chart, since that's exactly what the API already computes. */
export function RevenueChart({ trend, currency }: RevenueChartProps) {
  if (trend.error) return <ErrorNote message={trend.error} onRetry={trend.refetch} />;
  if (trend.isLoading || !trend.data) return <ChartSkeleton />;

  const { current, change, series } = trend.data;
  const revenueUp = (change.revenuePercent ?? 0) >= 0;
  const chartData = series.map((p) => ({ bucket: p.bucket, revenue: p.revenueMinor / 100 }));

  return (
    <div className="rounded-3xl border border-[var(--border-subtle)] bg-white/[0.02] p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white">Revenue over time</p>
          <p className="text-2xl font-semibold text-white">{formatMoneyCompact(current.revenueMinor, currency)}</p>
        </div>
        {change.revenuePercent !== null && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
              revenueUp
                ? "bg-[var(--accent-emerald)]/10 text-[var(--accent-emerald)]"
                : "bg-[var(--accent-rose)]/10 text-[var(--accent-rose)]"
            }`}
          >
            {revenueUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {formatPercent(change.revenuePercent, { signed: true })} vs previous period
          </span>
        )}
      </div>

      <div className="mt-4 h-64 w-full">
        {chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-zinc-500">
            No revenue in this period yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ left: -16, right: 8, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis
                dataKey="bucket"
                tickFormatter={formatBucketLabel}
                stroke="rgba(255,255,255,0.3)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                minTickGap={24}
              />
              <YAxis
                stroke="rgba(255,255,255,0.3)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => formatMoneyCompact(v * 100, currency)}
                width={64}
              />
              <Tooltip content={<ChartTooltip currency={currency} />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="var(--accent-cyan)"
                strokeWidth={2}
                fill="url(#revenueFill)"
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

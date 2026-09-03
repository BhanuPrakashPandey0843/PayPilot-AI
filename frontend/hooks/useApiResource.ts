"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api/client";

export interface UseApiResourceResult<T> {
  /** null until the first successful fetch resolves. */
  data: T | null;
  /** True only while a fetch (initial or refetch) is in flight. */
  isLoading: boolean;
  /** Human-readable message, or null. Mirrors ApiError.message so a
   * NETWORK_ERROR (backend not running) reads the same as a real 4xx. */
  error: string | null;
  refetch: () => void;
}

/**
 * Thin data-fetching hook shared by every Dashboard Home widget.
 *
 * There is no React Query in this project (see frontend/package.json —
 * it isn't a dependency, and nothing here can run `npm install` to add
 * one), so this hook is the lightweight stand-in: request-on-mount,
 * request-on-dep-change, cancellation on unmount/dep-change so a slow
 * stale response can never clobber a newer one, and a manual refetch
 * for actions like "approve opportunity" to pull fresh data afterward.
 *
 * `fetcher` is called through a ref so callers can pass an inline arrow
 * function (`() => getOverview(range)`) without that function identity
 * re-triggering the effect — only entries in `deps` do.
 */
export function useApiResource<T>(fetcher: () => Promise<T>, deps: unknown[] = []): UseApiResourceResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetcherRef
      .current()
      .then((result) => {
        if (cancelled) return;
        setData(result);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // deps is caller-controlled and intentionally the only trigger besides `tick`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  return { data, isLoading, error, refetch };
}

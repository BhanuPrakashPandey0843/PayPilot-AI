"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/states/ErrorState";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Route-level error boundary — log for now; wire into a real
    // error-reporting service once one is chosen.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAF8] px-5">
      <ErrorState kind="generic" onRetry={reset} />
    </div>
  );
}

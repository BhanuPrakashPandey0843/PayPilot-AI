"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import { AuthShell } from "@/components/auth/AuthShell";

type VerifyState = "verifying" | "success" | "error";

/**
 * UI shell only — there's no `GET/POST /auth/verify-email` route in the
 * backend yet, so this always resolves to a simulated "verifying" state.
 * Replace the effect below with a real token-verification call once the
 * endpoint exists.
 */
export default function VerifyEmailPage() {
  const [state, setState] = useState<VerifyState>("verifying");

  useEffect(() => {
    const timer = setTimeout(() => setState("success"), 900);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AuthShell title="Verify your email" description="Confirming your email address.">
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        {state === "verifying" && (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-[#8A8B92]" strokeWidth={1.75} />
            <p className="text-[13px] text-[#5F6067]">Verifying your email&hellip;</p>
          </>
        )}

        {state === "success" && (
          <>
            <CheckCircle2 className="h-9 w-9 text-[#1F9D6C]" strokeWidth={1.75} />
            <p className="text-[13.5px] font-medium text-[#111217]">Email verified</p>
            <Link
              href="/auth/login"
              className="mt-1 inline-flex h-9 items-center rounded-[11px] bg-[#111217] px-4 text-[13px] font-medium text-white outline-none transition-opacity hover:opacity-90"
            >
              Continue to sign in
            </Link>
          </>
        )}

        {state === "error" && (
          <>
            <XCircle className="h-9 w-9 text-[#E14F55]" strokeWidth={1.75} />
            <p className="text-[13.5px] font-medium text-[#111217]">
              This verification link is invalid or expired
            </p>
          </>
        )}
      </div>
    </AuthShell>
  );
}

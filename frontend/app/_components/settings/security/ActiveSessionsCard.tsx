"use client";

import { useEffect, useState } from "react";
import { Laptop } from "lucide-react";
import { NotAvailableCard } from "./NotAvailableCard";

interface DeviceInfo {
  browser: string;
  os: string;
}

/** Best-effort parse of the real navigator.userAgent for THIS browser
 * tab only — not a fabrication, just a coarse read of a string the
 * browser already exposes. Deliberately simple (no dependency) since
 * PayPilot AI doesn't need anything more precise than "Chrome on
 * Windows" for a merchant to recognize their own device. */
function parseUserAgent(ua: string): DeviceInfo {
  let browser = "Unknown browser";
  if (/Edg\//.test(ua)) browser = "Edge";
  else if (/OPR\//.test(ua)) browser = "Opera";
  else if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) browser = "Chrome";
  else if (/Firefox\//.test(ua)) browser = "Firefox";
  else if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) browser = "Safari";

  let os = "Unknown OS";
  if (/Windows/.test(ua)) os = "Windows";
  else if (/Mac OS X/.test(ua) && !/iPhone|iPad/.test(ua)) os = "macOS";
  else if (/Android/.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/.test(ua)) os = "iOS";
  else if (/Linux/.test(ua)) os = "Linux";

  return { browser, os };
}

/**
 * PayPilot AI's auth is a stateless signed JWT (see
 * backend/src/modules/auth/auth.service.ts's loginUser — app.jwt.sign()
 * with no persisted session row, no sessions/refresh_tokens table in
 * backend/src/db/schema). There is no server-side session registry to
 * list, so per the brief ("Display real sessions ONLY if the backend
 * provides a sessions API") this deliberately shows exactly one row —
 * the current browser tab, described from its own real
 * navigator.userAgent — and nothing claiming to be "other devices",
 * which this backend has no way to know about.
 *
 * No per-row action here: "Revoke" only makes sense for a session that
 * ISN'T this one, and "Sign out" for the current session is the one
 * real action this backend supports — it lives once, with a
 * confirmation, in the Security actions (danger zone) section below,
 * rather than duplicated here too.
 */
export function ActiveSessionsCard() {
  const [device, setDevice] = useState<DeviceInfo | null>(null);

  useEffect(() => {
    setDevice(parseUserAgent(window.navigator.userAgent));
  }, []);

  return (
    <div className="rounded-3xl border border-[var(--border-subtle)] bg-white/[0.02] p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-cyan)]/12">
          <Laptop className="h-4 w-4 text-[var(--accent-cyan)]" />
        </span>
        <div>
          <p className="text-sm font-medium text-white">Active sessions</p>
          <p className="mt-0.5 max-w-sm text-xs text-zinc-500">
            Review where your account is currently signed in.
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-[var(--border-subtle)] bg-white/[0.02] p-4">
        <p className="text-sm font-medium text-zinc-200">
          {device ? `${device.browser} on ${device.os}` : "This device"}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
          <span className="inline-flex items-center gap-1 text-[var(--accent-emerald)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-emerald)]" /> Current session
          </span>
          <span>· Last active: Just now</span>
        </div>
      </div>

      <div className="mt-3">
        <NotAvailableCard
          icon={Laptop}
          title="Other devices aren't tracked yet"
          description="PayPilot AI doesn't keep a server-side record of sessions on other devices yet, so only this browser is shown here."
        />
      </div>
    </div>
  );
}

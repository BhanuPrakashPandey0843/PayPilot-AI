"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AlertCircle, CheckCircle2, Loader2, Save } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { updateOrganization, type OrganizationSettings } from "@/lib/api/organization";

interface OrganizationSettingsFormProps {
  organization: OrganizationSettings;
  canEdit: boolean;
  onSaved: (updated: OrganizationSettings) => void;
}

const COMMON_CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD", "AUD", "CAD"];

/** Falls back to a small, real-world-relevant static list if the
 *  runtime doesn't support Intl.supportedValuesOf (older engines) -
 *  never a fabricated/incomplete list presented as exhaustive when it
 *  doesn't have to be. */
function getTimezoneOptions(current: string): string[] {
  try {
    const supported = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf?.(
      "timeZone"
    );
    if (supported && supported.length > 0) {
      return supported.includes(current) ? supported : [current, ...supported];
    }
  } catch {
    // fall through to static fallback
  }
  const fallback = ["Asia/Kolkata", "Asia/Dubai", "Asia/Singapore", "Europe/London", "America/New_York", "UTC"];
  return fallback.includes(current) ? fallback : [current, ...fallback];
}

/**
 * PATCH /organizations/me, requiring organizations.update (ORG_ADMIN
 * only in the current role seed - backend/scripts/seed.ts). Read-only
 * fields render as plain text when `canEdit` is false rather than
 * disabled inputs, so a non-admin sees real values without a form that
 * implies they could change them.
 */
export function OrganizationSettingsForm({ organization, canEdit, onSaved }: OrganizationSettingsFormProps) {
  const [name, setName] = useState(organization.name);
  const [currency, setCurrency] = useState(organization.currency);
  const [timezone, setTimezone] = useState(organization.timezone);
  const [nameError, setNameError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // Keep local form state in sync if the underlying resource refetches
  // with a different value (e.g. another tab saved a change).
  useEffect(() => {
    setName(organization.name);
    setCurrency(organization.currency);
    setTimezone(organization.timezone);
  }, [organization.name, organization.currency, organization.timezone]);

  const isDirty = name !== organization.name || currency !== organization.currency || timezone !== organization.timezone;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGeneralError(null);
    setSavedAt(null);

    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      setNameError("Workspace name is required");
      return;
    }
    setNameError(null);

    if (!isDirty) return;

    setIsSaving(true);
    try {
      const updated = await updateOrganization({
        name: trimmedName !== organization.name ? trimmedName : undefined,
        currency: currency !== organization.currency ? currency : undefined,
        timezone: timezone !== organization.timezone ? timezone : undefined,
      });
      onSaved(updated);
      setSavedAt(Date.now());
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        const details = err.details as { fieldErrors?: Record<string, string[]> } | undefined;
        const fieldErrors = details?.fieldErrors ?? {};
        if (fieldErrors.name?.[0]) {
          setNameError(fieldErrors.name[0]);
        } else {
          setGeneralError(err.message);
        }
      } else if (err instanceof ApiError && err.status === 403) {
        setGeneralError("You don't have permission to update organization settings.");
      } else {
        setGeneralError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  const timezoneOptions = getTimezoneOptions(timezone);

  return (
    <div className="rounded-3xl border border-[var(--border-subtle)] bg-white/[0.02] p-6">
      <p className="text-sm font-medium text-white">Workspace details</p>
      <p className="mt-1 text-xs text-zinc-500">
        {canEdit
          ? "These apply across the dashboard - currency formatting, analytics, and timestamps."
          : "Read-only - ask an organization admin to make changes here."}
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
        {generalError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-2xl border border-[var(--accent-rose)]/25 bg-[var(--accent-rose)]/[0.06] p-3 text-xs text-[var(--accent-rose)]"
          >
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {generalError}
          </div>
        )}
        {savedAt && !isDirty && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-2xl border border-[var(--accent-emerald)]/25 bg-[var(--accent-emerald)]/[0.06] p-3 text-xs text-[var(--accent-emerald)]"
          >
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> Saved
          </div>
        )}

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-zinc-400">Workspace name</span>
          {canEdit ? (
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError(null);
              }}
              maxLength={255}
              aria-invalid={Boolean(nameError)}
              className={`w-full rounded-xl border bg-white/[0.02] px-3 py-2 text-sm text-white outline-none focus:border-[var(--border-strong)] ${
                nameError ? "border-[var(--accent-rose)]/60" : "border-[var(--border-subtle)]"
              }`}
            />
          ) : (
            <p className="rounded-xl border border-[var(--border-subtle)] bg-white/[0.015] px-3 py-2 text-sm text-zinc-300">
              {organization.name}
            </p>
          )}
          {nameError && <span className="mt-1 block text-[11px] text-[var(--accent-rose)]">{nameError}</span>}
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-zinc-400">Currency</span>
            {canEdit ? (
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-white/[0.02] px-3 py-2 text-sm text-white outline-none focus:border-[var(--border-strong)]"
              >
                {(COMMON_CURRENCIES.includes(currency) ? COMMON_CURRENCIES : [currency, ...COMMON_CURRENCIES]).map(
                  (c) => (
                    <option key={c} value={c} className="bg-[var(--background-elevated)]">
                      {c}
                    </option>
                  )
                )}
              </select>
            ) : (
              <p className="rounded-xl border border-[var(--border-subtle)] bg-white/[0.015] px-3 py-2 text-sm text-zinc-300">
                {organization.currency}
              </p>
            )}
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-zinc-400">Timezone</span>
            {canEdit ? (
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-white/[0.02] px-3 py-2 text-sm text-white outline-none focus:border-[var(--border-strong)]"
              >
                {timezoneOptions.map((tz) => (
                  <option key={tz} value={tz} className="bg-[var(--background-elevated)]">
                    {tz}
                  </option>
                ))}
              </select>
            ) : (
              <p className="rounded-xl border border-[var(--border-subtle)] bg-white/[0.015] px-3 py-2 text-sm text-zinc-300">
                {organization.timezone}
              </p>
            )}
          </label>
        </div>

        {canEdit && (
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving || !isDirty}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-cyan)] px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSaving ? "Saving\u2026" : "Save changes"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

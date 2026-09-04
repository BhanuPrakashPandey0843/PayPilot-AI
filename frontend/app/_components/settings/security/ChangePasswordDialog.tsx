"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, X } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { changePassword } from "@/lib/api/auth";
import {
  checkPassword,
  isPasswordValidForBackend,
  passwordStrengthScore,
  validateConfirmPassword,
  validateCurrentPassword,
  validateNewPasswordDiffers,
} from "@/lib/validation/authValidation";
import { PasswordStrength } from "../../signup/PasswordStrength";

interface ChangePasswordDialogProps {
  onClose: () => void;
}

interface FieldErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

/**
 * POST /auth/change-password does not exist on the backend yet — see
 * lib/api/auth.ts's changePassword() doc comment for the exact contract
 * this is written against and what implementing it requires. This
 * dialog makes the real call regardless (same "isolate the UI, make the
 * real request, surface the real failure honestly" approach
 * ForgotPasswordForm already uses for the same situation) rather than
 * faking a success state — so today, submitting always surfaces the 404
 * branch below, plainly, instead of pretending the password changed.
 *
 * Password values only ever live in this component's local state, are
 * never logged, and are cleared the moment the dialog closes (component
 * unmount) or a submission succeeds.
 */
export function ChangePasswordDialog({ onClose }: ChangePasswordDialogProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  const passwordCheck = checkPassword(newPassword);
  const strengthScore = passwordStrengthScore(passwordCheck);

  function runClientValidation(): FieldErrors {
    const next: FieldErrors = {};
    const currentError = validateCurrentPassword(currentPassword);
    if (currentError) next.currentPassword = currentError;

    if (!isPasswordValidForBackend(passwordCheck)) {
      next.newPassword = "Use at least 8 characters, with a letter and a number";
    } else {
      const sameAsOld = validateNewPasswordDiffers(currentPassword, newPassword);
      if (sameAsOld) next.newPassword = sameAsOld;
    }

    const confirmError = validateConfirmPassword(newPassword, confirmPassword);
    if (confirmError) next.confirmPassword = confirmError;

    return next;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGeneralError(null);

    const clientErrors = runClientValidation();
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }
    setErrors({});

    setIsSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setSucceeded(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        // The real, documented reason this fails today — see this
        // component's doc comment and lib/api/auth.ts's changePassword.
        setGeneralError(
          "Changing your password isn't available yet — this feature is still being built. Please contact support in the meantime."
        );
      } else if (err instanceof ApiError && err.status === 401) {
        setErrors({ currentPassword: "Your current password is incorrect" });
      } else if (err instanceof ApiError && err.status === 429) {
        setGeneralError("Too many attempts. Please wait a moment and try again.");
      } else if (err instanceof ApiError && err.status === 422) {
        const details = err.details as { fieldErrors?: Record<string, string[]> } | undefined;
        const fieldErrors = details?.fieldErrors ?? {};
        const mapped: FieldErrors = {};
        if (fieldErrors.currentPassword?.[0]) mapped.currentPassword = fieldErrors.currentPassword[0];
        if (fieldErrors.newPassword?.[0]) mapped.newPassword = fieldErrors.newPassword[0];
        if (Object.keys(mapped).length > 0) {
          setErrors(mapped);
        } else {
          setGeneralError(err.message);
        }
      } else {
        setGeneralError(
          err instanceof ApiError ? err.message : "Something went wrong. Please try again."
        );
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={isSaving ? undefined : onClose} />
      <div className="glass-panel relative flex max-h-[90vh] w-full max-w-md flex-col rounded-3xl border border-[var(--border-subtle)] bg-[var(--background-elevated)] shadow-2xl">
        <div className="flex shrink-0 items-start justify-between border-b border-[var(--border-subtle)] p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-cyan)]/12">
              <KeyRound className="h-5 w-5 text-[var(--accent-cyan)]" />
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Security</p>
              <h2 className="mt-0.5 text-lg font-semibold text-white">Change password</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close"
            className="rounded-lg p-1 text-zinc-500 hover:bg-white/5 hover:text-white disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {succeeded ? (
          <div className="flex flex-col items-center gap-3 p-8 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-emerald)]/12">
              <CheckCircle2 className="h-6 w-6 text-[var(--accent-emerald)]" />
            </span>
            <p className="text-sm font-medium text-zinc-200">Password updated</p>
            <p className="max-w-xs text-xs text-zinc-500">Your password has been changed successfully.</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 rounded-xl border border-[var(--border-subtle)] px-4 py-2 text-xs font-medium text-zinc-300 hover:border-[var(--border-strong)] hover:text-white"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col" noValidate>
            <div className="flex-1 space-y-5 overflow-y-auto p-6">
              {generalError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-2xl border border-[var(--accent-rose)]/25 bg-[var(--accent-rose)]/[0.06] p-3 text-xs text-[var(--accent-rose)]"
                >
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {generalError}
                </div>
              )}

              <PasswordField
                label="Current password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(v) => {
                  setCurrentPassword(v);
                  if (errors.currentPassword) setErrors((e) => ({ ...e, currentPassword: undefined }));
                }}
                error={errors.currentPassword}
              />

              <div>
                <PasswordField
                  label="New password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(v) => {
                    setNewPassword(v);
                    if (errors.newPassword) setErrors((e) => ({ ...e, newPassword: undefined }));
                  }}
                  error={errors.newPassword}
                />
                <div className="mt-2">
                  <PasswordStrength password={newPassword} check={passwordCheck} score={strengthScore} />
                </div>
              </div>

              <PasswordField
                label="Confirm new password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(v) => {
                  setConfirmPassword(v);
                  if (errors.confirmPassword) setErrors((e) => ({ ...e, confirmPassword: undefined }));
                }}
                error={errors.confirmPassword}
              />
            </div>

            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[var(--border-subtle)] p-5">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="rounded-xl border border-[var(--border-subtle)] px-4 py-2 text-sm font-medium text-zinc-300 hover:border-[var(--border-strong)] hover:text-white disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-cyan)] px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSaving ? "Saving…" : "Change password"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  error?: string;
}): ReactNode {
  const [visible, setVisible] = useState(false);
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1 text-xs font-medium text-zinc-400">{label}</span>
      <div
        className={`flex items-center rounded-xl border bg-white/[0.02] ${
          error ? "border-[var(--accent-rose)]/60" : "border-[var(--border-subtle)]"
        } focus-within:border-[var(--border-strong)]`}
      >
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          className="w-full bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          tabIndex={-1}
          aria-label={visible ? "Hide password" : "Show password"}
          className="mr-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-500 hover:text-white"
        >
          {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
      </div>
      {error && <span className="mt-1 block text-[11px] text-[var(--accent-rose)]">{error}</span>}
    </label>
  );
}

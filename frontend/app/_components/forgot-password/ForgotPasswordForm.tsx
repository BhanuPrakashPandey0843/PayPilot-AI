"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Loader2, Mail, Send, ShieldCheck } from "lucide-react";
import { Button } from "../Button";
import { FormField } from "../signup/FormField";
import { requestPasswordReset } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { validateEmail } from "@/lib/validation/authValidation";

type FormStatus = "idle" | "loading" | "sent";

const RESEND_COOLDOWN_SECONDS = 30;

/** Draw-on checkmark for the success state — same shared keyframes the
 * login/signup success screens use, so all three auth flows resolve
 * with identical motion. */
function SuccessCheck() {
  return (
    <svg viewBox="0 0 52 52" className="h-14 w-14" aria-hidden="true">
      <circle
        cx="26"
        cy="26"
        r="24"
        fill="none"
        stroke="#34d399"
        strokeWidth="2.5"
        className="animate-draw-circle"
      />
      <path
        d="M15 27 L23 35 L38 18"
        fill="none"
        stroke="#34d399"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-draw-check"
      />
    </svg>
  );
}

/**
 * Single-field password-reset request form. Submits via
 * requestPasswordReset() (lib/api/auth.ts) which POSTs to
 * /auth/forgot-password — a route that does not exist in the backend
 * yet (see that function's doc comment). Until it ships, submitting
 * here surfaces a real ApiError rather than faking success, so this
 * screen honestly reflects what actually happens today.
 *
 * Deliberately always shows the SAME generic "check your email"
 * success message on a successful response, never revealing whether
 * the address is registered — that's an intentional security property
 * of this flow (mirrors the doc comment on requestPasswordReset), not
 * an oversight.
 */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [status, setStatus] = useState<FormStatus>("idle");
  const [shake, setShake] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => window.clearInterval(id);
  }, [cooldown]);

  function triggerShake() {
    setShake(true);
    window.setTimeout(() => setShake(false), 500);
  }

  async function submit() {
    const emailError = validateEmail(email);
    setError(emailError);
    if (emailError) {
      triggerShake();
      return;
    }

    setSubmitError(null);
    setStatus("loading");

    try {
      await requestPasswordReset(email.trim().toLowerCase());
      setStatus("sent");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setStatus("idle");
      triggerShake();

      if (err instanceof ApiError) {
        if (err.status === 422) {
          const details = err.details as { fieldErrors?: Record<string, string[]> } | undefined;
          const fieldMessage = details?.fieldErrors?.email?.[0];
          setError(fieldMessage ?? null);
          setSubmitError("Enter a valid business email address.");
        } else if (err.status === 0) {
          setSubmitError(err.message);
        } else if (err.status === 404) {
          // The /auth/forgot-password route isn't implemented on the
          // backend yet — surface that plainly rather than pretending
          // the email went out.
          setSubmitError(
            "Password reset isn't available yet — this feature is still being built. Please contact support in the meantime."
          );
        } else {
          setSubmitError(err.message || "Something went wrong. Please try again.");
        }
      } else {
        setSubmitError("Something went wrong. Please try again.");
      }
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await submit();
  }

  async function handleResend() {
    if (cooldown > 0) return;
    await submit();
  }

  if (status === "sent") {
    return (
      <div className="animate-success-pop flex flex-col items-center gap-5 py-4 text-center">
        <SuccessCheck />
        <div>
          <h2 className="text-xl font-semibold text-white">Check your email</h2>
          <p className="mt-2 max-w-xs text-sm text-zinc-400">
            If an account exists for <span className="text-zinc-200">{email.trim()}</span>, we&apos;ve
            sent a link to reset your password. It expires shortly, so use it soon.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0}
          className="text-xs text-zinc-500 underline underline-offset-2 transition-colors duration-200 hover:text-white disabled:cursor-not-allowed disabled:text-zinc-700 disabled:no-underline"
        >
          {cooldown > 0 ? `Resend link in ${cooldown}s` : "Didn't get it? Resend link"}
        </button>

        <a
          href="/login"
          className="mt-2 inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors duration-200 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to login
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className={`flex flex-col gap-5 ${shake ? "animate-shake" : ""}`}>
      {submitError ? (
        <p
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300"
        >
          {submitError}
        </p>
      ) : null}

      <FormField
        label="Business email"
        name="email"
        type="email"
        value={email}
        onChange={(v) => {
          setEmail(v);
          setError(null);
        }}
        icon={Mail}
        error={error}
        valid={!error && validateEmail(email) === null}
        autoComplete="email"
        hint="We'll send a link to reset your password to this address."
      />

      <Button
        type="submit"
        variant="accent"
        size="md"
        disabled={status === "loading"}
        className="justify-center"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending reset link…
          </>
        ) : (
          <>
            Send Reset Link
            <Send className="h-4 w-4" />
          </>
        )}
      </Button>

      <p className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-600">
        <ShieldCheck className="h-3.5 w-3.5" />
        We never reveal whether an email is registered
      </p>

      <a
        href="/login"
        className="inline-flex items-center justify-center gap-1.5 text-sm text-zinc-400 transition-colors duration-200 hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to login
      </a>
    </form>
  );
}

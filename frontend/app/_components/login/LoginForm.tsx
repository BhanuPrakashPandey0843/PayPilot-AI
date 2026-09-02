"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Loader2, Lock, LogIn, Mail, ShieldCheck } from "lucide-react";
import { Button } from "../Button";
import { FormField } from "../signup/FormField";
import { login } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { saveSession } from "@/lib/auth/session";
import { validateEmail } from "@/lib/validation/authValidation";

type FieldKey = "email" | "password";
type FieldErrors = Partial<Record<FieldKey, string>>;
type FormStatus = "idle" | "loading" | "success";

const LOADING_MESSAGES = ["Signing in…", "Verifying credentials…", "Loading your workspace…"];

interface FormState {
  email: string;
  password: string;
  rememberMe: boolean;
}

const INITIAL_STATE: FormState = {
  email: "",
  password: "",
  rememberMe: true,
};

/** Draw-on checkmark for the success screen — same shared keyframes
 * (animate-draw-circle / animate-draw-check) SignupForm's SuccessCheck
 * uses, so both auth flows resolve with identical motion. */
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
 * Single-step login form: business email + password, Remember me,
 * Forgot password. Submits via lib/api/auth's login() (which hits the
 * real POST /auth/login), stores the session with the Remember me
 * choice baked in (see lib/auth/session.ts), then redirects to
 * /dashboard. Error handling mirrors what auth.service.ts on the
 * backend can actually throw: 401 invalid credentials, 403 inactive
 * account / missing org membership, 422 validation, 0 network, and a
 * generic 500 fallback — never anything invented.
 */
export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<FormStatus>("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [shake, setShake] = useState(false);

  const sessionExpired = searchParams.get("expired") === "1";

  useEffect(() => {
    if (status !== "loading") return;
    setLoadingMessageIndex(0);
    const id = window.setInterval(() => {
      setLoadingMessageIndex((i) => Math.min(i + 1, LOADING_MESSAGES.length - 1));
    }, 800);
    return () => window.clearInterval(id);
  }, [status]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function triggerShake() {
    setShake(true);
    window.setTimeout(() => setShake(false), 500);
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    const emailError = validateEmail(form.email);
    if (emailError) next.email = emailError;
    if (!form.password) next.password = "Password is required";
    return next;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const fieldErrors = validate();
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) {
      triggerShake();
      return;
    }

    setSubmitError(null);
    setStatus("loading");

    try {
      const session = await login({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      saveSession(session, form.rememberMe);
      setStatus("success");
      window.setTimeout(() => router.push("/dashboard"), 1100);
    } catch (err) {
      setStatus("idle");
      triggerShake();

      if (err instanceof ApiError) {
        if (err.status === 401) {
          setSubmitError("Incorrect email or password. Please try again.");
        } else if (err.status === 403) {
          // auth.service.ts already returns a specific, safe-to-show
          // message here ("account not active" / "no active org
          // membership") — no need to genericize it further.
          setSubmitError(err.message);
        } else if (err.status === 422) {
          const details = err.details as { fieldErrors?: Record<string, string[]> } | undefined;
          const mapped: FieldErrors = {};
          if (details?.fieldErrors) {
            for (const [key, messages] of Object.entries(details.fieldErrors)) {
              if (messages?.[0] && (key === "email" || key === "password")) {
                mapped[key as FieldKey] = messages[0];
              }
            }
          }
          setErrors((prev) => ({ ...prev, ...mapped }));
          setSubmitError("A few details need fixing before you can sign in.");
        } else if (err.status === 0) {
          setSubmitError(err.message);
        } else {
          setSubmitError(err.message || "Something went wrong. Please try again.");
        }
      } else {
        setSubmitError("Something went wrong. Please try again.");
      }
    }
  }

  if (status === "success") {
    return (
      <div className="animate-success-pop flex flex-col items-center justify-center gap-5 px-4 py-16 text-center">
        <SuccessCheck />
        <div>
          <h2 className="text-xl font-semibold text-white">Welcome back</h2>
          <p className="mt-2 max-w-xs text-sm text-zinc-400">Loading your workspace…</p>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={`flex flex-col gap-5 ${shake ? "animate-shake" : ""}`}
    >
      {sessionExpired ? (
        <p
          role="alert"
          className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-300"
        >
          Your session has expired. Please sign in again.
        </p>
      ) : null}

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
        value={form.email}
        onChange={(v) => update("email", v)}
        icon={Mail}
        error={errors.email}
        valid={!errors.email && validateEmail(form.email) === null}
        autoComplete="email"
      />

      <div className="flex flex-col gap-1.5">
        <FormField
          label="Password"
          name="password"
          isPassword
          value={form.password}
          onChange={(v) => update("password", v)}
          icon={Lock}
          error={errors.password}
          autoComplete="current-password"
        />
        <div className="flex justify-end">
          <a
            href="/forgot-password"
            className="group inline-flex items-center gap-1 text-xs text-zinc-500 transition-colors duration-200 hover:text-white"
          >
            Forgot password?
            <ArrowRight className="h-3 w-3 -translate-x-0.5 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
          </a>
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2.5 text-xs text-zinc-400">
        <input
          type="checkbox"
          checked={form.rememberMe}
          onChange={(e) => update("rememberMe", e.target.checked)}
          className="h-4 w-4 shrink-0 rounded border-white/20 bg-white/5 text-blue-500 focus-visible:ring-2 focus-visible:ring-blue-400/50"
        />
        <span>Remember me on this device</span>
      </label>

      <Button
        type="submit"
        variant="accent"
        size="md"
        disabled={status === "loading"}
        className="mt-1 justify-center"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {LOADING_MESSAGES[loadingMessageIndex]}
          </>
        ) : (
          <>
            Sign In
            <LogIn className="h-4 w-4" />
          </>
        )}
      </Button>

      <p className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-600">
        <ShieldCheck className="h-3.5 w-3.5" />
        Secured with JWT authentication · Organization isolated
      </p>

      <p className="text-center text-sm text-zinc-500">
        New to PayPilot AI?{" "}
        <a href="/signup" className="text-zinc-300 underline underline-offset-2 hover:text-white">
          Create a workspace
        </a>
      </p>
    </form>
  );
}

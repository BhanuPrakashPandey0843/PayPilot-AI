"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Lock,
  Loader2,
  Mail,
  User,
} from "lucide-react";
import { Button } from "../Button";
import { FormField } from "./FormField";
import { PasswordStrength } from "./PasswordStrength";
import { StepIndicator } from "./StepIndicator";
import { registerAndSignIn } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { saveSession } from "@/lib/auth/session";
import {
  checkPassword,
  isPasswordValidForBackend,
  passwordStrengthScore,
  slugPreview,
  validateConfirmPassword,
  validateEmail,
  validateName,
  validateOrganizationName,
} from "@/lib/validation/authValidation";

type FieldKey =
  | "organizationName"
  | "firstName"
  | "lastName"
  | "email"
  | "password"
  | "confirmPassword"
  | "terms";

type FieldErrors = Partial<Record<FieldKey, string>>;

type FormStatus = "idle" | "loading" | "success";

const LOADING_MESSAGES = [
  "Creating your workspace…",
  "Preparing your AI commerce platform…",
  "Almost ready…",
];

interface FormState {
  organizationName: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  receiveUpdates: boolean;
}

const INITIAL_STATE: FormState = {
  organizationName: "",
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  acceptTerms: false,
  receiveUpdates: true,
};

/** Draw-on checkmark for the success screen — plain inline SVG so the
 * circle and check stroke each get their own dash animation. */
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

const CONFETTI_COLORS = ["#3b82f6", "#22d3ee", "#34d399", "#e8c88a"];

/** Minimal confetti burst — no library, ~16 small squares with staggered
 * falls. Deterministic-looking positions from the index so this never
 * causes a hydration mismatch (it only ever renders after the success
 * state is reached client-side, never during SSR). */
function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 16 }).map((_, i) => ({
        left: (i * 6.25 + ((i * 37) % 11)) % 100,
        delay: (i % 8) * 0.08,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        rotate: (i * 53) % 360,
      })),
    []
  );

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-40 overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="animate-confetti absolute top-0 h-2 w-2 rounded-sm"
          style={{
            left: `${p.left}%`,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Two-step signup form: organization name (step 1) then admin account
 * details (step 2). Submits by calling registerAndSignIn — register has
 * no token in its response, so it's chased immediately by a login call
 * (see lib/api/auth.ts) — then stores the session and redirects to
 * /dashboard.
 */
export function SignupForm() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<FormStatus>("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [shake, setShake] = useState(false);

  const passwordCheck = checkPassword(form.password);
  const strengthScore = passwordStrengthScore(passwordCheck);

  useEffect(() => {
    if (status !== "loading") return;
    setLoadingMessageIndex(0);
    const id = window.setInterval(() => {
      setLoadingMessageIndex((i) => Math.min(i + 1, LOADING_MESSAGES.length - 1));
    }, 900);
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

  function validateStep1(): FieldErrors {
    const next: FieldErrors = {};
    const orgError = validateOrganizationName(form.organizationName);
    if (orgError) next.organizationName = orgError;
    return next;
  }

  function validateStep2(): FieldErrors {
    const next: FieldErrors = {};
    const firstNameError = validateName(form.firstName, "First name");
    if (firstNameError) next.firstName = firstNameError;
    const lastNameError = validateName(form.lastName, "Last name");
    if (lastNameError) next.lastName = lastNameError;
    const emailError = validateEmail(form.email);
    if (emailError) next.email = emailError;
    if (!isPasswordValidForBackend(passwordCheck)) {
      next.password = "Use 8+ characters with at least one letter and one number";
    }
    const confirmError = validateConfirmPassword(form.password, form.confirmPassword);
    if (confirmError) next.confirmPassword = confirmError;
    if (!form.acceptTerms) next.terms = "You need to accept the Terms to continue";
    return next;
  }

  function handleContinue() {
    const stepErrors = validateStep1();
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) {
      triggerShake();
      return;
    }
    setStep(2);
  }

  function handleBack() {
    setStep(1);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    // A lone text input on step 1 means Enter implicitly "submits" the
    // form even though the only button there is type="button" — treat
    // that the same as clicking Continue instead of running step-2
    // validation against fields that aren't even rendered yet.
    if (step === 1) {
      handleContinue();
      return;
    }

    const stepErrors = validateStep2();
    setErrors((prev) => ({ ...prev, ...stepErrors }));
    if (Object.keys(stepErrors).length > 0) {
      triggerShake();
      return;
    }

    setSubmitError(null);
    setStatus("loading");

    try {
      const session = await registerAndSignIn({
        organizationName: form.organizationName.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      saveSession(session);
      setStatus("success");
      window.setTimeout(() => router.push("/dashboard"), 1600);
    } catch (err) {
      setStatus("idle");
      triggerShake();

      if (err instanceof ApiError) {
        if (err.status === 409) {
          setErrors((prev) => ({ ...prev, email: "This email is already registered" }));
          setSubmitError("An account with this email already exists. Try logging in instead.");
        } else if (err.status === 422) {
          const details = err.details as { fieldErrors?: Record<string, string[]> } | undefined;
          const mapped: FieldErrors = {};
          if (details?.fieldErrors) {
            for (const [key, messages] of Object.entries(details.fieldErrors)) {
              if (messages?.[0] && key in INITIAL_STATE) {
                mapped[key as FieldKey] = messages[0];
              }
            }
          }
          setErrors((prev) => ({ ...prev, ...mapped }));
          setSubmitError("A few details need fixing before we can continue.");
          if (mapped.organizationName) setStep(1);
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
      <div className="animate-success-pop relative flex flex-col items-center justify-center gap-5 px-4 py-16 text-center">
        <Confetti />
        <SuccessCheck />
        <div>
          <h2 className="text-xl font-semibold text-white">Workspace created</h2>
          <p className="mt-2 max-w-xs text-sm text-zinc-400">
            {form.organizationName.trim() || "Your workspace"} is ready. Taking you to your
            dashboard…
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard")} variant="accent" size="md" className="mt-1">
          Enter Dashboard
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className={`flex flex-col gap-6 ${shake ? "animate-shake" : ""}`}>
      <StepIndicator step={step} total={2} />

      {submitError ? (
        <p
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300"
        >
          {submitError}
        </p>
      ) : null}

      {step === 1 ? (
        <div key="step-1" className="animate-step-in flex flex-col gap-5">
          <FormField
            label="Organization name"
            name="organizationName"
            value={form.organizationName}
            onChange={(v) => update("organizationName", v)}
            icon={Building2}
            error={errors.organizationName}
            valid={!errors.organizationName && form.organizationName.trim().length > 0}
            autoComplete="organization"
          />

          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
            <span className="text-xs text-zinc-500">Workspace URL</span>
            <span className="font-mono text-xs text-zinc-300">
              {slugPreview(form.organizationName)}
              <span className="text-zinc-600">-xxxxxxxx.paypilot.ai</span>
            </span>
          </div>

          <Button type="button" onClick={handleContinue} variant="accent" size="md" className="mt-1 justify-center">
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div key="step-2" className="animate-step-in flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="First name"
              name="firstName"
              value={form.firstName}
              onChange={(v) => update("firstName", v)}
              icon={User}
              error={errors.firstName}
              valid={!errors.firstName && form.firstName.trim().length > 0}
              autoComplete="given-name"
            />
            <FormField
              label="Last name"
              name="lastName"
              value={form.lastName}
              onChange={(v) => update("lastName", v)}
              icon={User}
              error={errors.lastName}
              valid={!errors.lastName && form.lastName.trim().length > 0}
              autoComplete="family-name"
            />
          </div>

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

          <div className="flex flex-col gap-3">
            <FormField
              label="Password"
              name="password"
              isPassword
              value={form.password}
              onChange={(v) => update("password", v)}
              icon={Lock}
              error={errors.password}
              autoComplete="new-password"
            />
            <PasswordStrength password={form.password} check={passwordCheck} score={strengthScore} />
          </div>

          <FormField
            label="Confirm password"
            name="confirmPassword"
            isPassword
            value={form.confirmPassword}
            onChange={(v) => update("confirmPassword", v)}
            icon={Lock}
            error={errors.confirmPassword}
            valid={
              !errors.confirmPassword &&
              form.confirmPassword.length > 0 &&
              form.confirmPassword === form.password
            }
            autoComplete="new-password"
          />

          <div className="flex flex-col gap-2.5">
            <label className="flex cursor-pointer items-start gap-2.5 text-xs text-zinc-400">
              <input
                type="checkbox"
                checked={form.acceptTerms}
                onChange={(e) => update("acceptTerms", e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-white/5 text-blue-500 focus-visible:ring-2 focus-visible:ring-blue-400/50"
              />
              <span>
                I agree to the{" "}
                <a href="/terms-of-service" className="text-zinc-300 underline underline-offset-2 hover:text-white">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="/privacy-policy" className="text-zinc-300 underline underline-offset-2 hover:text-white">
                  Privacy Policy
                </a>
                .
              </span>
            </label>
            {errors.terms ? <p role="alert" className="pl-6 text-xs text-red-400">{errors.terms}</p> : null}

            <label className="flex cursor-pointer items-start gap-2.5 text-xs text-zinc-500">
              <input
                type="checkbox"
                checked={form.receiveUpdates}
                onChange={(e) => update("receiveUpdates", e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-white/5 text-blue-500 focus-visible:ring-2 focus-visible:ring-blue-400/50"
              />
              <span>Send me product updates and revenue insights.</span>
            </label>
          </div>

          <div className="mt-1 flex items-center gap-3">
            <Button type="button" onClick={handleBack} variant="outline" size="md">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              type="submit"
              variant="accent"
              size="md"
              disabled={status === "loading"}
              className="flex-1 justify-center"
            >
              {status === "loading" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {LOADING_MESSAGES[loadingMessageIndex]}
                </>
              ) : (
                <>
                  Create Workspace
                  <CheckCircle2 className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}

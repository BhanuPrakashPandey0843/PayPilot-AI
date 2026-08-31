"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { AuthShell } from "@/components/auth/AuthShell";
import { AuthField } from "@/components/auth/AuthField";
import { PasswordField } from "@/components/auth/PasswordField";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { ErrorState } from "@/components/states/ErrorState";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit() {
    // NOTE: UI shell only — not wired to POST /api/v1/auth/login yet.
    // Wire this up once the auth client/session strategy is decided.
    setServerError(null);
  }

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to your PayPilot organization."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="font-medium text-[#111217] underline underline-offset-4">
            Create one
          </Link>
        </>
      }
    >
      {serverError && (
        <div className="mb-4">
          <ErrorState kind="unauthorized" description={serverError} />
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <AuthField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />

        <PasswordField
          id="password"
          label="Password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-[12.5px] text-[#5F6067]">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 rounded border-black/[0.2] accent-[#111217]"
              {...register("rememberMe")}
            />
            Remember me
          </label>
          <Link
            href="/auth/forgot-password"
            className="text-[12.5px] font-medium text-[#111217] underline underline-offset-4"
          >
            Forgot password?
          </Link>
        </div>

        <AuthSubmitButton loading={isSubmitting}>Sign in</AuthSubmitButton>
      </form>
    </AuthShell>
  );
}

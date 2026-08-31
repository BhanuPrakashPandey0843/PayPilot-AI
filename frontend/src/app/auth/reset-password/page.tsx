"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordField } from "@/components/auth/PasswordField";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { SuccessState } from "@/components/states/SuccessState";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "8-128 characters, with at least one letter and one digit")
      .max(128)
      .regex(/[A-Za-z]/, "Must contain at least one letter")
      .regex(/[0-9]/, "Must contain at least one digit"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({ resolver: zodResolver(resetPasswordSchema) });

  async function onSubmit() {
    // NOTE: UI shell only — no reset-token verification endpoint exists
    // in the backend yet.
    setDone(true);
  }

  return (
    <AuthShell title="Set a new password" description="Choose a strong password for your account.">
      {done ? (
        <SuccessState
          title="Password updated"
          description="You can now sign in with your new password."
          action={
            <Link
              href="/auth/login"
              className="mt-1 inline-flex h-9 items-center rounded-[11px] bg-[#111217] px-4 text-[13px] font-medium text-white outline-none transition-opacity hover:opacity-90"
            >
              Sign in
            </Link>
          }
        />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <PasswordField
            id="password"
            label="New password"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register("password")}
          />
          <PasswordField
            id="confirmPassword"
            label="Confirm new password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />
          <AuthSubmitButton loading={isSubmitting}>Update password</AuthSubmitButton>
        </form>
      )}
    </AuthShell>
  );
}

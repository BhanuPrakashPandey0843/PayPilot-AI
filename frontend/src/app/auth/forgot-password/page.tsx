"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { AuthShell } from "@/components/auth/AuthShell";
import { AuthField } from "@/components/auth/AuthField";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { SuccessState } from "@/components/states/SuccessState";

const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit() {
    // NOTE: UI shell only — no password-reset endpoint exists in the
    // backend yet. Wire this up once one is added.
    setSent(true);
  }

  return (
    <AuthShell
      title="Reset your password"
      description="Enter the email on your account and we'll send you a reset link."
      footer={
        <Link href="/auth/login" className="font-medium text-[#111217] underline underline-offset-4">
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        <SuccessState
          title="Check your email"
          description="If an account exists for that address, a reset link is on its way."
        />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <AuthField
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <AuthSubmitButton loading={isSubmitting}>Send reset link</AuthSubmitButton>
        </form>
      )}
    </AuthShell>
  );
}

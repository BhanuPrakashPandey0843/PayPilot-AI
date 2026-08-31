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

// Mirrors `registerBodySchema` in backend/src/modules/auth/auth.schemas.ts —
// email, password (8-128 chars, 1+ letter & 1+ digit), firstName, lastName,
// organizationName. The role is always resolved server-side to ORG_ADMIN;
// it's never client-selected, so there's no buyer/seller choice here.
const registerSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(120),
  lastName: z.string().trim().min(1, "Last name is required").max(120),
  organizationName: z.string().trim().min(1, "Organization name is required").max(255),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "8-128 characters, with at least one letter and one digit")
    .max(128)
    .regex(/[A-Za-z]/, "Must contain at least one letter")
    .regex(/[0-9]/, "Must contain at least one digit"),
});

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

  async function onSubmit() {
    // NOTE: UI shell only — not wired to POST /api/v1/auth/register yet.
    setSubmitted(true);
  }

  return (
    <AuthShell
      title="Create your organization"
      description="One account, one organization — you can invite teammates afterwards."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/auth/login" className="font-medium text-[#111217] underline underline-offset-4">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <AuthField
            id="firstName"
            label="First name"
            autoComplete="given-name"
            error={errors.firstName?.message}
            {...register("firstName")}
          />
          <AuthField
            id="lastName"
            label="Last name"
            autoComplete="family-name"
            error={errors.lastName?.message}
            {...register("lastName")}
          />
        </div>

        <AuthField
          id="organizationName"
          label="Organization name"
          autoComplete="organization"
          error={errors.organizationName?.message}
          {...register("organizationName")}
        />

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
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password")}
        />

        <AuthSubmitButton loading={isSubmitting}>
          {submitted ? "Account created" : "Create account"}
        </AuthSubmitButton>

        <p className="text-center text-[11.5px] leading-[1.5] text-[#A9AAB1]">
          By continuing you agree to our{" "}
          <Link href="/terms-and-conditions" className="underline underline-offset-2">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy-policy" className="underline underline-offset-2">
            Privacy Policy
          </Link>
          .
        </p>
      </form>
    </AuthShell>
  );
}

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2 } from "lucide-react";

import { AuthShell } from "@/components/auth/AuthShell";
import { AuthField } from "@/components/auth/AuthField";
import { PasswordField } from "@/components/auth/PasswordField";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { SuccessState } from "@/components/states/SuccessState";

// UI shell only — there's no invite-acceptance endpoint in the backend
// yet. `organization_members.status` already models an "invited" state
// (see backend/src/db/schema/organization_members.ts), so this route is
// staked out for when that flow is built.
const acceptInviteSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(120),
  lastName: z.string().trim().min(1, "Last name is required").max(120),
  password: z
    .string()
    .min(8, "8-128 characters, with at least one letter and one digit")
    .max(128)
    .regex(/[A-Za-z]/, "Must contain at least one letter")
    .regex(/[0-9]/, "Must contain at least one digit"),
});

type AcceptInviteValues = z.infer<typeof acceptInviteSchema>;

export default function AcceptInvitePage() {
  const [joined, setJoined] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AcceptInviteValues>({ resolver: zodResolver(acceptInviteSchema) });

  async function onSubmit() {
    setJoined(true);
  }

  return (
    <AuthShell title="Accept your invite" description="Set your name and password to join the organization.">
      {joined ? (
        <SuccessState title="You're in" description="Your account is ready — you can now sign in." />
      ) : (
        <>
          <div className="mb-5 flex items-center gap-2.5 rounded-[12px] bg-[#F5F5F7] px-3.5 py-2.5">
            <Building2 className="h-4 w-4 shrink-0 text-[#8C7BE0]" strokeWidth={1.75} />
            <p className="text-[12.5px] text-[#5F6067]">
              You've been invited to join <span className="font-medium text-[#111217]">an organization</span> on PayPilot AI.
            </p>
          </div>

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

            <PasswordField
              id="password"
              label="Password"
              autoComplete="new-password"
              error={errors.password?.message}
              {...register("password")}
            />

            <AuthSubmitButton loading={isSubmitting}>Join organization</AuthSubmitButton>
          </form>
        </>
      )}
    </AuthShell>
  );
}

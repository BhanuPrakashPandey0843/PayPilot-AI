import type { Metadata } from "next";
import { SignUpExperience } from "@/app/_components/signup/SignUpExperience";

export const metadata: Metadata = {
  title: "Sign Up — PayPilot AI",
  description:
    "Create your PayPilot AI merchant workspace — AI-native revenue recovery, policy-controlled agent checkout, and audit-logged commerce intelligence.",
};

export default function SignUpPage() {
  return <SignUpExperience />;
}

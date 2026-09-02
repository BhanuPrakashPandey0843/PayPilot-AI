import type { Metadata } from "next";
import { LoginExperience } from "@/app/_components/login/LoginExperience";

export const metadata: Metadata = {
  title: "Log In — PayPilot AI",
  description:
    "Sign in to your PayPilot AI merchant workspace — AI-native revenue recovery, policy-controlled agent checkout, and audit-logged commerce intelligence.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return <LoginExperience />;
}

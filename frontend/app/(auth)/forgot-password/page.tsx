import type { Metadata } from "next";
import { ForgotPasswordExperience } from "@/app/_components/forgot-password/ForgotPasswordExperience";

export const metadata: Metadata = {
  title: "Forgot Password — PayPilot AI",
  description: "Reset the password for your PayPilot AI merchant workspace.",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordExperience />;
}

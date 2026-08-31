import type { ReactNode } from "react";

/**
 * Shared shell for Login / Sign Up / Forgot Password / Reset Password.
 * Per the flow diagram: Login connects out to Sign Up and Forgot Password,
 * and Forgot Password -> Reset Password -> back to Login.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      {/* TODO: centered auth card shell (logo + form container) goes here */}
      {children}
    </div>
  );
}

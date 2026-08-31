import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: {
    template: "%s — PayPilot AI",
    default: "Sign in — PayPilot AI",
  },
};

/**
 * Segment layout for every `/auth/*` route. Deliberately thin — each
 * page wraps its own content in `AuthShell` (title/description differ
 * per flow) — this layout exists as the boundary for shared auth-only
 * metadata and future route protection (e.g. redirecting an already
 * signed-in user away from `/auth/login`).
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

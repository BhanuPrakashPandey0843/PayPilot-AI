"use client";

import { useEffect } from "react";

/**
 * Root-level error boundary — only fires if `app/layout.tsx` itself
 * throws, replacing the entire root layout, so it must render its own
 * `<html>`/`<body>`. Kept deliberately dependency-free (inline styles,
 * no Tailwind/shared components) since the failure that reaches here
 * may mean the rest of the app's providers/CSS pipeline is compromised.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          padding: "20px",
          textAlign: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
          backgroundColor: "#FAFAF8",
          color: "#111217",
        }}
      >
        <div>
          <p style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#A9AAB1" }}>
            Something went wrong
          </p>
          <h1 style={{ marginTop: "8px", fontSize: "22px", fontWeight: 800 }}>PayPilot hit an unexpected error</h1>
          <p style={{ marginTop: "8px", maxWidth: "380px", fontSize: "13.5px", lineHeight: 1.5, color: "#5F6067" }}>
            Please try again. If this keeps happening, let us know through the contact page.
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          style={{
            height: "40px",
            padding: "0 20px",
            borderRadius: "12px",
            border: "none",
            backgroundColor: "#111217",
            color: "#fff",
            fontSize: "13px",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}

"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/monitoring/client";

/* Last-resort boundary for errors in the root layout itself. Plain markup:
   the design system and fonts may be what failed. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { reportClientError(error, { source: "global-error" }); }, [error]);
  return (
    <html lang="en-IN">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0, background: "#fffdf8", color: "#0b1220" }}>
        <div style={{ textAlign: "center", padding: 24 }}>
          <h1 style={{ fontSize: 28, margin: 0 }}>XOXO Travels is having a moment</h1>
          <p style={{ color: "#465062" }}>Refresh the page, or try again shortly.</p>
          <button onClick={reset} style={{ marginTop: 16, padding: "12px 24px", borderRadius: 999, border: 0, background: "#0a6b52", color: "#fff", fontWeight: 600, cursor: "pointer" }}>Try again</button>
        </div>
      </body>
    </html>
  );
}

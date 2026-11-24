"use client";

/* Last-resort boundary for errors in the root layout itself. Plain markup:
   the design system and fonts may be what failed. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en-IN">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0, background: "#fbf8f3", color: "#070d1a" }}>
        <div style={{ textAlign: "center", padding: 24 }}>
          <h1 style={{ fontSize: 28, margin: 0 }}>XOXO Travels is having a moment</h1>
          <p style={{ color: "#4a5565" }}>Refresh the page, or try again shortly.</p>
          <button onClick={reset} style={{ marginTop: 16, padding: "12px 24px", borderRadius: 999, border: 0, background: "#087f63", color: "#fff", fontWeight: 600, cursor: "pointer" }}>Try again</button>
        </div>
      </body>
    </html>
  );
}

import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

/* OG renderer can't read woff2, so a woff copy of each brand face lives in src/fonts/og. */
export async function ogFonts() {
  const dir = join(process.cwd(), "src/fonts/og");
  const files = ["bricolage-800.woff", "bricolage-800-ext.woff", "dm-sans-500.woff", "dm-sans-500-ext.woff"];
  const [display, displayExt, body, bodyExt] = await Promise.all(files.map((f) => readFile(join(dir, f))));
  // The -ext files carry ₹; the renderer falls back to them per glyph, so
  // nothing is fetched from Google Fonts at build or request time.
  return [
    { name: "Bricolage", data: display, weight: 800 as const, style: "normal" as const },
    { name: "DM Sans", data: body, weight: 500 as const, style: "normal" as const },
    { name: "Bricolage Ext", data: displayExt, weight: 800 as const, style: "normal" as const },
    { name: "DM Sans Ext", data: bodyExt, weight: 500 as const, style: "normal" as const },
  ];
}

/** Shared card layout: brand mark, eyebrow, headline, footer line. */
export function OgCard({ eyebrow, title, footer, accent = "#d4a73a" }: { eyebrow: string; title: string; footer: string; accent?: string }) {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "linear-gradient(135deg, #0b1220 0%, #0a6b52 55%, #1e9c76 100%)", color: "#fff", fontFamily: "DM Sans, DM Sans Ext" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none"><path d="M3 13.5 12 4l9 9.5M7 11v8h10v-8" stroke="#1e9c76" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <div style={{ display: "flex", fontFamily: "Bricolage, Bricolage Ext", fontSize: 40, letterSpacing: -1 }}>XOXO<span style={{ color: accent }}>.</span>Travels</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ fontSize: 28, textTransform: "uppercase", letterSpacing: 4, opacity: 0.85 }}>{eyebrow}</div>
        <div style={{ fontFamily: "Bricolage, Bricolage Ext", fontSize: title.length > 28 ? 76 : 96, lineHeight: 1.0, letterSpacing: -3, maxWidth: 1000 }}>{title}</div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 28 }}>
        <span style={{ opacity: 0.9 }}>{footer}</span>
        <span style={{ background: accent, color: "#0b1220", padding: "10px 22px", borderRadius: 999, fontSize: 26 }}>Book on xoxotravels.in</span>
      </div>
    </div>
  );
}

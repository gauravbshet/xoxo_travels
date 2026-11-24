import localFont from "next/font/local";

/* Self-hosted variable fonts (OFL licensed, see src/fonts/LICENSE-*).
   No third-party request at build or runtime. */

export const bricolage = localFont({
  src: "../fonts/bricolage-grotesque.woff2",
  variable: "--font-bricolage",
  weight: "200 800",
  display: "swap",
});

export const dmSans = localFont({
  src: "../fonts/dm-sans.woff2",
  variable: "--font-dm-sans",
  weight: "100 1000",
  display: "swap",
});

/*
 * The main files are Latin-only and lack ₹ (U+20B9), so prices fell back to a
 * system glyph. These ~1 KB files hold just ₹, cut from each family's
 * latin-ext subset. unicode-range means the browser only fetches them when a
 * ₹ is on screen, and only uses them for that character. They sit first in
 * the font stack (globals.css).
 */
// next/font needs literal options, hence the repetition.
export const bricolageRupee = localFont({
  src: "../fonts/bricolage-rupee.woff2",
  variable: "--font-bricolage-rupee",
  weight: "200 800",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  fallback: [],
  declarations: [{ prop: "unicode-range", value: "U+20B9" }],
});

export const dmSansRupee = localFont({
  src: "../fonts/dm-sans-rupee.woff2",
  variable: "--font-dm-sans-rupee",
  weight: "100 1000",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  fallback: [],
  declarations: [{ prop: "unicode-range", value: "U+20B9" }],
});

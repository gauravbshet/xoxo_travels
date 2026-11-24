import "server-only";

/* Email over Resend's REST API (one POST, so no SDK dependency).
   - Key set: sends through Resend.
   - Key missing in development: prints the email to the console.
   - Key missing in production: throws. Never pretend an email went out. */

const real = (v: string | undefined) => (v && v.trim() && !/x{6,}/i.test(v) ? v.trim() : undefined);

/** Resend's shared test sender works without a verified domain (delivers to your own Resend account email). */
const DEV_FROM = "XOXO Travels <onboarding@resend.dev>";

export type Email = { to: string; subject: string; html: string; text: string };

export async function sendEmail(email: Email): Promise<{ id: string | null; mode: "resend" | "console" }> {
  const key = real(process.env.RESEND_API_KEY);
  if (!key) {
    if (process.env.NODE_ENV === "production") throw new Error("RESEND_API_KEY is not set; email not sent.");
    console.info(`\n[email:dev] To: ${email.to}\n[email:dev] Subject: ${email.subject}\n${email.text}\n`);
    return { id: null, mode: "console" };
  }
  const from = process.env.EMAIL_FROM?.trim() || (process.env.NODE_ENV === "production" ? undefined : DEV_FROM);
  if (!from) throw new Error("EMAIL_FROM is not set.");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [email.to], subject: email.subject, html: email.html, text: email.text }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Resend failed (${res.status}): ${(await res.text().catch(() => "")).slice(0, 200)}`);
  const json = (await res.json()) as { id?: string };
  return { id: json.id ?? null, mode: "resend" };
}

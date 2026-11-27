/* Checks the production configuration by key SHAPE only. It never prints values.
   Used at server start (instrumentation.ts) and by `npm run check:env`. */

export type EnvProblem = { level: "error" | "warn"; key: string; message: string };

const placeholder = (v: string) => /x{5,}|<[^>@]+>|your[-_]|changeme/i.test(v); // "<account-id>" is a template, "Name <a@b.c>" is not
const get = (env: NodeJS.ProcessEnv, k: string) => {
  const v = env[k]?.trim();
  return v && !placeholder(v) ? v : "";
};

export function checkProductionEnv(env: NodeJS.ProcessEnv = process.env): EnvProblem[] {
  const out: EnvProblem[] = [];
  const need = (key: string, message: string, level: "error" | "warn" = "error") => { if (!get(env, key)) out.push({ level, key, message }); };
  const v = (k: string) => get(env, k);

  // Site
  need("NEXT_PUBLIC_SITE_URL", "public address of the site, e.g. https://xoxotravels.in");
  if (v("NEXT_PUBLIC_SITE_URL") && !v("NEXT_PUBLIC_SITE_URL").startsWith("https://")) out.push({ level: "error", key: "NEXT_PUBLIC_SITE_URL", message: "must start with https:// in production" });

  // Database
  need("DATABASE_URL", "Supabase transaction pooler URL");
  const dbUrl = v("DATABASE_URL");
  if (dbUrl && !/:6543\//.test(dbUrl)) out.push({ level: "warn", key: "DATABASE_URL", message: "use the transaction pooler (port 6543) on Vercel, or connections will run out" });
  if (dbUrl && !/pgbouncer=true/.test(dbUrl)) out.push({ level: "warn", key: "DATABASE_URL", message: "add ?pgbouncer=true for the transaction pooler" });
  need("DIRECT_DATABASE_URL", "session pooler URL (port 5432), used to apply migrations");

  // Auth
  need("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "Clerk publishable key");
  need("CLERK_SECRET_KEY", "Clerk secret key");
  need("CLERK_WEBHOOK_SECRET", "keeps user accounts in sync (Clerk webhook signing secret)");
  if (v("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY").startsWith("pk_test_")) out.push({ level: "warn", key: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", message: "is a development key; create a production instance in Clerk for your domain" });
  need("ADMIN_EMAILS", "who gets the admin panel");

  // Payments
  if (!v("NEXT_PUBLIC_RAZORPAY_KEY_ID") && !v("RAZORPAY_KEY_ID")) out.push({ level: "error", key: "RAZORPAY_KEY_ID", message: "Razorpay key id" });
  need("RAZORPAY_KEY_SECRET", "Razorpay key secret");
  need("RAZORPAY_WEBHOOK_SECRET", "confirms payments if the customer closes the tab mid-payment");
  if ((v("NEXT_PUBLIC_RAZORPAY_KEY_ID") || v("RAZORPAY_KEY_ID")).startsWith("rzp_test_")) out.push({ level: "warn", key: "RAZORPAY_KEY_ID", message: "is a test key; no real money will be taken" });

  // Services
  need("RESEND_API_KEY", "booking emails");
  need("EMAIL_FROM", "sender address on a domain verified in Resend");
  for (const k of ["S3_ENDPOINT", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY", "S3_BUCKET_PUBLIC", "S3_BUCKET_PRIVATE", "NEXT_PUBLIC_MEDIA_BASE_URL"]) need(k, "file storage (Cloudflare R2): photos, IDs, chat images");
  need("ABLY_API_KEY", "live chat updates");
  need("UPSTASH_REDIS_REST_URL", "rate limiting");
  need("UPSTASH_REDIS_REST_TOKEN", "rate limiting");
  need("CRON_SECRET", "protects the nightly maintenance job");
  if (!v("NEXT_PUBLIC_SENTRY_DSN") && !v("SENTRY_DSN")) out.push({ level: "warn", key: "NEXT_PUBLIC_SENTRY_DSN", message: "errors are only logged, not reported" });
  if (env.RAZORPAY_ALLOW_LIVE_IN_DEV === "true") out.push({ level: "warn", key: "RAZORPAY_ALLOW_LIVE_IN_DEV", message: "only meant for local testing; remove it in production" });
  if (env.CSP_REPORT_ONLY === "true") out.push({ level: "warn", key: "CSP_REPORT_ONLY", message: "the security policy only reports, it doesn't block" });

  // Same key reported twice for the S3 group: keep one line per key.
  return out.filter((p, i, a) => a.findIndex((q) => q.key === p.key && q.message === p.message) === i);
}

export function formatProblems(problems: EnvProblem[]) {
  const errors = problems.filter((p) => p.level === "error"), warns = problems.filter((p) => p.level === "warn");
  const lines = [
    ...(errors.length ? ["MISSING (these features fail in production):", ...errors.map((p) => `  ✗ ${p.key}: ${p.message}`)] : []),
    ...(warns.length ? ["CHECK:", ...warns.map((p) => `  ! ${p.key}: ${p.message}`)] : []),
  ];
  return lines.join("\n");
}

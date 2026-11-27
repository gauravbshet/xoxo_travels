# Going live: XOXO Travels on Vercel

Work top to bottom. Each step says where to click and what to paste. Run
`npm run check:env` at any point: it lists what's still missing (key names only).

---

## 1. Production database (Supabase, Mumbai)

Your current database is in Tokyo and holds test data. Use a fresh one for real customers.

1. supabase.com → **New project** → Region **South Asia (Mumbai) `ap-south-1`**.
2. Project → **Connect** → copy two URLs:
   - **Transaction pooler** (port **6543**). Add `?pgbouncer=true` to the end → this is `DATABASE_URL`.
   - **Session pooler** (port **5432**) → this is `DIRECT_DATABASE_URL`.
   - The username must look like `postgres.<project-ref>`.
3. Tables are created automatically on the first production deploy (step 9 runs the migrations).
4. Want the demo packages, trips and destinations? After the first deploy, run once from your computer with the production URLs in `.env`: `npm run db:seed`. Otherwise add your real catalog in the admin panel.

> Keeping the Tokyo database? Then change `"regions": ["bom1"]` in `vercel.json` to `["hnd1"]`, so the servers sit next to it.

## 2. Sign-in (Clerk production instance)

1. Clerk dashboard → your app → **Create production instance**.
2. Add your domain (e.g. `xoxotravels.in`) and add the DNS records Clerk shows at your registrar.
3. Copy `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (`pk_live_…`) and `CLERK_SECRET_KEY` (`sk_live_…`).
4. **Webhooks** → Add endpoint `https://YOUR-DOMAIN/api/webhooks/clerk`, events `user.created`, `user.updated`, `user.deleted` → copy the signing secret → `CLERK_WEBHOOK_SECRET`.
5. Google sign-in: **SSO connections → Google** → use your own Google OAuth credentials (required for production).
6. Rename the application (it still says "My Application" on the sign-in page).

## 3. Payments (Razorpay live)

1. Razorpay dashboard → **Live mode** → API keys → `RAZORPAY_KEY_ID` (`rzp_live_…`) and `RAZORPAY_KEY_SECRET`.
2. **Webhooks** → Add `https://YOUR-DOMAIN/api/webhooks/razorpay`, events `payment.captured`, `payment.failed`, `order.paid`; set a secret → `RAZORPAY_WEBHOOK_SECRET`.
3. Remove `RAZORPAY_ALLOW_LIVE_IN_DEV` if you set it.
4. Clean up your local `.env`: it has a duplicate `RAZORPAY_KEY_SECRET` line and an old placeholder `NEXT_PUBLIC_RAZORPAY_KEY_ID`.

## 4. Email (Resend)

Your current `RESEND_API_KEY` is still the template placeholder, which is why no emails were sent.

1. resend.com → **Domains** → add `xoxotravels.in` → add the DNS records at your registrar → wait for "Verified".
2. **API Keys** → create one with Sending access → `RESEND_API_KEY`.
3. `EMAIL_FROM` = e.g. `XOXO Travels <bookings@xoxotravels.in>` (must be on the verified domain).

## 5. File storage (Cloudflare R2)

1. Cloudflare → **R2** → create two buckets: one public (e.g. `xoxo-public`), one private (e.g. `xoxo-private`).
2. Public bucket → **Settings → Custom domain** → e.g. `media.xoxotravels.in` → `NEXT_PUBLIC_MEDIA_BASE_URL=https://media.xoxotravels.in`.
3. Both buckets → **CORS**: allow `PUT` from `https://YOUR-DOMAIN` with header `content-type`.
4. **Manage R2 API tokens** → Object Read & Write on both buckets → `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`.
5. `S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com`, `S3_REGION=auto`, `S3_BUCKET_PUBLIC`, `S3_BUCKET_PRIVATE`.

## 6. Live chat (Ably)

ably.com → new app → **API Keys** → the root key (`xxxx.yyyy:zzzz`) → `ABLY_API_KEY`.

## 7. Rate limiting (Upstash)

upstash.com → **Create Database** (Redis, region **ap-south-1 Mumbai**) → **REST API** → `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.
Without these, production refuses data-changing actions (by design, see `src/config/security.ts`).

## 8. Error reports (Sentry)

sentry.io → new **Next.js** project → **Client Keys (DSN)** → `NEXT_PUBLIC_SENTRY_DSN`.

## 9. Deploy on Vercel

1. Push the repo to GitHub (nothing is committed yet beyond the first commit).
2. vercel.com → **Add New → Project** → import the repo. Framework is detected as Next.js; leave build settings alone (it uses `npm run vercel-build`, which runs migrations on production deploys only).
3. **Settings → Environment Variables** (Production): add everything from steps 1–8, plus:
   - `NEXT_PUBLIC_SITE_URL=https://YOUR-DOMAIN`
   - `ADMIN_EMAILS=you@example.com` (comma-separated)
   - `CRON_SECRET=` a long random string: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - Optional: `CSP_REPORT_ONLY=true` for the very first deploy, then remove it.
4. **Deploy**. The build log shows `prisma migrate deploy` creating the tables.
5. **Settings → Domains** → add your domain and follow the DNS instructions.
6. Vercel **Cron Jobs** tab should list `/api/cron/maintenance` daily at 02:00 IST.

## 10. After the first deploy

- [ ] `https://YOUR-DOMAIN/api/health` shows `"ok": true`.
- [ ] Vercel → **Logs**: no `[startup] Production configuration` block (it lists anything missing).
- [ ] Sign up a new account; sign in as the admin email and open `/admin`.
- [ ] Make a real ₹1 booking (create a ₹1 test package in admin, set it Active), pay, check the confirmation email and the GST invoice, then refund it from **Admin → Bookings** and check Razorpay shows the refund. Delete or hide the ₹1 package afterwards.
- [ ] Upload a profile photo (tests R2) and send a chat message between two accounts (tests Ably).
- [ ] Browser console on a few pages: no "Content Security Policy" errors. If you set `CSP_REPORT_ONLY=true`, remove it now and redeploy.
- [ ] Add an uptime monitor (UptimeRobot / Better Stack, free) on `/api/health`.

## Business details to fill before launch

- `src/config/invoice.ts`: GSTIN, legal name, address; confirm CGST+SGST vs IGST with your CA.
- `src/config/site.ts`: real phone, address, social links (phone is still a placeholder).
- Have the privacy and terms pages reviewed (they're marked as drafts).

## What's already built for scale

- Pages cached at the edge and refreshed instantly when admin edits something.
- Small database pools per server instance, built for Supabase's transaction pooler.
- Indexes on every hot query (seat counts, chats, rate limits, admin lists).
- Rate limits, security headers (CSP), Sentry error reports.
- Nightly job: cancels unpaid bookings whose trip started, completes trips that ended.
- `/api/health` for uptime monitors; startup check that lists missing production keys.

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { authPaths, clerkEnabled } from "@/lib/auth/config";
import { hit, ipFrom, waitText } from "@/lib/rate-limit-core";

/* Routes that need a signed-in user. Public pages stay public. */
const isProtected = createRouteMatcher([
  "/account(.*)",
  "/checkout(.*)",
  "/partners(.*)",
  "/chat(.*)",
  "/admin(.*)",
  "/api/me(.*)",
  "/api/partners(.*)",
  "/api/chat(.*)",
  "/api/admin(.*)",
]);

const withClerk = clerkMiddleware(async (auth, req) => {
  if (isProtected(req)) await auth.protect();
}, { signInUrl: authPaths.signIn, signUpUrl: authPaths.signUp }); // send to our own pages, not Clerk's hosted ones

/** Per-IP cap on server-action POSTs (every form and button that changes data). */
async function actionFlood(req: NextRequest) {
  if (req.method !== "POST" || !req.headers.has("next-action")) return null;
  try {
    const r = await hit("actionsPerIp", ipFrom(req.headers));
    if (r.ok) return null;
    return new NextResponse(`Too many requests. Try again in ${waitText(r.retryAfterSec)}.`, { status: 429, headers: { "Retry-After": String(r.retryAfterSec) } });
  } catch (e) {
    console.error("[rate-limit]", e instanceof Error ? e.message : e);
    return new NextResponse("This is unavailable right now. Try again later.", { status: 503 });
  }
}

export default async function proxy(req: NextRequest, event: Parameters<typeof withClerk>[1]) {
  const flood = await actionFlood(req);
  if (flood) return flood;
  // Until Clerk keys are set, pass everything through so the site still works.
  if (!clerkEnabled) return NextResponse.next();
  return withClerk(req, event);
}

export const config = {
  matcher: [
    // Skip Next internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};

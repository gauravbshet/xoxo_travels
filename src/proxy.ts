import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { authPaths, clerkEnabled } from "@/lib/auth/config";

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

export default function proxy(req: NextRequest, event: Parameters<typeof withClerk>[1]) {
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

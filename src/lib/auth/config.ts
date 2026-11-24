/** Clerk is wired only once its publishable key exists, so the site runs
 *  before you've created a Clerk app. Everything auth-related checks this. */
export const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export const authPaths = {
  signIn: "/sign-in",
  signUp: "/sign-up",
  afterSignIn: "/account",
  afterSignUp: "/account/profile?new=1",
} as const;

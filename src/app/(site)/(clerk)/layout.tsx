import { AuthProvider } from "@/components/auth/auth-provider";

/*
 * Clerk's client code loads only inside this group: sign-in and sign-up now,
 * account / partners / chat / admin as they're built. Public pages stay
 * Clerk-free (~70 KB less JS). Server-side protection lives in src/proxy.ts.
 */
export default function ClerkLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

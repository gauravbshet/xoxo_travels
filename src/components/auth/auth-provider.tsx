import { ClerkProvider } from "@clerk/nextjs";
import { authPaths, clerkEnabled } from "@/lib/auth/config";

/* Brand-matched Clerk appearance. Tokens mirror globals.css. */
const appearance = {
  variables: {
    colorPrimary: "#087f63",
    colorText: "#070d1a",
    colorTextSecondary: "#44505f",
    colorBackground: "#ffffff",
    colorInputBackground: "#ffffff",
    colorInputText: "#070d1a",
    colorDanger: "#e85b2f",
    colorSuccess: "#19b99a",
    borderRadius: "0.875rem",
    fontFamily: "var(--font-dm-sans), ui-sans-serif, system-ui, sans-serif",
  },
  elements: {
    formButtonPrimary: "rounded-full font-semibold bg-[#087f63] shadow-[0_12px_40px_-8px_rgb(22_214_154/0.25)] hover:bg-[#05654f]",
    card: "shadow-[0_2px_4px_rgb(7_13_26/0.05),0_18px_40px_-16px_rgb(7_13_26/0.2)] border border-[#e6e1d8]",
    headerTitle: "font-[var(--font-bricolage)] font-bold tracking-tight",
    socialButtonsBlockButton: "rounded-full border-[#e6e1d8]",
    formFieldInput: "rounded-[0.875rem] border-[#e6e1d8] focus:ring-4 focus:ring-[#bdf1db]",
    footerActionLink: "text-[#087f63] font-semibold",
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (!clerkEnabled) return <>{children}</>;
  return (
    <ClerkProvider
      appearance={appearance}
      signInUrl={authPaths.signIn}
      signUpUrl={authPaths.signUp}
      signInFallbackRedirectUrl={authPaths.afterSignIn}
      signUpFallbackRedirectUrl={authPaths.afterSignUp}
    >
      {children}
    </ClerkProvider>
  );
}

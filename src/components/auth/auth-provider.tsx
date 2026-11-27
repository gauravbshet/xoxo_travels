import { ClerkProvider } from "@clerk/nextjs";
import { authPaths, clerkEnabled } from "@/lib/auth/config";

/* Brand-matched Clerk appearance. Tokens mirror globals.css. */
const appearance = {
  variables: {
    colorPrimary: "#0a6b52",
    colorText: "#0b1220",
    colorTextSecondary: "#465062",
    colorBackground: "#ffffff",
    colorInputBackground: "#ffffff",
    colorInputText: "#0b1220",
    colorDanger: "#c2410c",
    colorSuccess: "#1e9c76",
    borderRadius: "0.875rem",
    fontFamily: "var(--font-dm-sans), ui-sans-serif, system-ui, sans-serif",
  },
  elements: {
    formButtonPrimary: "rounded-full font-semibold bg-[#0a6b52] shadow-[0_12px_40px_-8px_rgb(10_107_82/0.25)] hover:bg-[#07523f]",
    card: "shadow-[0_2px_4px_rgb(11_18_32/0.05),0_18px_40px_-16px_rgb(11_18_32/0.2)] border border-[#e9e3d7]",
    headerTitle: "font-[var(--font-bricolage)] font-bold tracking-tight",
    socialButtonsBlockButton: "rounded-full border-[#e9e3d7]",
    formFieldInput: "rounded-[0.875rem] border-[#e9e3d7] focus:ring-4 focus:ring-[#c3e8d6]",
    footerActionLink: "text-[#0a6b52] font-semibold",
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
      telemetry={false} // no usage pings to Clerk (also keeps the CSP connect list short)
    >
      {children}
    </ClerkProvider>
  );
}

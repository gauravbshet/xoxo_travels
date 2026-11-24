import type { Metadata } from "next";
import { Suspense } from "react";
import { SignIn } from "@clerk/nextjs";
import { clerkEnabled } from "@/lib/auth/config";
import { AuthSetupNotice } from "@/components/auth/auth-setup-notice";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <div className="container-x flex min-h-[70vh] items-center justify-center py-12">
      {clerkEnabled ? (
        <Suspense fallback={<div className="skeleton h-[28rem] w-full max-w-sm" />}>
          <SignIn />
        </Suspense>
      ) : <AuthSetupNotice />}
    </div>
  );
}

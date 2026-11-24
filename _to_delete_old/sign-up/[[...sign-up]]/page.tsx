import type { Metadata } from "next";
import { Suspense } from "react";
import { SignUp } from "@clerk/nextjs";
import { clerkEnabled } from "@/lib/auth/config";
import { AuthSetupNotice } from "@/components/auth/auth-setup-notice";

export const metadata: Metadata = { title: "Create account" };

export default function SignUpPage() {
  return (
    <div className="container-x flex min-h-[70vh] items-center justify-center py-12">
      {clerkEnabled ? (
        <Suspense fallback={<div className="skeleton h-[28rem] w-full max-w-sm" />}>
          <SignUp />
        </Suspense>
      ) : <AuthSetupNotice />}
    </div>
  );
}

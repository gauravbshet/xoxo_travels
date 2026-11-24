"use client";

import * as React from "react";
import { Button } from "@/components/ui";
import { authPaths, clerkEnabled } from "@/lib/auth/config";

/*
 * Navbar auth slot without Clerk's client bundle. Clerk sets a readable
 * `__client_uat` cookie (a timestamp; "0" when signed out). We only use it to
 * pick a label. If it's ever wrong the cost is a signed-in user seeing
 * "Sign in", which takes them straight to their account anyway.
 */
function readSignedIn() {
  return /(?:^|;\s*)__client_uat(?:_[^=]+)?=(?!0(?:;|$))\d+/.test(document.cookie);
}
const subscribe = (cb: () => void) => {
  window.addEventListener("focus", cb);
  return () => window.removeEventListener("focus", cb);
};

export function AuthButtons({ compact }: { compact?: boolean }) {
  const signedIn = React.useSyncExternalStore(subscribe, () => clerkEnabled && readSignedIn(), () => false);
  const size = compact ? "md" : "sm";
  const w = compact ? "w-full" : "";
  return signedIn
    ? <Button href={authPaths.afterSignIn} variant="outline" size={size} className={w}>My account</Button>
    : <Button href={authPaths.signIn} variant="outline" size={size} className={w}>Sign in</Button>;
}

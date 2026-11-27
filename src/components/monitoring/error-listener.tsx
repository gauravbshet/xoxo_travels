"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/monitoring/client";

/* Reports browser errors that happen outside React rendering
   (event handlers, timers, failed promises). Renders nothing. */
export function ErrorListener() {
  useEffect(() => {
    const onError = (e: ErrorEvent) => reportClientError(e.error ?? e.message, { source: "window.onerror" });
    const onRejection = (e: PromiseRejectionEvent) => reportClientError(e.reason, { source: "unhandledrejection" });
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => { window.removeEventListener("error", onError); window.removeEventListener("unhandledrejection", onRejection); };
  }, []);
  return null;
}

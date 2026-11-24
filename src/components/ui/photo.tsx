"use client";

import * as React from "react";
import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/cn";

/**
 * next/image with a graceful fallback: if the source fails, the tile keeps its
 * shape and shows a quiet brand gradient instead of a broken-image icon.
 */
export function Photo({ className, alt, ...rest }: ImageProps) {
  const [failed, setFailed] = React.useState(false);
  if (failed) {
    return (
      <div role="img" aria-label={alt} className={cn("h-full w-full bg-[linear-gradient(135deg,var(--color-sky-100),var(--color-leaf-50))]", className)} />
    );
  }
  return <Image alt={alt} className={className} onError={() => setFailed(true)} {...rest} />;
}

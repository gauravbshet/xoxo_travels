"use client";

import * as React from "react";
import { recordViewed } from "@/lib/recently-viewed";

/** Remembers this package in the visitor's own browser for "Recommended for you". Renders nothing. */
export function TrackView({ slug, destinationSlug, themes }: { slug: string; destinationSlug: string; themes: string[] }) {
  React.useEffect(() => { recordViewed({ slug, destinationSlug, themes }); }, [slug, destinationSlug, themes]);
  return null;
}

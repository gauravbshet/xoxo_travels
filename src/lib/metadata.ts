import type { Metadata } from "next";

/**
 * Per-page metadata: title, description, canonical and matching OG/Twitter
 * fields. Root layout holds only site-wide fields, because anything page-
 * specific set there (canonical, og:url, og:title) leaks into every page.
 */
export function pageMeta({ title, description, path, absoluteTitle, image = "/opengraph-image" }: {
  title: string; description: string; path: string; absoluteTitle?: boolean;
  /** Pass false on pages that ship their own opengraph-image file. */
  image?: string | false;
}): Metadata {
  // A page-level openGraph object replaces the parent's, dropping the image
  // inherited from app/opengraph-image — so reference it explicitly.
  const images = image ? [{ url: image, width: 1200, height: 630 }] : undefined;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, ...(images && { images }) },
    twitter: { card: "summary_large_image", title, description, ...(images && { images }) },
  };
}

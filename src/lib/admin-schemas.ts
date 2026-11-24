import { z } from "zod";
import { allowedImageHosts } from "@/config/media";

/* zod pieces shared by admin server actions. */

export const line = (max: number, what: string) => z.string().trim().min(1, `${what} can't be empty.`).max(max, `${what} is too long (max ${max} characters).`);

export const slugSchema = z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug can use lowercase letters, numbers and single hyphens.").max(80);

export const imageUrlSchema = z.url("Enter a full image URL.").refine((u) => {
  try { const h = new URL(u); return h.protocol === "https:" && (allowedImageHosts as readonly string[]).includes(h.hostname); } catch { return false; }
}, `Image must be an https URL from ${allowedImageHosts.join(", ")}.`);

export const isoDate = (what: string) => z.string().regex(/^\d{4}-\d{2}-\d{2}$/, `Enter ${what}.`);

import "server-only";
import { inspect, removeObject, sniff, type Bucket } from "@/lib/storage";

/**
 * Re-checks an object after the browser uploaded it: the key is under the expected
 * prefix, it fits the size limit, and its first bytes really are an allowed type
 * (not just the declared type). Deletes it if not. Returns an error message or null.
 */
export async function verifyUpload(bucket: Bucket, key: string, prefix: string, rule: { maxBytes: number; types: readonly string[] }): Promise<string | null> {
  if (!key.startsWith(prefix)) return "That upload doesn't belong to you.";
  const info = await inspect(bucket, key);
  if (!info) return "The upload didn't arrive. Try again.";
  const real = sniff(info.prefix);
  if (info.size > rule.maxBytes || !real || !rule.types.includes(real)) {
    await removeObject(bucket, key).catch(() => {});
    return info.size > rule.maxBytes ? "The file is too large." : "That file isn't a supported type.";
  }
  return null;
}

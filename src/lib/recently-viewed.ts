/* Packages this visitor opened, kept only in their own browser (localStorage),
   to power "Recommended for you". Nothing is sent anywhere. Every access is
   guarded: storage can be blocked, full or cleared at any time. */

export type Viewed = { slug: string; destinationSlug: string; themes: string[] };

const KEY = "xoxo:viewed";
const MAX = 8;

export function readViewed(): Viewed[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(list) ? list.filter((v): v is Viewed => typeof v?.slug === "string" && Array.isArray(v?.themes)).slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export function recordViewed(v: Viewed) {
  try {
    const next = [v, ...readViewed().filter((x) => x.slug !== v.slug)].slice(0, MAX);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable: recommendations just fall back to top rated */
  }
}

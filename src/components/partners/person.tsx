import { VerifiedBadge } from "@/components/ui";
import { cn } from "@/lib/cn";

/* Avatar + name line used on match cards, requests and chat. Server-safe. */
export function Avatar({ url, name, size = "md" }: { url: string | null; name: string; size?: "sm" | "md" | "lg" }) {
  const s = size === "sm" ? "size-10 text-base" : size === "lg" ? "size-20 text-2xl" : "size-14 text-xl";
  return (
    <div className={cn("shrink-0 overflow-hidden rounded-pill bg-sky-100", s)}>
      {url
        // eslint-disable-next-line @next/next/no-img-element -- user uploads come from storage, not a configured image host
        ? <img src={url} alt="" className="size-full object-cover" />
        : <span className="grid size-full place-items-center font-display font-bold text-sky-700" aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>}
    </div>
  );
}

export function PersonLine({ name, age, city, verified }: { name: string; age: number | null; city: string; verified: boolean }) {
  return (
    <div className="min-w-0">
      <p className="flex flex-wrap items-center gap-2 font-display text-lg font-bold leading-tight text-ink">{name}{verified && <VerifiedBadge />}</p>
      <p className="text-sm text-ink-soft">{[age ? `${age}` : null, city].filter(Boolean).join(" · ")}</p>
    </div>
  );
}

import Link from "next/link";
import { cn } from "@/lib/cn";
import { Badge, Photo } from "@/components/ui";
import { formatDuration, formatINR } from "@/lib/format";
import type { Inclusion, Package } from "@/lib/types";
import { CompareToggle } from "./compare-toggle";

const inclusionLabel: Record<Inclusion, string> = {
  flights: "Flights", hotel: "Hotel", meals: "Meals", transfers: "Transfers", sightseeing: "Sightseeing", visa: "Visa",
};

/** layout="list": on phones the card turns into a compact row (photo left, key facts right)
 *  so long result lists stay short. From sm up it is the normal card. */
export function PackageCard({ p, className, priority, layout = "card" }: { p: Package; className?: string; priority?: boolean; layout?: "card" | "list" }) {
  const off = p.listPrice ? Math.round((1 - p.price / p.listPrice) * 100) : 0;
  const list = layout === "list";
  return (
    <article
      className={cn(
        "group relative flex h-full overflow-hidden rounded-lg border border-line/70 bg-paper shadow-card",
        list ? "flex-row sm:flex-col" : "flex-col",
        /* Whole card outlines when its link is focused */
        "has-[a:focus-visible]:outline-3 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-sky-500",
        "transition-[transform,box-shadow] duration-base ease-out-soft hover:-translate-y-1 hover:shadow-card-hover motion-reduce:hover:translate-y-0",
        className,
      )}
    >
      <Link href={`/holidays/${p.slug}`} tabIndex={-1} aria-hidden="true" className={cn("relative block overflow-hidden bg-cream-deep", list ? "w-[38%] shrink-0 sm:w-auto sm:aspect-[4/3]" : "aspect-[4/3]")}>
        <Photo
          src={p.image.src} alt={p.image.alt} fill priority={priority}
          sizes={list ? "(min-width: 1280px) 300px, (min-width: 640px) 45vw, 40vw" : "(min-width: 1280px) 300px, (min-width: 640px) 45vw, 85vw"}
          className="object-cover transition-transform duration-500 ease-out-soft group-hover:scale-[1.05] motion-reduce:group-hover:scale-100"
        />
        <div className={cn("absolute flex gap-1.5", list ? "left-2 top-2 flex-col items-start sm:left-3 sm:top-3 sm:flex-row" : "left-3 top-3")}>
          {p.bestseller && <Badge tone="yellow" className="bg-sun-50/95">Bestseller</Badge>}
          {off > 0 && <Badge tone="coral" className="bg-coral-50/95">{off}% off</Badge>}
        </div>
        <Badge className={cn("absolute bg-paper/95 text-ink", list ? "bottom-2 left-2 sm:bottom-3 sm:left-3" : "bottom-3 left-3")}>{formatDuration(p.nights, p.days)}</Badge>
      </Link>

      <div className={cn("flex min-w-0 flex-1 flex-col", list ? "p-3 sm:p-4" : "p-4")}>
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-mute">{p.destinationName}</p>
        <h3 className={cn("mt-1 leading-snug", list ? "text-base sm:text-lg" : "text-lg")}>
          <Link href={`/holidays/${p.slug}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">{p.title}</Link>
        </h3>

        <ul className={cn("mt-2 space-y-1 text-sm text-ink-soft", list && "hidden sm:block")}>
          {p.highlights.slice(0, 3).map((h) => (
            <li key={h} className="flex items-start gap-1.5">
              <span aria-hidden="true" className="mt-[7px] size-1 shrink-0 rounded-full bg-sky-500" />{h}
            </li>
          ))}
        </ul>

        <ul className={cn("mt-3 flex-wrap gap-1", list ? "hidden sm:flex" : "flex")} aria-label="Included">
          {p.inclusions.map((i) => (
            <li key={i} className="rounded-sm bg-cream-deep px-1.5 py-0.5 text-xs font-semibold text-ink-soft">{inclusionLabel[i]}</li>
          ))}
        </ul>

        <div className={cn("mt-auto flex justify-between gap-2", list ? "flex-wrap items-end pt-3 sm:pt-4" : "items-end pt-4")}>
          <div>
            <p className="flex items-center gap-1 text-xs font-semibold text-ink-soft">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="text-sun-500"><path d="M12 2l3 6.5 7 .8-5.2 4.8 1.4 7-6.2-3.6L5.8 21l1.4-7L2 9.3l7-.8L12 2Z" /></svg>
              <span className="tabular">{p.rating.toFixed(1)}</span>
              <span className="font-medium text-ink-mute">({p.reviewCount})</span>
            </p>
            <p className="mt-1 leading-none">
              {p.listPrice && <span className="tabular mr-1.5 text-xs text-ink-mute line-through">{formatINR(p.listPrice)}</span>}
              <span className="tabular text-xl font-bold text-ink">{formatINR(p.price)}</span>
              <span className="text-xs font-medium text-ink-mute"> / person</span>
            </p>
          </div>
          <CompareToggle slug={p.slug} className="relative z-10" />
        </div>
      </div>
    </article>
  );
}

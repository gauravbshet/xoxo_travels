import Link from "next/link";
import { cn } from "@/lib/cn";
import { Badge, Photo } from "@/components/ui";
import { formatINR } from "@/lib/format";
import type { Destination } from "@/lib/types";

export function DestinationCard({ d, className, priority }: { d: Destination; className?: string; priority?: boolean }) {
  return (
    <Link
      href={`/destinations/${d.slug}`}
      className={cn(
        "group relative block aspect-[4/5] overflow-hidden rounded-lg bg-cream-deep shadow-card",
        "transition-[transform,box-shadow] duration-base ease-out-soft hover:-translate-y-1 hover:shadow-card-hover motion-reduce:hover:translate-y-0",
        className,
      )}
    >
      <Photo
        src={d.image.src}
        alt={d.image.alt}
        fill
        priority={priority}
        sizes="(min-width: 1280px) 300px, (min-width: 640px) 40vw, 72vw"
        className="object-cover transition-transform duration-500 ease-out-soft group-hover:scale-[1.05] motion-reduce:group-hover:scale-100"
      />
      {/* Text scrim */}
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_top,rgb(11_18_32/0.82)_0%,rgb(11_18_32/0.25)_45%,transparent_70%)]" />

      <div className="absolute left-3 top-3 flex gap-1.5">
        <Badge tone={d.region === "domestic" ? "blue" : "green"} className="bg-paper/90">{d.region === "domestic" ? "India" : "International"}</Badge>
      </div>

      <div className="absolute inset-x-0 bottom-0 p-4 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-white/70">{d.area}</p>
        <h3 className="mt-0.5 text-2xl leading-tight">{d.name}</h3>
        <p className="mt-1 line-clamp-1 text-sm text-white/80">{d.tagline}</p>
        <div className="mt-3 flex items-end justify-between gap-2 border-t border-white/15 pt-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-white/60">From</p>
            <p className="tabular text-lg font-bold leading-none">{d.fromPrice ? formatINR(d.fromPrice) : "—"}</p>
          </div>
          <p className="text-xs font-semibold text-white/80">{d.packageCount} packages</p>
        </div>
      </div>
    </Link>
  );
}

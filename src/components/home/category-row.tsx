import Link from "next/link";
import { cn } from "@/lib/cn";
import { Reveal } from "@/components/ui";
import { categories, type Category } from "@/config/categories";

const tones: Record<Category["tone"], string> = {
  blue:   "bg-sky-50 text-sky-600 group-hover:bg-sky-600 group-hover:text-white",
  green:  "bg-leaf-50 text-leaf-600 group-hover:bg-leaf-600 group-hover:text-white",
  coral:  "bg-coral-50 text-coral-700 group-hover:bg-coral-600 group-hover:text-white",
  yellow: "bg-sun-50 text-[#8a6100] group-hover:bg-sun-400 group-hover:text-ink",
};

export function CategoryRow() {
  return (
    <section aria-labelledby="categories-heading" className="pt-4 pb-0">
      <div className="container-x">
        <h2 id="categories-heading" className="sr-only">Browse by category</h2>
        <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0 sm:pb-0 lg:grid-cols-6">
          {categories.map((c, i) => (
            <Reveal as="li" key={c.slug} delay={i * 50} className="shrink-0 snap-start">
              <Link
                href={c.href}
                className={cn(
                  "group flex w-40 items-center gap-3 rounded-lg border border-line/70 bg-paper p-3 shadow-card",
                  "transition-[transform,box-shadow,border-color] duration-base ease-out-soft",
                  "hover:-translate-y-0.5 hover:border-transparent hover:shadow-card-hover motion-reduce:hover:translate-y-0",
                  "sm:w-auto",
                )}
              >
                <span className={cn("grid size-11 shrink-0 place-items-center rounded-md transition-colors duration-base", tones[c.tone])}>
                  <CategoryIcon slug={c.slug} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-bold text-ink">{c.label}</span>
                  <span className="block truncate text-xs text-ink-mute">{c.blurb}</span>
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

function CategoryIcon({ slug }: { slug: string }) {
  const p = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true as const };
  switch (slug) {
    case "domestic":      return <svg {...p}><path d="M3 20h18M5 20V9l7-5 7 5v11M9 20v-6h6v6" /></svg>;
    case "international": return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" /></svg>;
    case "honeymoon":     return <svg {...p}><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" /></svg>;
    case "adventure":     return <svg {...p}><path d="M3 20 9 8l3 5 2-3 7 10H3Z" /><path d="m9 8 1.5-3" /></svg>;
    case "weekend":       return <svg {...p}><rect x="3" y="5" width="18" height="16" rx="2.5" /><path d="M3 10h18M8 3v4M16 3v4M9 15h2M13 15h2" /></svg>;
    case "visa":          return <svg {...p}><rect x="5" y="3" width="14" height="18" rx="2" /><circle cx="12" cy="10" r="2.5" /><path d="M8.5 17c.8-1.8 2-2.5 3.5-2.5s2.7.7 3.5 2.5" /></svg>;
    default:              return null;
  }
}

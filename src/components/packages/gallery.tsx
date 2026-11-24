"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { Photo } from "@/components/ui";

/* Main image + thumbnails. On mobile the main image is a swipe strip;
   thumbnails jump to a slide. One index drives both. */
export function Gallery({ images, title }: { images: { src: string; alt: string }[]; title: string }) {
  const [i, setI] = React.useState(0);
  const track = React.useRef<HTMLDivElement>(null);

  const go = (n: number) => {
    setI(n);
    const el = track.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: n * el.clientWidth, behavior: reduce ? "auto" : "smooth" });
  };

  const onScroll = () => {
    const el = track.current;
    if (el) setI(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-xl bg-cream-deep">
        <div
          ref={track}
          onScroll={onScroll}
          className="flex aspect-[4/3] snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:aspect-[16/9]"
          aria-roledescription="carousel"
          aria-label={`${title} photos`}
        >
          {images.map((img, n) => (
            <div key={img.src} className="relative h-full w-full shrink-0 snap-center" aria-roledescription="slide" aria-label={`${n + 1} of ${images.length}`}>
              <Photo src={img.src} alt={img.alt} fill priority={n === 0} sizes="(min-width: 1024px) 760px, 100vw" className="object-cover" />
            </div>
          ))}
        </div>
        <p className="tabular absolute bottom-3 right-3 rounded-pill bg-ink/70 px-2.5 py-1 text-xs font-semibold text-white">{i + 1} / {images.length}</p>
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto [scrollbar-width:none]" role="group" aria-label="Choose photo">
          {images.map((img, n) => (
            <button
              key={img.src}
              type="button"
              onClick={() => go(n)}
              aria-label={`Show photo ${n + 1}`}
              aria-current={i === n ? "true" : undefined}
              className={cn("relative h-16 w-24 shrink-0 overflow-hidden rounded-md border-2 transition-[border-color,opacity] duration-fast",
                i === n ? "border-sky-600" : "border-transparent opacity-70 hover:opacity-100")}
            >
              <Photo src={img.src} alt="" fill sizes="96px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

import Image from "next/image";
import { heroImages } from "@/config/media";
import { getMonthOptions } from "@/lib/dates";
import { SearchPanel } from "./search-panel";
import { booking } from "@/config/booking";

export async function Hero() {
  const [img, months] = [heroImages[0], await getMonthOptions()];
  return (
    <section className="relative isolate">
      {/* Photo */}
      <div className="absolute inset-0 -z-10 overflow-hidden bg-[linear-gradient(160deg,#070d1a,#087f63_55%,#16d69a)]">
        <Image
          src={img.src}
          alt={img.alt}
          fill
          priority
          sizes="100vw"
          className="hero-img object-cover"
        />
        {/* Legibility scrim: top-left for text, bottom fade into the cream page */}
        <div className="absolute inset-0 bg-[linear-gradient(100deg,rgb(7_13_26/0.62)_0%,rgb(7_13_26/0.28)_55%,rgb(7_13_26/0.1)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(to_bottom,transparent,var(--color-cream))]" />
      </div>

      <div className="container-x pt-8 pb-8 sm:pt-20 sm:pb-10 lg:pt-28 lg:pb-14">
        <div className="max-w-2xl text-white">
          <p className="hero-rise inline-flex items-center gap-2 rounded-pill bg-white/15 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] backdrop-blur-sm" style={{ "--delay": "150ms" } as React.CSSProperties}>
            <span className="size-1.5 rounded-full bg-sun-400" aria-hidden="true" />
            {img.place} · in season now
          </p>
          <h1 className="hero-rise mt-4 text-[2.5rem] leading-[1.02] sm:mt-5 sm:text-6xl lg:text-7xl" style={{ "--delay": "250ms" } as React.CSSProperties}>
            Plan less.<br />
            <span className="text-sun-400">Travel more.</span>
          </h1>
          <p className="hero-rise mt-3 max-w-lg text-[15px] text-white/85 sm:mt-5 sm:text-lg" style={{ "--delay": "350ms" } as React.CSSProperties}>
            Holiday packages, fixed-date group trips and travelers heading your way. Book in minutes, pay securely, go.
          </p>
        </div>

        <div className="hero-rise mt-6 sm:mt-10 lg:mt-14" style={{ "--delay": "480ms" } as React.CSSProperties}>
          <SearchPanel months={months} />
        </div>

        <ul className="hero-rise mt-5 grid grid-cols-2 gap-x-4 gap-y-2 text-[13px] font-medium text-white/85 sm:mt-6 sm:flex sm:flex-wrap sm:gap-x-6 sm:text-sm lg:mt-8" style={{ "--delay": "650ms" } as React.CSSProperties}>
          {["No hidden charges", `Free cancellation up to ${booking.cancellation[0].minDays} days`, "24×7 trip support", "Secure Razorpay checkout"].map((t) => (
            <li key={t} className="inline-flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-leaf-500" /></svg>
              {t}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

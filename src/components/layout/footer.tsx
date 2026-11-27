import Link from "next/link";
import { cacheLife } from "next/cache";
import { footerNav, site } from "@/config/site";
import { Logo } from "./logo";

const social = [
  ["Instagram", site.social.instagram, "M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm5 5.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM17.5 6.5h.01"],
  ["Facebook", site.social.facebook, "M14 8h3V4h-3a4 4 0 0 0-4 4v2H7v4h3v6h4v-6h3l1-4h-4V8Z"],
  ["YouTube", site.social.youtube, "M3 8.5A3.5 3.5 0 0 1 6.5 5h11A3.5 3.5 0 0 1 21 8.5v7a3.5 3.5 0 0 1-3.5 3.5h-11A3.5 3.5 0 0 1 3 15.5v-7ZM10 9v6l5-3-5-3Z"],
  ["WhatsApp", site.social.whatsapp, "M4 20l1.3-3.9A8 8 0 1 1 8 19.2L4 20Zm5-10.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 1a4 4 0 0 1-2-2l1-1-1-2-1.5 1Z"],
] as const;

/* Compact footer: brand + contact on one line of blocks, link groups side by side
   even on phones, and a slim bottom bar. */
export async function Footer() {
  "use cache";
  cacheLife("days");
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto bg-ink text-white">
      <div className="container-x grid gap-7 py-8 sm:py-10 lg:grid-cols-[1.3fr_2fr] lg:gap-10">
        <div className="space-y-3">
          <Logo light />
          <p className="max-w-sm text-[13px] leading-relaxed text-white/70">
            Holiday packages, group trips and travel partners across India and the world.
          </p>
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-white/80">
            <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="hover:text-white">{site.phone}</a>
            <a href={`mailto:${site.email}`} className="hover:text-white">{site.email}</a>
          </p>
          <ul className="flex gap-1.5" aria-label="Social">
            {social.map(([label, href, d]) => (
              <li key={label}>
                <a href={href} target="_blank" rel="noreferrer" aria-label={label} className="grid size-9 place-items-center rounded-md bg-white/10 transition-colors duration-fast hover:bg-sky-600">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={d} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" /></svg>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Three link groups side by side at every width */}
        <div className="grid grid-cols-3 gap-4 sm:gap-8">
          {footerNav.map((group) => (
            <nav key={group.heading} aria-label={group.heading}>
              <h2 className="mb-2.5 font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-white/50">{group.heading}</h2>
              <ul className="space-y-1.5">
                {group.items.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="inline-block py-0.5 text-[13px] leading-snug text-white/80 transition-colors duration-fast hover:text-white">{item.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-1.5 py-3.5 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {site.name} · {site.address}</p>
          <p className="inline-flex items-center gap-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-sky-500"><path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>
            Secure payments via Razorpay · UPI, cards, net banking
          </p>
        </div>
      </div>
    </footer>
  );
}

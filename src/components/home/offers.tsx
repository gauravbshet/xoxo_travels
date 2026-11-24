import { cn } from "@/lib/cn";
import { CopyCode, Rail, Reveal, Section, SectionHeader } from "@/components/ui";
import { appliesToLabel, getActiveOffers, type Offer } from "@/lib/data/offers";
import { formatINR } from "@/lib/format";

/* band = voucher stub fill + its text colour (all pass AA); text = eyebrow */
const tones: Record<Offer["tone"], { band: string; text: string }> = {
  coral:  { band: "bg-coral-600 text-white", text: "text-coral-700" },
  blue:   { band: "bg-sky-600 text-white",   text: "text-sky-700" },
  green:  { band: "bg-leaf-600 text-white",  text: "text-leaf-600" },
  yellow: { band: "bg-sun-400 text-ink",     text: "text-[#8a6100]" },
};

const till = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });

export async function Offers() {
  const offers = await getActiveOffers(4);
  return (
    <Section aria-labelledby="offers-heading">
      <SectionHeader
        id="offers-heading"
        eyebrow="Offers"
        title="Codes that cut the bill"
        blurb="Copy a code, apply it at checkout. One code per booking."
        action={{ label: "All offers", href: "/offers" }}
      />
      <Rail label="Current offers" from="sm" gridClassName="sm:grid-cols-2 xl:grid-cols-4">
        {offers.map((o, i) => (
          <Reveal as="li" key={o.id} delay={i * 60}>
            <article className="flex h-full overflow-hidden rounded-lg border border-line/70 bg-paper shadow-card">
              {/* Coloured stub with the headline number, like a torn voucher edge */}
              <div className={cn("relative flex w-24 shrink-0 flex-col items-center justify-center p-3 text-center", tones[o.tone].band)}>
                <p className="font-display text-3xl font-extrabold leading-none">{o.kind === "percent" ? `${o.value}%` : `₹${o.value.toLocaleString("en-IN")}`}</p>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-wide opacity-90">off</p>
                <span aria-hidden="true" className="absolute -right-2 top-1/2 size-4 -translate-y-1/2 rounded-full bg-paper" />
              </div>
              <div className="flex flex-1 flex-col p-4">
                <p className={cn("text-[11px] font-bold uppercase tracking-[0.1em]", tones[o.tone].text)}>{appliesToLabel[o.appliesTo]}</p>
                <h3 className="mt-1 text-base leading-snug">{o.title}</h3>
                <p className="mt-1 text-sm text-ink-soft">{o.blurb}</p>
                <dl className="mt-2 text-xs text-ink-mute">
                  {o.minSpend && <div className="inline">Min. spend {formatINR(o.minSpend)}{o.maxDiscount ? " · " : ""}</div>}
                  {o.maxDiscount && <div className="inline">Up to {formatINR(o.maxDiscount)} off</div>}
                  <div>Valid till {till.format(new Date(o.validTill))}</div>
                </dl>
                <div className="mt-auto pt-3"><CopyCode code={o.code} /></div>
              </div>
            </article>
          </Reveal>
        ))}
      </Rail>
    </Section>
  );
}

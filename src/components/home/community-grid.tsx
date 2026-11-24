import Link from "next/link";
import { Photo, Reveal, Section, SectionHeader } from "@/components/ui";
import { getCommunityPhotos } from "@/lib/data/community";
import { site } from "@/config/site";

export async function CommunityGrid() {
  const photos = await getCommunityPhotos();
  return (
    <Section aria-labelledby="community-heading" className="bg-paper">
      <SectionHeader
        id="community-heading"
        eyebrow="From our travelers"
        title="Tag #xoxotravels to get featured"
        blurb="Real trips, posted by the people who took them."
        action={{ label: "Follow on Instagram", href: site.social.instagram }}
      />
      <ul className="grid grid-cols-3 gap-1.5 sm:gap-3 lg:grid-cols-6">
        {photos.map((ph, i) => (
          <Reveal as="li" key={ph.id} delay={i * 50} className={i === 0 ? "col-span-2 row-span-2" : ""}>
            <Link href={ph.href} className="group relative block aspect-square overflow-hidden rounded-sm bg-cream-deep sm:rounded-md">
              <Photo src={ph.src} alt={ph.alt} fill sizes={i === 0 ? "(min-width: 1024px) 400px, 100vw" : "(min-width: 1024px) 200px, 50vw"}
                className="object-cover transition-transform duration-500 ease-out-soft group-hover:scale-[1.05] motion-reduce:group-hover:scale-100" />
              <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(to_top,rgb(10_16_28/0.75),transparent)] p-3 pt-8 text-white opacity-0 transition-opacity duration-base group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:opacity-100">
                <p className="text-sm font-bold">{ph.place}</p>
                <p className="text-xs text-white/80">{ph.handle}</p>
              </div>
            </Link>
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}

/* Seed: npx prisma db seed  (or: npm run db:seed)
   Idempotent — upserts by slug/code, safe to re-run. */
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { isValidPostgresUrl } from "../src/lib/db-url";
import { DESTINATIONS, PACKAGES, TRIPS, OFFERS, REVIEWS } from "./seed-data";

const url = process.env.DIRECT_DATABASE_URL?.trim() || process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("DIRECT_DATABASE_URL or DATABASE_URL must be set to seed the database.");
  process.exit(1);
}
if (!isValidPostgresUrl(url)) {
  console.error("The configured database URL is invalid; use a PostgreSQL URL with URL-encoded credentials.");
  process.exit(1);
}
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

async function main() {
  console.log("Seeding destinations…");
  const destId = new Map<string, string>();
  for (const [i, d] of DESTINATIONS.entries()) {
    const row = await db.destination.upsert({
      where: { slug: d.slug },
      create: { slug: d.slug, name: d.name, area: d.area, region: d.region, tagline: d.tagline, imageSrc: d.image.src, imageAlt: d.image.alt, bestMonths: d.bestMonths, tags: d.tags, featured: d.featured, sortOrder: i },
      update: { name: d.name, area: d.area, region: d.region, tagline: d.tagline, imageSrc: d.image.src, imageAlt: d.image.alt, bestMonths: d.bestMonths, tags: d.tags, featured: d.featured, sortOrder: i },
    });
    destId.set(d.slug, row.id);
  }

  console.log("Seeding packages…");
  const pkgId = new Map<string, string>();
  for (const p of PACKAGES) {
    const data = { title: p.title, destinationId: destId.get(p.destinationSlug)!, nights: p.nights, price: p.price, listPrice: p.listPrice, imageSrc: p.image.src, imageAlt: p.image.alt, highlights: p.highlights, inclusions: p.inclusions, themes: p.themes, bestseller: p.bestseller, featured: p.featured };
    const row = await db.package.upsert({ where: { slug: p.slug }, create: { slug: p.slug, ...data }, update: data });
    pkgId.set(p.slug, row.id);
  }

  console.log("Seeding group trips…");
  for (const t of TRIPS) {
    // Group trips may reference destinations not in the catalogue yet (Meghalaya, Spiti)
    let id = destId.get(t.destinationSlug);
    if (!id) {
      const row = await db.destination.upsert({
        where: { slug: t.destinationSlug },
        create: { slug: t.destinationSlug, name: t.destinationName, area: t.destinationName, region: t.region, tagline: `${t.destinationName} group trips`, imageSrc: t.image.src, imageAlt: t.image.alt, bestMonths: "", tags: [], featured: false, sortOrder: 99 },
        update: {},
      });
      id = row.id; destId.set(t.destinationSlug, id);
    }
    const data = { title: t.title, destinationId: id, style: t.style.replace("-", "_") as "trek" | "backpacking" | "roadtrip" | "women_only", startDate: new Date(t.startDate), endDate: new Date(t.endDate), price: t.price, seatsTotal: t.seatsTotal, imageSrc: t.image.src, imageAlt: t.image.alt, leader: t.leader, featured: t.featured };
    await db.groupTrip.upsert({ where: { slug: t.slug }, create: { slug: t.slug, ...data }, update: data });
  }

  console.log("Seeding offers…");
  for (const o of OFFERS) {
    const data = { title: o.title, blurb: o.blurb, kind: o.kind, value: o.value, minSpend: o.minSpend, maxDiscount: o.maxDiscount, validTill: new Date(o.validTill), appliesTo: o.appliesTo, tone: o.tone };
    await db.offer.upsert({ where: { code: o.code }, create: { code: o.code, ...data }, update: data });
  }

  console.log("Seeding sample reviewers + reviews…");
  for (const [i, r] of REVIEWS.entries()) {
    const slug = r.tripHref.replace("/holidays/", "");
    const packageId = pkgId.get(slug);
    if (!packageId) continue; // group-trip reviews come later
    const email = `seed-${i + 1}@example.com`;
    const user = await db.user.upsert({
      where: { email },
      create: { clerkId: `seed_${i + 1}`, email, profile: { create: { displayName: r.name, city: r.city, verified: r.verified } } },
      update: {},
    });
    const reference = `XO-SEED${String(i + 1).padStart(2, "0")}`;
    const booking = await db.booking.upsert({
      where: { reference },
      create: { reference, userId: user.id, packageId, travelers: 2, travelDate: new Date(`${r.travelled}-10`), subtotal: 0, total: 0, status: "completed" },
      update: {},
    });
    await db.review.upsert({
      where: { bookingId: booking.id },
      create: { userId: user.id, packageId, bookingId: booking.id, rating: r.rating, text: r.text, approved: true, featured: true },
      update: { rating: r.rating, text: r.text },
    });
  }

  console.log("Done.");
}

main()
  .catch((error: unknown) => {
    const name = error instanceof Error ? error.name : "UnknownError";
    const code = error && typeof error === "object" && "code" in error && typeof error.code === "string"
      ? ` (${error.code})`
      : "";
    console.error(`Seeding failed with ${name}${code}. Check the database connection and schema.`);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());

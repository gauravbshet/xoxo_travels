export type Category = {
  slug: string;
  label: string;
  blurb: string;
  href: string;
  tone: "blue" | "coral" | "green" | "yellow";
};

export const categories: Category[] = [
  { slug: "domestic",      label: "Domestic",      blurb: "Goa to Ladakh",       href: "/holidays?region=domestic",      tone: "blue" },
  { slug: "international", label: "International", blurb: "Bali, Dubai, Europe", href: "/holidays?region=international", tone: "green" },
  { slug: "honeymoon",     label: "Honeymoon",     blurb: "Made for two",        href: "/holidays?theme=honeymoon",      tone: "coral" },
  { slug: "adventure",     label: "Adventure",     blurb: "Treks and road trips", href: "/group-trips?style=trek",       tone: "yellow" },
  { slug: "weekend",       label: "Weekend",       blurb: "2–3 day escapes",     href: "/holidays?duration=weekend",     tone: "blue" },
  { slug: "visa",          label: "Visa help",     blurb: "Documents, done",     href: "/visa",                          tone: "green" },
];

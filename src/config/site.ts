export const site = {
  name: "XOXO Travels",
  tagline: "Plan less. Travel more.",
  phone: "+91 98765 43210",
  email: "hello@xoxotravels.in",
  address: "Mangaluru, Karnataka, India",
  social: {
    instagram: "https://instagram.com/",
    facebook: "https://facebook.com/",
    youtube: "https://youtube.com/",
    whatsapp: "https://wa.me/919876543210",
  },
} as const;

export type NavItem = { label: string; href: string; accent?: boolean };

export const mainNav: NavItem[] = [
  { label: "Holidays", href: "/holidays" },
  { label: "Group trips", href: "/group-trips" },
  { label: "Destinations", href: "/destinations" },
  { label: "Offers", href: "/offers" },
  { label: "Find a partner", href: "/partners", accent: true },
];

export const footerNav: { heading: string; items: NavItem[] }[] = [
  {
    heading: "Explore",
    items: [
      { label: "Holiday packages", href: "/holidays" },
      { label: "Group trips", href: "/group-trips" },
      { label: "Destinations", href: "/destinations" },
      { label: "Offers & coupons", href: "/offers" },
      { label: "Find a travel partner", href: "/partners" },
    ],
  },
  {
    heading: "Support",
    items: [
      { label: "Help centre", href: "/support" },
      { label: "Visa assistance", href: "/visa" },
      { label: "Cancellation & refunds", href: "/policies/cancellation" },
      { label: "Contact us", href: "/support" },
    ],
  },
  {
    heading: "Company",
    items: [
      { label: "About XOXO", href: "/about" },
      { label: "Reviews", href: "/reviews" },
      { label: "Privacy policy", href: "/policies/privacy" },
      { label: "Terms of use", href: "/policies/terms" },
    ],
  },
];

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/cn";

const links = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/packages", label: "Packages" },
  { href: "/admin/group-trips", label: "Group trips" },
  { href: "/admin/destinations", label: "Destinations" },
  { href: "/admin/offers", label: "Offers" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/verifications", label: "Verifications" },
  { href: "/admin/reports", label: "Reports" },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto [scrollbar-width:none] lg:flex-col">
      {links.map((l) => {
        const active = l.exact ? path === l.href : path.startsWith(l.href);
        return (
          <Link key={l.href} href={l.href} aria-current={active ? "page" : undefined}
            className={cn("whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold transition-colors duration-fast",
              active ? "bg-sky-600 text-white" : "text-ink-soft hover:bg-cream-deep hover:text-ink")}>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminUser() {
  return <UserButton />;
}

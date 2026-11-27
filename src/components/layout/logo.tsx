import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { site } from "@/config/site";

type LogoProps = {
  className?: string;
  light?: boolean;
  size?: "sm" | "md" | "lg";
};

export function Logo({ className, light, size = "md" }: LogoProps) {
  const heights = {
    sm: "h-9",
    md: "h-12",
    lg: "h-12 sm:h-14 lg:h-16",
  };

  return (
    <Link
      href="/"
      aria-label={`${site.name} home`}
      className={cn("inline-flex shrink-0 items-center rounded-md", className)}
    >
      <Image
        src="/logo.png"
        alt={`${site.name} logo`}
        width={1536}
        height={1024}
        priority
        sizes={size === "lg" ? "(min-width: 1024px) 112px, (min-width: 640px) 96px, 78px" : "(max-width: 640px) 72px, 96px"}
        className={cn(
          "w-auto object-contain drop-shadow-[0_3px_8px_rgb(11_18_32/0.18)]",
          heights[size],
          light ? "brightness-100" : "",
        )}
      />
    </Link>
  );
}

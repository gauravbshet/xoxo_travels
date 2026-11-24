import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "coral" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap select-none " +
  "rounded-pill transition-[background-color,box-shadow,transform] duration-fast ease-out-soft " +
  "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary:
    "bg-sky-600 text-white shadow-float hover:bg-sky-700",
  secondary:
    "bg-ink text-white hover:bg-ink/90",
  coral:
    "bg-coral-600 text-white hover:bg-coral-700",
  outline:
    "border border-line bg-paper text-ink hover:border-sky-500 hover:text-sky-600",
  ghost:
    "text-ink-soft hover:bg-cream-deep hover:text-ink",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-[15px]",
  lg: "h-13 px-7 text-base",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
};

type ButtonProps = CommonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type LinkProps = CommonProps &
  Omit<React.ComponentProps<typeof Link>, "className"> & { href: string };

export function Button(props: ButtonProps | LinkProps) {
  const { variant = "primary", size = "md", className, children, ...rest } = props;
  const classes = cn(base, variants[variant], sizes[size], className);

  if ("href" in rest && typeof rest.href === "string") {
    return (
      <Link className={classes} {...(rest as LinkProps)}>
        {children}
      </Link>
    );
  }
  const { type = "button", ...btn } = rest as ButtonProps;
  return (
    <button type={type} className={classes} {...btn}>
      {children}
    </button>
  );
}

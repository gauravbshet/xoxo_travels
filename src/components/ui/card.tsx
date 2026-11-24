import * as React from "react";
import { cn } from "@/lib/cn";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Lift on hover — use for clickable destination / package cards. */
  interactive?: boolean;
  /** Remove internal padding — for image-led cards. */
  flush?: boolean;
};

export function Card({ interactive, flush, className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg bg-paper border border-line/70 shadow-card overflow-hidden",
        !flush && "p-5",
        interactive &&
          "transition-[transform,box-shadow] duration-base ease-out-soft " +
            "hover:-translate-y-1 hover:shadow-card-hover " +
            "motion-reduce:hover:translate-y-0",
        className,
      )}
      {...rest}
    />
  );
}

/** Image wrapper that zooms its child on parent hover (group). */
export function CardMedia({
  className,
  children,
  ratio = "aspect-[4/3]",
}: {
  className?: string;
  children: React.ReactNode;
  ratio?: string;
}) {
  return (
    <div className={cn("group relative overflow-hidden bg-cream-deep", ratio, className)}>
      <div className="h-full w-full transition-transform duration-500 ease-out-soft group-hover:scale-[1.04] motion-reduce:group-hover:scale-100">
        {children}
      </div>
    </div>
  );
}

export function CardBody({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4 sm:p-5", className)} {...rest} />;
}

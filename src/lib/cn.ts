import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/*
 * Teach tailwind-merge the custom theme tokens from globals.css, so
 * cn("rounded-lg", "rounded-pill") resolves to one class instead of
 * leaving both and letting stylesheet order decide.
 * Keep in sync with @theme in globals.css.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      radius: ["sm", "md", "lg", "xl", "pill"],
      shadow: ["card", "card-hover", "float"],
      ease: ["out-soft"],
    },
    classGroups: {
      duration: [{ duration: ["fast", "base"] }],
    },
  },
});

/** Merge class names; Tailwind conflicts resolve to the last one given. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

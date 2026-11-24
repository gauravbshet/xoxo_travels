import { cacheLife } from "next/cache";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export type MonthOption = { value: string; label: string };

/** Next 12 months as select options. Cached per day so static pages can prerender. */
export async function getMonthOptions(): Promise<MonthOption[]> {
  "use cache";
  cacheLife("days");
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    return {
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
    };
  });
}

import { Counter, Reveal } from "@/components/ui";
import { getTrustStats } from "@/lib/data/reviews";

export async function TrustStats() {
  const stats = await getTrustStats();
  return (
    <section aria-label="XOXO Travels in numbers" className="bg-sky-600 text-white">
      <div className="container-x py-7 sm:py-9">
        <dl className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal as="div" key={s.label} delay={i * 60} className="border-l-2 border-white/30 pl-4">
              <dd className="font-display tabular text-4xl font-extrabold leading-none sm:text-5xl">
                <Counter value={s.value} decimals={s.decimals} suffix={s.suffix} />
              </dd>
              <dt className="mt-2 text-sm font-medium text-white">{s.label}</dt>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  );
}

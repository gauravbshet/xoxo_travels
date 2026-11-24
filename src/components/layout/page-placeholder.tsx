import { Badge, Button } from "@/components/ui";

/* Stand-in for routes that are planned but not built yet. */
export function PagePlaceholder({ title, blurb, step }: { title: string; blurb: string; step: string }) {
  return (
    <div className="container-x py-20 text-center">
      <Badge tone="yellow" className="mb-4">Coming in {step}</Badge>
      <h1 className="text-4xl sm:text-5xl">{title}</h1>
      <p className="mx-auto mt-4 max-w-md text-ink-soft">{blurb}</p>
      <Button href="/" variant="outline" className="mt-8">Back to home</Button>
    </div>
  );
}

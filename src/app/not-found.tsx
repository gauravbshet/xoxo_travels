import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="container-x flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="font-display text-7xl font-extrabold text-sky-500">404</p>
      <h1 className="mt-2 text-3xl">That page took a detour</h1>
      <p className="mt-3 max-w-sm text-ink-soft">The link may be old, or the page has moved. Head back and try again.</p>
      <Button href="/" className="mt-8">Go to home</Button>
    </div>
  );
}

import { Badge, Button } from "@/components/ui";

/* Shown on auth pages until Clerk keys are added to .env. Dev-facing. */
export function AuthSetupNotice() {
  return (
    <div className="max-w-md rounded-lg border border-dashed border-line bg-paper p-8 text-center">
      <Badge tone="yellow">Setup needed</Badge>
      <h1 className="mt-3 text-2xl">Sign-in isn’t connected yet</h1>
      <p className="mt-2 text-ink-soft">
        Add <code className="rounded-sm bg-cream-deep px-1.5 py-0.5 font-mono text-xs">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> and{" "}
        <code className="rounded-sm bg-cream-deep px-1.5 py-0.5 font-mono text-xs">CLERK_SECRET_KEY</code> to <code className="font-mono text-xs">.env.local</code>, then restart the dev server.
      </p>
      <Button href="/" variant="outline" className="mt-6">Back to home</Button>
    </div>
  );
}

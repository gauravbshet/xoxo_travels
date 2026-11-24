import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader, Skeleton } from "@/components/ui";
import { PagePlaceholder } from "@/components/layout/page-placeholder";
import { Avatar } from "@/components/partners/person";
import { clerkEnabled } from "@/lib/auth/config";
import { getCurrentUser } from "@/lib/auth/current-user";
import { conversationsFor } from "@/lib/chat";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Messages", robots: { index: false } };

export default function ChatListPage() {
  if (!clerkEnabled) return <PagePlaceholder title="Messages" blurb="Add your Clerk keys to sign in." step="setup" />;
  return (
    <div className="container-x mx-auto max-w-3xl py-10 sm:py-14">
      <PageHeader eyebrow="Find a partner" title="Messages" blurb="Chats open once a partner request is accepted." />
      <Suspense fallback={<Skeleton className="h-64 rounded-xl" />}><List /></Suspense>
    </div>
  );
}

async function List() {
  const user = await getCurrentUser();
  if (!user) return <p className="text-ink-soft">Sign in to see your messages.</p>;
  const rows = await conversationsFor(user.id);
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-paper p-10 text-center">
        <p className="font-semibold text-ink">No chats yet</p>
        <p className="mt-1 text-sm text-ink-soft">Find someone heading your way and send a request.</p>
        <Link href="/partners" className="mt-4 inline-block font-semibold text-sky-600 hover:underline">Find a partner</Link>
      </div>
    );
  }
  return (
    <ul className="divide-y divide-line/70 overflow-hidden rounded-xl border border-line/70 bg-paper shadow-card">
      {rows.map((r) => (
        <li key={r.id}>
          <Link href={`/chat/${r.id}`} className="flex items-center gap-3 p-4 hover:bg-cream/60">
            <Avatar url={r.other.photoUrl} name={r.other.name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="flex items-center justify-between gap-2">
                <span className={`truncate ${r.unread ? "font-bold text-ink" : "font-semibold text-ink"}`}>{r.other.name}</span>
                {r.lastAt && <span className="shrink-0 text-xs text-ink-mute">{formatDate(r.lastAt)}</span>}
              </p>
              <p className={`truncate text-sm ${r.unread ? "font-semibold text-ink" : "text-ink-soft"}`}>{r.closed ? "Chat closed" : r.preview || "Say hello"}</p>
            </div>
            {r.unread > 0 && <span className="grid min-w-6 place-items-center rounded-pill bg-coral-600 px-1.5 text-xs font-bold text-white" aria-label={`${r.unread} unread`}>{r.unread}</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}

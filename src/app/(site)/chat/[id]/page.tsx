import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EmptyState, Skeleton } from "@/components/ui";
import { ChatRoom } from "@/components/chat/chat-room";
import { Avatar, PersonLine } from "@/components/partners/person";
import { SafetyMenu } from "@/components/partners/partner-buttons";
import { getCurrentUser } from "@/lib/auth/current-user";
import { conversationFor, recentMessages } from "@/lib/chat";

export const metadata: Metadata = { title: "Chat", robots: { index: false } };

export default function ChatPage({ params }: PageProps<"/chat/[id]">) {
  return (
    <div className="container-x mx-auto max-w-3xl py-6 sm:py-8">
      <Suspense fallback={<Skeleton className="h-[32rem] rounded-xl" />}><Room params={params} /></Suspense>
    </div>
  );
}

async function Room({ params }: { params: PageProps<"/chat/[id]">["params"] }) {
  const [{ id }, user] = await Promise.all([params, getCurrentUser()]);
  const c = user ? await conversationFor(user.id, id) : null;
  if (!user || !c) return <EmptyState title="Chat not found" blurb="It may have closed, or the link is wrong." action={{ label: "All messages", href: "/chat" }} />;
  const { messages, more } = await recentMessages(c.id);
  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/chat" className="text-sm font-semibold text-sky-600 hover:underline" aria-label="All messages">←</Link>
          <Avatar url={c.other.photoUrl} name={c.other.name} size="sm" />
          <PersonLine name={c.other.name} age={c.other.age} city={c.other.city} verified={c.other.verified} />
        </div>
        {!c.closed && <SafetyMenu userId={c.other.userId} name={c.other.name} onBlocked="/chat" />}
      </div>
      <ChatRoom conversationId={c.id} viewerId={user.id} otherName={c.other.name} initial={messages} more={more} closed={c.closed} />
      <p className="mt-3 text-center text-xs text-ink-mute">Meet in public places and tell someone your plans. Report anything that feels off.</p>
    </>
  );
}

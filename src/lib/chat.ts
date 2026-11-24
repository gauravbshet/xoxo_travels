import "server-only";
import { db } from "@/lib/db";
import { areBlocked, personCard, personSelect, type PersonCard } from "@/lib/partners";
import { privateViewUrl } from "@/lib/storage";
import { chat as rules } from "@/config/partners";

export type MessageView = { id: string; senderId: string; kind: "text" | "image" | "system"; body: string | null; imageUrl: string | null; createdAt: string };

export async function toMessageView(m: { id: string; senderId: string; kind: "text" | "image" | "system"; body: string | null; imageKey: string | null; createdAt: Date }): Promise<MessageView> {
  return {
    id: m.id, senderId: m.senderId, kind: m.kind, body: m.body,
    // Chat photos live in the private bucket; each view gets a short-lived link.
    imageUrl: m.imageKey ? await privateViewUrl(m.imageKey, rules.imageUrlTtl) : null,
    createdAt: m.createdAt.toISOString(),
  };
}

/** The conversation if this user is in it, with the other person and whether it's closed by a block. */
export async function conversationFor(userId: string, conversationId: string) {
  if (!db) return null;
  const c = await db.conversation.findFirst({
    where: { id: conversationId, participants: { some: { userId } } },
    include: { participants: { include: { user: { select: personSelect } } } },
  });
  if (!c) return null;
  const other = c.participants.find((p) => p.userId !== userId);
  if (!other) return null;
  return { id: c.id, other: personCard(other.user), closed: await areBlocked(userId, other.userId) };
}

export async function recentMessages(conversationId: string): Promise<{ messages: MessageView[]; more: boolean }> {
  if (!db) return { messages: [], more: false };
  const rows = await db.message.findMany({ where: { conversationId }, orderBy: { createdAt: "desc" }, take: rules.pageSize + 1 });
  const more = rows.length > rules.pageSize;
  return { messages: await Promise.all(rows.slice(0, rules.pageSize).reverse().map(toMessageView)), more };
}

export type ConversationRow = { id: string; other: PersonCard; preview: string; lastAt: string | null; unread: number; closed: boolean };

export async function conversationsFor(userId: string): Promise<ConversationRow[]> {
  if (!db) return [];
  const mine = await db.participant.findMany({
    where: { userId },
    include: {
      conversation: {
        include: {
          participants: { where: { userId: { not: userId } }, include: { user: { select: personSelect } } },
          messages: { orderBy: { createdAt: "desc" }, take: 1, select: { kind: true, body: true, senderId: true } },
        },
      },
    },
  });
  const blocks = await db.block.findMany({ where: { OR: [{ blockerId: userId }, { blockedId: userId }] }, select: { blockerId: true, blockedId: true } });
  const blockedSet = new Set(blocks.map((b) => (b.blockerId === userId ? b.blockedId : b.blockerId)));

  const rows = await Promise.all(mine.map(async (p) => {
    const c = p.conversation;
    const other = c.participants[0];
    if (!other) return null;
    const last = c.messages[0];
    const unread = await db!.message.count({ where: { conversationId: c.id, senderId: { not: userId }, kind: { not: "system" }, ...(p.lastReadAt && { createdAt: { gt: p.lastReadAt } }) } });
    const preview = !last ? "" : last.kind === "image" ? "Photo" : `${last.senderId === userId && last.kind !== "system" ? "You: " : ""}${last.body ?? ""}`;
    return { id: c.id, other: personCard(other.user), preview, lastAt: c.lastMessageAt?.toISOString() ?? null, unread, closed: blockedSet.has(other.userId) };
  }));
  return rows.filter((r): r is ConversationRow => r !== null).sort((a, b) => (b.lastAt ?? "").localeCompare(a.lastAt ?? ""));
}

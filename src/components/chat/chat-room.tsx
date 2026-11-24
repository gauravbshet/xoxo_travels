"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui";
import { chat as rules } from "@/config/partners";
import { uploads } from "@/config/profile";
import { connectChat, markRead, requestChatImage, sendMessage } from "@/app/(site)/chat/actions";

type Msg = { id: string; senderId: string; kind: "text" | "image" | "system"; body: string | null; imageUrl: string | null; createdAt: string };

const time = (iso: string) => new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
const day = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

/** Parses an event from Ably (raw or enveloped) or the local dev stream. */
function parseEvent(raw: string): { type: string; message?: Msg } | null {
  try {
    let v = JSON.parse(raw);
    if (v && typeof v.data === "string" && !v.type) v = JSON.parse(v.data);
    return v && typeof v.type === "string" ? v : null;
  } catch { return null; }
}

export function ChatRoom({ conversationId, viewerId, otherName, initial, more, closed: initialClosed }: {
  conversationId: string; viewerId: string; otherName: string; initial: Msg[]; more: boolean; closed: boolean;
}) {
  const [messages, setMessages] = React.useState<Msg[]>(initial);
  const [closed, setClosed] = React.useState(initialClosed);
  const [text, setText] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [live, setLive] = React.useState<"connecting" | "on" | "off">("connecting");
  const [liveMsg, setLiveMsg] = React.useState("");
  const listRef = React.useRef<HTMLOListElement>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const add = React.useCallback((m: Msg) => setMessages((ms) => (ms.some((x) => x.id === m.id) ? ms : [...ms, m])), []);

  // Live updates: EventSource to Ably (or the dev stream). Reconnects with a fresh token.
  React.useEffect(() => {
    if (closed) return;
    let es: EventSource | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;
    const open = async () => {
      const r = await connectChat(conversationId);
      if (stopped) return;
      if (!r.ok) { setLive("off"); setLiveMsg(r.message); return; }
      es = new EventSource(r.url);
      es.onopen = () => { setLive("on"); setLiveMsg(""); };
      es.onmessage = (e) => {
        const ev = parseEvent(e.data);
        if (ev?.type === "message" && ev.message) { add(ev.message); if (ev.message.senderId !== viewerId) void markRead(conversationId); }
        if (ev?.type === "closed") setClosed(true);
      };
      es.onerror = () => {
        if (es?.readyState === EventSource.CLOSED) { setLive("connecting"); es.close(); timer = setTimeout(open, 5000); }
      };
    };
    void open();
    return () => { stopped = true; clearTimeout(timer); es?.close(); };
  }, [conversationId, viewerId, closed, add]);

  React.useEffect(() => { listRef.current?.lastElementChild?.scrollIntoView({ block: "end" }); }, [messages.length]);
  React.useEffect(() => { void markRead(conversationId); }, [conversationId]);

  const send = async (payload: { body?: string; imageKey?: string }) => {
    setBusy(true); setErr("");
    const r = await sendMessage({ conversationId, ...payload });
    setBusy(false);
    if (r.ok) { add(r.message); if (payload.body) setText(""); } else setErr(r.message);
  };

  const onSubmit = (e: React.FormEvent) => { e.preventDefault(); if (text.trim()) void send({ body: text.trim() }); };

  const onPhoto = async (file: File | undefined) => {
    if (!file) return;
    setErr("");
    if (!(uploads.photo.types as readonly string[]).includes(file.type)) return setErr("Use a JPG, PNG or WebP photo.");
    if (file.size > uploads.photo.maxBytes) return setErr("Photos must be 5 MB or smaller.");
    setBusy(true);
    const t = await requestChatImage({ conversationId, contentType: file.type, size: file.size });
    if (!t.ok) { setBusy(false); return setErr(t.message); }
    const put = await fetch(t.url, { method: t.method, headers: t.headers, body: file }).catch(() => null);
    if (fileRef.current) fileRef.current.value = "";
    if (!put?.ok) { setBusy(false); return setErr("Photo upload failed. Try again."); }
    await send({ imageKey: t.key });
  };

  return (
    <div className="flex h-[calc(100dvh-12rem)] min-h-[28rem] flex-col overflow-hidden rounded-xl border border-line/70 bg-paper shadow-card">
      <ol ref={listRef} className="flex-1 space-y-2 overflow-y-auto p-4" aria-live="polite" aria-label={`Messages with ${otherName}`}>
        {more && <li className="text-center text-xs text-ink-mute">Showing the latest {rules.pageSize} messages.</li>}
        {messages.map((m, i) => {
          const newDay = i === 0 || day(messages[i - 1].createdAt) !== day(m.createdAt);
          const mine = m.senderId === viewerId && m.kind !== "system";
          return (
            <React.Fragment key={m.id}>
              {newDay && <li className="py-2 text-center text-xs font-semibold text-ink-mute">{day(m.createdAt)}</li>}
              {m.kind === "system" ? (
                <li className="py-1 text-center text-sm text-ink-soft">{m.body}</li>
              ) : (
                <li className={cn("flex", mine ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[80%] rounded-2xl px-3.5 py-2 text-[15px]", mine ? "rounded-br-sm bg-sky-600 text-white" : "rounded-bl-sm bg-cream-deep text-ink")}>
                    {m.imageUrl && (
                      <a href={m.imageUrl} target="_blank" rel="noreferrer noopener" className="block">
                        {/* eslint-disable-next-line @next/next/no-img-element -- private chat photo via short-lived signed link */}
                        <img src={m.imageUrl} alt={mine ? "Photo you sent" : `Photo from ${otherName}`} className="max-h-72 rounded-lg object-cover" />
                      </a>
                    )}
                    {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                    <p className={cn("mt-0.5 text-right text-[11px]", mine ? "text-white/80" : "text-ink-mute")}>{time(m.createdAt)}</p>
                  </div>
                </li>
              )}
            </React.Fragment>
          );
        })}
      </ol>

      {closed ? (
        <p className="border-t border-line/70 bg-cream/60 p-4 text-center text-sm font-semibold text-ink-soft">This chat is closed.</p>
      ) : (
        <form onSubmit={onSubmit} className="border-t border-line/70 p-3">
          {(err || live === "off") && <p role="alert" className="mb-2 text-sm font-semibold text-coral-700">{err || liveMsg}</p>}
          <div className="flex items-end gap-2">
            <input ref={fileRef} id="chat-photo" type="file" accept={uploads.photo.types.join(",")} className="sr-only" onChange={(e) => onPhoto(e.target.files?.[0])} />
            <Button type="button" variant="outline" size="sm" className="h-11 shrink-0" onClick={() => fileRef.current?.click()} disabled={busy} aria-label="Send a photo">Photo</Button>
            <label htmlFor="chat-text" className="sr-only">Message</label>
            <textarea id="chat-text" rows={1} maxLength={rules.messageMax} value={text} onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (text.trim()) void send({ body: text.trim() }); } }}
              placeholder={`Message ${otherName}`}
              className="max-h-32 min-h-11 flex-1 resize-none rounded-md border border-line bg-paper px-3.5 py-2.5 text-[15px] focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100" />
            <Button type="submit" className="h-11 shrink-0" disabled={busy || !text.trim()}>Send</Button>
          </div>
          <p className="mt-1 text-[11px] text-ink-mute">{live === "on" ? "Live" : live === "connecting" ? "Connecting…" : "Live updates off"}</p>
        </form>
      )}
    </div>
  );
}

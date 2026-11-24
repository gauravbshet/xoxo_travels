import { localBus, realtimeMode, verifyLocalStream, type RealtimeEvent } from "@/lib/realtime";

/* Development stand-in for Ably's SSE endpoint. Works with a single `next dev` process. */
export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production" || realtimeMode() !== "local") return new Response(null, { status: 404 });
  const q = new URL(req.url).searchParams;
  const channel = q.get("channel") ?? "", exp = q.get("exp") ?? "", sig = q.get("sig") ?? "";
  if (!channel.startsWith("chat:") || !verifyLocalStream(channel, exp, sig)) return new Response("Forbidden", { status: 403 });

  const enc = new TextEncoder();
  let cleanup = () => {};
  const stream = new ReadableStream({
    start(controller) {
      const send = (e: RealtimeEvent) => controller.enqueue(enc.encode(`data: ${JSON.stringify(e)}\n\n`));
      const ping = setInterval(() => controller.enqueue(enc.encode(": ping\n\n")), 25_000);
      localBus.on(channel, send);
      controller.enqueue(enc.encode(": connected\n\n"));
      cleanup = () => { clearInterval(ping); localBus.off(channel, send); };
      req.signal.addEventListener("abort", () => { cleanup(); try { controller.close(); } catch {} });
    },
    cancel() { cleanup(); },
  });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" } });
}

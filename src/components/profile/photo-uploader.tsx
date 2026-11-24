"use client";

import * as React from "react";
import { Button } from "@/components/ui";
import { uploads } from "@/config/profile";
import { confirmPhoto, removePhoto } from "@/app/(site)/(clerk)/account/profile/actions";
import { uploadFile } from "./upload";

export function PhotoUploader({ initialUrl, name }: { initialUrl: string | null; name: string }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [url, setUrl] = React.useState(initialUrl);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState("");
  const maxMb = Math.round(uploads.photo.maxBytes / 1024 / 1024);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setMsg("");
    if (!(uploads.photo.types as readonly string[]).includes(file.type)) return setMsg("Use a JPG, PNG or WebP photo.");
    if (file.size > uploads.photo.maxBytes) return setMsg(`The photo must be ${maxMb} MB or smaller.`);
    setBusy(true);
    const up = await uploadFile("photo", file);
    const done = up.ok ? await confirmPhoto(up.key) : up;
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
    if (done.ok) setUrl(done.url); else setMsg(done.message);
  };

  const onRemove = async () => {
    setBusy(true);
    const r = await removePhoto();
    setBusy(false);
    if (r.ok) setUrl(null); else setMsg(r.message);
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative size-20 shrink-0 overflow-hidden rounded-pill bg-sky-100">
        {url
          // eslint-disable-next-line @next/next/no-img-element -- user uploads come from storage, not a configured image host
          ? <img src={url} alt={`Profile photo of ${name || "you"}`} className="size-full object-cover" />
          : <span className="grid size-full place-items-center font-display text-2xl font-bold text-sky-700" aria-hidden="true">{(name || "?").slice(0, 1).toUpperCase()}</span>}
      </div>
      <div>
        <input ref={inputRef} type="file" accept={uploads.photo.types.join(",")} className="sr-only" id="photo-input" onChange={(e) => onFile(e.target.files?.[0])} disabled={busy} />
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={() => inputRef.current?.click()} disabled={busy}>{busy ? "Uploading..." : url ? "Change photo" : "Add photo"}</Button>
          {url && <Button type="button" size="sm" variant="outline" onClick={onRemove} disabled={busy}>Remove</Button>}
        </div>
        <p className="mt-1.5 text-xs text-ink-mute">JPG, PNG or WebP, up to {maxMb} MB. A clear photo of your face.</p>
        {msg && <p role="alert" className="mt-1 text-sm font-semibold text-coral-700">{msg}</p>}
      </div>
    </div>
  );
}

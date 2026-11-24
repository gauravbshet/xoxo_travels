"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Field, Select, VerifiedBadge } from "@/components/ui";
import { idDocumentTypes, uploads } from "@/config/profile";
import { submitVerification } from "@/app/(site)/(clerk)/account/profile/actions";
import { uploadFile } from "./upload";

type Status = { verified: boolean; latest: { status: "pending" | "approved" | "rejected"; note: string | null } | null };

export function VerificationCard({ verified, latest }: Status) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [docType, setDocType] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState("");
  const maxMb = Math.round(uploads.id.maxBytes / 1024 / 1024);

  if (verified) {
    return <div className="flex items-center gap-3"><VerifiedBadge /><p className="text-sm text-ink-soft">Your ID is verified. We deleted the file after review.</p></div>;
  }
  if (latest?.status === "pending") {
    return <div className="flex items-center gap-3"><Badge tone="yellow">Under review</Badge><p className="text-sm text-ink-soft">We&apos;re checking your ID, usually within a day.</p></div>;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    if (!docType) return setMsg("Choose the ID type.");
    if (!file) return setMsg("Choose a photo or PDF of your ID.");
    if (!(uploads.id.types as readonly string[]).includes(file.type)) return setMsg("Use a JPG, PNG, WebP or PDF file.");
    if (file.size > uploads.id.maxBytes) return setMsg(`The file must be ${maxMb} MB or smaller.`);
    setBusy(true);
    const up = await uploadFile("id", file);
    const done = up.ok ? await submitVerification({ key: up.key, documentType: docType }) : up;
    setBusy(false);
    if (done.ok) router.refresh(); else setMsg(done.message);
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {latest?.status === "rejected" && (
        <div className="rounded-lg bg-coral-50 p-3 text-sm text-coral-700">
          <p className="font-semibold">We couldn&apos;t verify your last upload.</p>
          {latest.note && <p className="mt-0.5">{latest.note}</p>}
          <p className="mt-0.5">Upload a clear photo and try again.</p>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="ID type" htmlFor="id-type">
          <Select id="id-type" value={docType} onChange={(e) => setDocType(e.target.value)}>
            <option value="">Choose one</option>
            {idDocumentTypes.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </Select>
        </Field>
        <Field label="File" htmlFor="id-file" hint={`JPG, PNG, WebP or PDF, up to ${maxMb} MB.`}>
          <input ref={inputRef} id="id-file" type="file" accept={uploads.id.types.join(",")} onChange={(e) => { setFile(e.target.files?.[0] ?? null); setMsg(""); }}
            className="block w-full text-sm text-ink-soft file:mr-3 file:rounded-pill file:border-0 file:bg-cream-deep file:px-3.5 file:py-2 file:text-sm file:font-semibold file:text-ink hover:file:bg-sky-50" />
        </Field>
      </div>
      <p className="text-xs text-ink-mute">Your ID is stored privately, seen only by our review team, and deleted as soon as it&apos;s reviewed.</p>
      {msg && <p role="alert" className="text-sm font-semibold text-coral-700">{msg}</p>}
      <Button type="submit" disabled={busy}>{busy ? "Uploading..." : "Submit for verification"}</Button>
    </form>
  );
}

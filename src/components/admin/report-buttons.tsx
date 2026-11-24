"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { resolveReport } from "@/app/admin/reports/actions";

export function ReportButtons({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [msg, setMsg] = React.useState("");
  const go = (hideUser: boolean) => start(async () => {
    if (hideUser && !window.confirm(`Hide ${name} from Find a Partner and resolve this report?`)) return;
    const r = await resolveReport({ id, hideUser });
    if (r.ok) router.refresh(); else setMsg(r.message);
  });
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => go(false)} disabled={pending}>Resolve</Button>
        <Button size="sm" variant="outline" className="text-coral-700" onClick={() => go(true)} disabled={pending}>Hide user and resolve</Button>
      </div>
      {msg && <p role="alert" className="mt-1 text-sm font-semibold text-coral-700">{msg}</p>}
    </div>
  );
}

"use client";

import * as React from "react";

/* Compare tray state: up to 3 package slugs, persisted per browser. */
const KEY = "xoxo:compare";
export const COMPARE_MAX = 3;

let slugs: string[] = [];
const listeners = new Set<() => void>();

function read(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}
function write(next: string[]) {
  slugs = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  if (listeners.size === 0) slugs = read();
  listeners.add(l);
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) { slugs = read(); l(); } };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(l); window.removeEventListener("storage", onStorage); };
}
const EMPTY: string[] = [];

export function useCompare() {
  const list = React.useSyncExternalStore(subscribe, () => slugs, () => EMPTY);
  return {
    list,
    has: (slug: string) => list.includes(slug),
    full: list.length >= COMPARE_MAX,
    toggle: (slug: string) => write(list.includes(slug) ? list.filter((s) => s !== slug) : list.length >= COMPARE_MAX ? list : [...list, slug]),
    remove: (slug: string) => write(list.filter((s) => s !== slug)),
    clear: () => write([]),
  };
}

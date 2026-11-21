"use client";

import { useEffect } from "react";

/** Sets the browser tab title for client-rendered screens. */
export function DocTitle({ title }: { title: string }) {
  useEffect(() => {
    document.title = `${title} · Kompas Rodzica`;
  }, [title]);
  return null;
}

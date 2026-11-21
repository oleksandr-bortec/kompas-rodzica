"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Compass, Lock, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Panel, ToneBox } from "@/components/kr/ui";
import { getParams, PARAM_VERSIONS } from "@/lib/engine/params";

type Flat = { path: string; value: number | string | null };

function flatten(obj: Record<string, unknown>, prefix = ""): Flat[] {
  return Object.entries(obj).flatMap(([k, v]) => {
    if (k.startsWith("$") || k === "version" || k === "effectiveFrom") return [];
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object") return flatten(v as Record<string, unknown>, path);
    return [{ path, value: v as Flat["value"] }];
  });
}

/**
 * Ekran 14 — Panel administracyjny. Skeleton: login gate + parameter table.
 * TODO: real auth via ADMIN_PASSWORD (server) and PUT /api/params saving a new version.
 */
export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pwd, setPwd] = useState("");
  const current = getParams();
  const rows = useMemo(() => flatten(current as unknown as Record<string, unknown>), [current]);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [from, setFrom] = useState("");
  const [saved, setSaved] = useState(false);

  if (!authed) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4">
        <Panel>
          <div className="mb-4 flex items-center gap-2">
            <Lock className="size-5 text-kr-primary" aria-hidden />
            <h1 className="kr-h2">Panel administracyjny</h1>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (pwd.length > 0) setAuthed(true); // TODO: verify on server
            }}
            className="grid gap-3"
          >
            <Label htmlFor="pwd">Hasło</Label>
            <Input id="pwd" type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} className="h-12" />
            <Button type="submit" className="h-12 rounded-xl">Zaloguj</Button>
          </form>
        </Panel>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-heading font-extrabold text-kr-primary-dark">
          <Compass className="size-5" aria-hidden /> Kompas Rodzica · Admin
        </Link>
      </div>
      <h1 className="kr-h1">Parametry silnika reguł</h1>
      <p className="mt-1 text-kr-text-2">
        Obowiązuje wersja <b>{current.version}</b> od {current.effectiveFrom}. Wersji w historii: {PARAM_VERSIONS.length}.
      </p>

      <Panel className="mt-6 overflow-x-auto p-0 sm:p-0">
        <table className="w-full text-left kr-small">
          <thead className="border-b border-kr-border bg-muted/60 text-kr-text-2">
            <tr>
              <th className="px-4 py-3 font-semibold">Parametr</th>
              <th className="px-4 py-3 font-semibold">Obecna wartość</th>
              <th className="px-4 py-3 font-semibold">Nowa wartość</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-kr-border">
            {rows.map((r) => (
              <tr key={r.path}>
                <td className="px-4 py-2 font-mono text-xs">{r.path}</td>
                <td className="px-4 py-2 tabular">{r.value === null ? <span className="text-kr-warning">brak (TODO ZUS)</span> : String(r.value)}</td>
                <td className="px-4 py-2">
                  <Input
                    value={edits[r.path] ?? ""}
                    onChange={(e) => setEdits({ ...edits, [r.path]: e.target.value })}
                    placeholder="—"
                    className="h-9 w-32"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <div className="grid gap-1">
          <Label htmlFor="from">Data wejścia w życie</Label>
          <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-11" />
        </div>
        <Button className="h-11 rounded-xl" disabled={!from || Object.keys(edits).length === 0} onClick={() => setSaved(true)}>
          <Save aria-hidden /> Zapisz nową wersję
        </Button>
      </div>
      {saved && (
        <ToneBox tone="info" title="Zapis wersji — w budowie" className="mt-4">
          Zapis przez REST API (/api/params) dodamy w kolejnym kroku.
        </ToneBox>
      )}
    </main>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Compass, History, Lock, RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DocTitle } from "@/components/kr/doc-title";
import { Panel, ToneBox } from "@/components/kr/ui";
import { allParamVersions, getParams, PARAM_VERSIONS, type Params } from "@/lib/engine/params";
import { clearRuntimeParams, loadRuntimeParams, saveRuntimeVersion, withEdits } from "@/lib/engine/params/runtime";
import { formatDate } from "@/lib/format";

type Flat = { path: string; value: number | string | null };

function flatten(obj: Record<string, unknown>, prefix = ""): Flat[] {
  return Object.entries(obj).flatMap(([k, v]) => {
    if (k.startsWith("$") || k === "version" || k === "effectiveFrom") return [];
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object") return flatten(v as Record<string, unknown>, path);
    return [{ path, value: v as Flat["value"] }];
  });
}

const today = () => new Date().toISOString().slice(0, 10);

/** 1 zmiana, 2–4 zmiany, 5+ zmian (Polish plural). */
function changesPl(n: number) {
  const last = n % 10, last2 = n % 100;
  if (n === 1) return "1 zmiana";
  return `${n} ${last >= 2 && last <= 4 && (last2 < 12 || last2 > 14) ? "zmiany" : "zmian"}`;
}

/**
 * Ekran 14 — Panel administracyjny: login (ADMIN_PASSWORD, /api/admin/login), parameter table,
 * saving a new version with an effective date → every plan recalculates from that date.
 * Demo: new versions are stored in this browser. Production: database behind PUT /api/params
 * (Vercel's file system is read-only), with an audit log.
 */
export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pwd, setPwd] = useState("");
  const [versions, setVersions] = useState<Params[]>(PARAM_VERSIONS);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [from, setFrom] = useState("");
  const [status, setStatus] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    loadRuntimeParams();
    setVersions(allParamVersions());
    fetch("/api/admin/login")
      .then((r) => r.json())
      .then((d: { authed?: boolean }) => d.authed && setAuthed(true))
      .catch(() => {});
  }, []);

  const current = useMemo(() => {
    const valid = versions.filter((v) => v.effectiveFrom <= today());
    return valid[valid.length - 1] ?? versions[0];
  }, [versions]);
  const rows = useMemo(() => flatten(current as unknown as Record<string, unknown>), [current]);
  const shippedDates = new Set(PARAM_VERSIONS.map((v) => v.effectiveFrom));
  const hasAdminVersions = versions.some((v) => !shippedDates.has(v.effectiveFrom) || v.version.startsWith("admin-"));

  function save() {
    setStatus(null);
    const parsed: Record<string, number> = {};
    for (const [path, raw] of Object.entries(edits)) {
      if (raw.trim() === "") continue;
      const value = Number(raw.replace(",", "."));
      if (!Number.isFinite(value) || value < 0) {
        setStatus({ tone: "danger", text: `Nieprawidłowa wartość dla ${path}: „${raw}”.` });
        return;
      }
      parsed[path] = value;
    }
    if (Object.keys(parsed).length === 0) {
      setStatus({ tone: "danger", text: "Wpisz co najmniej jedną nową wartość." });
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from)) {
      setStatus({ tone: "danger", text: "Podaj datę wejścia w życie." });
      return;
    }
    const next = saveRuntimeVersion(withEdits(getParams(from), parsed, from));
    setVersions(next);
    setEdits({});
    setStatus({
      tone: "success",
      text: `Zapisano wersję od ${formatDate(from)} (${changesPl(Object.keys(parsed).length)}). Plany ze zdarzeniem od tej daty przeliczą się automatycznie.`,
    });
  }

  if (!authed) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4">
        <DocTitle title="Panel administracyjny" />
        <Panel>
          <div className="mb-4 flex items-center gap-2">
            <Lock className="size-5 text-kr-primary" aria-hidden />
            <h1 className="kr-h2">Panel administracyjny</h1>
          </div>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setLoginError(null);
              const res = await fetch("/api/admin/login", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ password: pwd }),
              });
              if (res.ok) setAuthed(true);
              else {
                const d = (await res.json().catch(() => ({}))) as { error?: string };
                setLoginError(d.error ?? "Nieprawidłowe hasło");
              }
            }}
            className="grid gap-3"
          >
            <Label htmlFor="pwd">Hasło</Label>
            <Input id="pwd" type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} className="h-12" autoComplete="current-password" />
            {loginError && <p className="kr-small text-kr-danger" role="alert">{loginError}</p>}
            <Button type="submit" className="h-12 rounded-xl">Zaloguj</Button>
          </form>
        </Panel>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <DocTitle title="Panel administracyjny" />
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-heading font-extrabold text-kr-primary-dark">
          <Compass className="size-5" aria-hidden /> Kompas Rodzica · Admin
        </Link>
        <Link href="/plan" className="kr-small font-medium text-kr-primary hover:underline">Zobacz plan →</Link>
      </div>
      <h1 className="kr-h1">Parametry silnika reguł</h1>
      <p className="mt-1 text-kr-text-2">
        Dziś obowiązuje wersja <b>{current.version}</b> (od {formatDate(current.effectiveFrom)}). Zmiana przepisów = nowa wersja z datą wejścia w życie — bez programisty.
      </p>

      <Panel className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <History className="size-4 text-kr-text-2" aria-hidden />
          <h2 className="kr-card-title">Historia wersji</h2>
        </div>
        <ul className="divide-y divide-kr-border">
          {versions.map((v) => (
            <li key={v.effectiveFrom} className="flex flex-wrap items-center justify-between gap-2 py-2 kr-small">
              <span>
                od <b className="tabular">{formatDate(v.effectiveFrom)}</b> · <span className="font-mono text-xs">{v.version}</span>
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 kr-caption">
                {v.version.startsWith("admin-") ? "zapisana w panelu (ta przeglądarka)" : "w kodzie (przegląd w PR)"}
              </span>
            </li>
          ))}
        </ul>
        {hasAdminVersions && (
          <Button
            variant="outline"
            size="sm"
            className="mt-3 rounded-xl"
            onClick={() => {
              setVersions(clearRuntimeParams());
              setStatus({ tone: "success", text: "Usunięto wersje zapisane w panelu — obowiązują parametry z kodu." });
            }}
          >
            <RotateCcw aria-hidden /> Przywróć parametry z kodu
          </Button>
        )}
      </Panel>

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
                <td className="px-4 py-2 tabular">{r.value === null ? <span className="text-kr-warning">brak</span> : String(r.value)}</td>
                <td className="px-4 py-2">
                  {typeof r.value === "number" ? (
                    <Input
                      value={edits[r.path] ?? ""}
                      onChange={(e) => setEdits({ ...edits, [r.path]: e.target.value })}
                      placeholder="—"
                      inputMode="decimal"
                      className="h-9 w-32"
                      aria-label={`Nowa wartość: ${r.path}`}
                    />
                  ) : (
                    <span className="kr-caption font-normal text-kr-text-2">—</span>
                  )}
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
        <Button className="h-11 rounded-xl" onClick={save}>
          <Save aria-hidden /> Zapisz nową wersję
        </Button>
      </div>
      {status && <ToneBox tone={status.tone} title={status.text} className="mt-4" />}
      <p className="mt-4 kr-small text-kr-text-2">
        Demo: nowe wersje zapisują się w tej przeglądarce. W produkcji — baza danych za REST API (PUT /api/params) z dziennikiem zmian i rolami.
      </p>
    </main>
  );
}

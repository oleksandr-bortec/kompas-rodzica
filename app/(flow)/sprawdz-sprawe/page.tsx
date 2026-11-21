"use client";

import { useMemo, useRef, useState } from "react";
import { BookOpen, FileText, Loader2, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FlowShell } from "@/components/kr/flow-shell";
import { Panel, SourceTag, ToneBox } from "@/components/kr/ui";
import { buildPlan } from "@/lib/engine";
import type { CaseExtraction, ExtractedField } from "@/lib/ai/case-schema";
import { caseToPlanInput, compareWithDecision } from "@/lib/ai/to-plan-input";
import { SAMPLE_CASES } from "@/lib/mocks/sample-cases";
import { formatPLN } from "@/lib/format";
import { cn } from "@/lib/utils";

type Step = "pick" | "reading" | "confirm" | "result";

type FieldKey =
  | "event.type" | "event.date" | "insurance.title" | "insurance.from" | "insurance.to" | "insurance.sickness"
  | "payerOver20Insured" | "applicationDate" | "leave.fullLeaveRequested" | "contributionDebt" | "zusDecision.outcome";

const FIELDS: { key: FieldKey; label: string; kind: "date" | "number" | "select"; options?: [string, string][] }[] = [
  { key: "event.type", label: "Zdarzenie", kind: "select", options: [["porod", "Poród"], ["adopcja", "Adopcja"], ["rodzina_zastepcza", "Rodzina zastępcza"], ["martwe_urodzenie", "Martwe urodzenie"], ["inne", "Inne"]] },
  { key: "event.date", label: "Data porodu / przyjęcia dziecka", kind: "date" },
  { key: "insurance.title", label: "Tytuł ubezpieczenia", kind: "select", options: [["umowa_o_prace", "Umowa o pracę"], ["umowa_zlecenie", "Umowa zlecenie"], ["jdg", "Działalność gospodarcza"], ["osoba_wspolpracujaca", "Osoba współpracująca"], ["brak", "Brak"], ["inne", "Inne"]] },
  { key: "insurance.from", label: "Ubezpieczenie od", kind: "date" },
  { key: "insurance.to", label: "Ubezpieczenie do (puste = trwa)", kind: "date" },
  { key: "insurance.sickness", label: "Ubezpieczenie chorobowe", kind: "select", options: [["obowiazkowe", "Obowiązkowe"], ["dobrowolne", "Dobrowolne"], ["brak", "Brak"]] },
  { key: "payerOver20Insured", label: "Płatnik: powyżej 20 ubezpieczonych?", kind: "select", options: [["true", "Tak"], ["false", "Nie (do 20)"]] },
  { key: "applicationDate", label: "Data złożenia wniosku", kind: "date" },
  { key: "leave.fullLeaveRequested", label: "Wniosek o pełny wymiar (81,5%)", kind: "select", options: [["true", "Tak"], ["false", "Nie"]] },
  { key: "contributionDebt", label: "Zadłużenie w składkach (zł)", kind: "number" },
  { key: "zusDecision.outcome", label: "Rozstrzygnięcie ZUS w aktach", kind: "select", options: [["przyznano", "Przyznano"], ["odmowa", "Odmowa"], ["brak_informacji", "Brak informacji"]] },
];

function getField(c: CaseExtraction, key: FieldKey): ExtractedField<unknown> {
  const [a, b] = key.split(".") as [keyof CaseExtraction, string | undefined];
  const node = c[a] as unknown as Record<string, ExtractedField<unknown>> & ExtractedField<unknown>;
  return b ? node[b] : node;
}

function setField(c: CaseExtraction, key: FieldKey, raw: string, kind: "date" | "number" | "select"): CaseExtraction {
  const value = raw === "" ? null : kind === "number" ? Number(raw.replace(",", ".")) : raw === "true" ? true : raw === "false" ? false : raw;
  const next = structuredClone(c);
  const [a, b] = key.split(".") as [keyof CaseExtraction, string | undefined];
  const node = next[a] as unknown as Record<string, ExtractedField<unknown>> & ExtractedField<unknown>;
  const target = b ? node[b] : node;
  target.value = value;
  target.confidence = 1; // confirmed by a human
  return next;
}

/**
 * Ekran 8 — Sprawdź sprawę: PDF → AI reads facts (/api/cases/extract) → human confirms →
 * rules engine computes the verdict → comparison with the ZUS decision found in the file.
 */
export default function CheckCasePage() {
  const [step, setStep] = useState<Step>("pick");
  const [data, setData] = useState<CaseExtraction | null>(null);
  const [source, setSource] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setError(null);
    setSource(file.name);
    setStep("reading");
    const body = new FormData();
    body.append("file", file);
    try {
      const res = await fetch("/api/cases/extract", { method: "POST", body });
      const json = (await res.json()) as { extraction?: CaseExtraction; error?: string; fallback?: boolean };
      if (!res.ok || !json.extraction) {
        setError(json.fallback ? `${json.error} Wybierz przykładową sprawę poniżej.` : (json.error ?? "Nie udało się odczytać pliku."));
        setStep("pick");
        return;
      }
      setData(json.extraction);
      setStep("confirm");
    } catch {
      setError("Brak połączenia z serwerem.");
      setStep("pick");
    }
  }

  const result = useMemo(() => {
    if (step !== "result" || !data) return null;
    const mapped = caseToPlanInput(data);
    if (!mapped.input) return { missing: mapped.missing, plan: null, match: null };
    const plan = buildPlan(mapped.input);
    return { missing: [], plan, match: compareWithDecision(plan.eligibility.A.eligible, data) };
  }, [step, data]);

  return (
    <FlowShell right={<span className="kr-small text-kr-text-2">Dla jury i rodziców</span>}>
      <h1 className="kr-h1">Sprawdź sprawę</h1>

      {step === "pick" && (
        <>
          <p className="mt-2 text-kr-text-2">Wgraj akta sprawy (PDF, także skan) albo wybierz przykładową sprawę.</p>
          {error && <ToneBox tone="warning" title={error} className="mt-4" />}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="mt-6 flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-kr-border bg-kr-surface p-8 text-center hover:border-kr-primary/50"
          >
            <Upload className="size-8 text-kr-primary" aria-hidden />
            <span className="font-semibold">Wgraj PDF</span>
            <span className="kr-small text-kr-text-2">Z-3, Z-3a, ZAM, ZAS-53, decyzje — także stare ZUR / ZAO / Z-3b · do 4 MB</span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
              e.target.value = "";
            }}
          />
          <p className="mt-2 flex items-center gap-1 kr-caption font-normal text-kr-text-2">
            <Sparkles className="size-3.5" aria-hidden /> AI tylko odczytuje dane. Plik nie jest zapisywany.
          </p>

          <p className="mt-6 mb-2 kr-caption text-kr-text-2">Przykładowe sprawy (dane fikcyjne)</p>
          <div className="grid gap-2">
            {SAMPLE_CASES.map((sc) => (
              <button
                key={sc.id}
                type="button"
                onClick={() => {
                  setError(null);
                  setSource(sc.title);
                  setData(sc.extraction);
                  setStep("confirm");
                }}
                className="flex items-start gap-3 rounded-2xl border border-kr-border bg-kr-surface p-4 text-left hover:border-kr-primary/40"
              >
                <FileText className="mt-0.5 size-5 text-kr-text-2" aria-hidden />
                <span>
                  <span className="block font-medium">{sc.title}</span>
                  <span className="kr-small text-kr-text-2">{sc.formType}</span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {step === "reading" && (
        <Panel className="mt-6 flex items-center gap-3">
          <Loader2 className="size-5 animate-spin text-kr-primary" aria-hidden />
          <span>Czytam „{source}”… Skan kilkudziesięciu stron może potrwać do minuty.</span>
        </Panel>
      )}

      {step === "confirm" && data && (
        <>
          <p className="mt-2 text-kr-text-2">Sprawdź odczytane dane. Pola z niższą pewnością są podświetlone — popraw je, jeśli trzeba.</p>
          <Panel className="mt-6">
            <p className="kr-small text-kr-text-2">
              Rozpoznane dokumenty: <span className="font-medium text-kr-text">{data.documents.map((d) => d.form).join(", ") || "—"}</span>
            </p>
            <ul className="mt-3 space-y-3">
              {FIELDS.map((fd) => {
                const fld = getField(data, fd.key);
                const low = fld.confidence < 0.8;
                const id = fd.key.replace(".", "-");
                const value = fld.value === null || fld.value === undefined ? "" : String(fld.value);
                return (
                  <li key={fd.key} className={cn("rounded-xl p-3", low ? "bg-[#FBF3E6]" : "bg-muted/60")}>
                    <div className="flex items-center justify-between gap-2">
                      <label htmlFor={id} className="kr-small text-kr-text-2">{fd.label}</label>
                      <span className={cn("kr-caption", low ? "text-kr-warning" : "text-kr-text-2")}>
                        {fld.confidence === 1 ? "potwierdzone" : `pewność ${Math.round(fld.confidence * 100)}%`}
                        {fld.page ? ` · str. ${fld.page}` : ""}
                      </span>
                    </div>
                    {fd.kind === "select" ? (
                      <select
                        id={id}
                        value={value}
                        onChange={(e) => setData(setField(data, fd.key, e.target.value, fd.kind))}
                        className="mt-1 h-11 w-full rounded-md border border-kr-border bg-white px-3"
                      >
                        <option value="">— brak —</option>
                        {fd.options!.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    ) : (
                      <Input
                        id={id}
                        type={fd.kind === "date" ? "date" : "text"}
                        inputMode={fd.kind === "number" ? "decimal" : undefined}
                        value={value}
                        onChange={(e) => setData(setField(data, fd.key, e.target.value, fd.kind))}
                        className="mt-1 h-11 bg-white"
                      />
                    )}
                    <div className="mt-1"><SourceTag source={fld.confidence === 1 ? "user" : "ai"} /></div>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 kr-small text-kr-text-2">Wynagrodzenie: {data.wages.length} mies. odczytanych z akt.</p>
            {data.notes.length > 0 && (
              <ToneBox tone="info" title="Uwagi z odczytu" className="mt-3">
                <ul className="list-disc pl-4">{data.notes.map((n) => <li key={n}>{n}</li>)}</ul>
              </ToneBox>
            )}
          </Panel>
          <div className="mt-auto flex gap-3 pt-6">
            <Button variant="outline" size="lg" className="h-14 rounded-2xl" onClick={() => setStep("pick")}>Wróć</Button>
            <Button size="lg" className="h-14 flex-1 rounded-2xl text-base" onClick={() => setStep("result")}>Potwierdzam dane</Button>
          </div>
        </>
      )}

      {step === "result" && result && (
        <>
          {result.plan === null ? (
            <ToneBox tone="warning" title="Brakuje danych do obliczenia" className="mt-6">
              Uzupełnij: {result.missing.join(", ")}.
            </ToneBox>
          ) : (
            <>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Panel>
                  <p className="kr-caption text-kr-text-2">Rozstrzygnięcie w aktach</p>
                  <p className="mt-1 font-semibold">
                    {{ przyznano: "Przyznano", odmowa: "Odmowa", brak_informacji: "Brak informacji" }[data!.zusDecision.outcome.value ?? "brak_informacji"]}
                  </p>
                  {data!.zusDecision.reason.value && <p className="kr-small text-kr-text-2">{data!.zusDecision.reason.value}</p>}
                </Panel>
                <Panel>
                  <p className="kr-caption text-kr-text-2">Nasz werdykt (silnik reguł)</p>
                  <p className="mt-1 font-semibold">{result.plan.eligibility.A.eligible ? "Prawo przysługuje" : "Brak prawa"}</p>
                  <p className="kr-small text-kr-text-2">{result.plan.eligibility.A.reason}</p>
                </Panel>
              </div>
              <ToneBox
                tone={result.match === "zgodny" ? "success" : result.match === "rozbieżny" ? "danger" : "info"}
                title={
                  result.match === "zgodny" ? "Werdykt zgodny z rozstrzygnięciem ZUS"
                  : result.match === "rozbieżny" ? "Werdykt różni się od rozstrzygnięcia ZUS — sprawdź dane"
                  : "W aktach nie ma rozstrzygnięcia do porównania"
                }
                className="mt-4"
              />
              {result.plan.eligibility.A.eligible && (
                <Panel className="mt-4">
                  <dl className="grid grid-cols-2 gap-y-2 kr-small">
                    <dt className="text-kr-text-2">Wypłaca</dt>
                    <dd className="font-semibold">{{ platnik: "pracodawca (płatnik)", ZUS: "ZUS", nieznany: "do ustalenia" }[result.plan.payer.A]}</dd>
                    <dt className="text-kr-text-2">Wariant</dt>
                    <dd className="font-semibold">{result.plan.variantApplied === "81.5" ? "81,5%" : "100% + 70%"}</dd>
                    <dt className="text-kr-text-2">Zasiłek za pełny miesiąc</dt>
                    <dd className="font-heading text-lg font-extrabold text-kr-primary-dark">
                      {result.plan.monthly.A !== null ? formatPLN(result.plan.monthly.A) : "— (brak wynagrodzeń w aktach)"}
                    </dd>
                  </dl>
                </Panel>
              )}
              <Panel className="mt-4">
                <h2 className="kr-card-title mb-2">Dlaczego tak?</h2>
                <ol className="space-y-2">
                  {result.plan.trace.filter((t) => t.id !== "params").map((t) => (
                    <li key={t.id} className="kr-small">
                      <span className="font-semibold">{t.label}:</span> {t.detail}
                      <span className="ml-1 inline-flex items-center gap-1 kr-caption font-normal text-kr-text-2"><BookOpen className="size-3" aria-hidden />{t.rule}</span>
                    </li>
                  ))}
                </ol>
              </Panel>
            </>
          )}
          <div className="mt-auto flex gap-3 pt-6">
            <Button variant="outline" size="lg" className="h-14 rounded-2xl" onClick={() => setStep("confirm")}>Popraw dane</Button>
            <Button size="lg" className="h-14 flex-1 rounded-2xl text-base" onClick={() => { setData(null); setStep("pick"); }}>Inna sprawa</Button>
          </div>
        </>
      )}
    </FlowShell>
  );
}

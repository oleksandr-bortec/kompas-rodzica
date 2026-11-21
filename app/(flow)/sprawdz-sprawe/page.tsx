"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, FileText, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FlowShell } from "@/components/kr/flow-shell";
import { Panel, SourceTag, ToneBox } from "@/components/kr/ui";
import { SAMPLE_CASES, type SampleCase } from "@/lib/mocks/sample-cases";
import { cn } from "@/lib/utils";

type Step = "pick" | "reading" | "confirm" | "result";

/**
 * Ekran 8 — Sprawdź sprawę. Skeleton flow: pick/upload → (AI extraction) →
 * human confirmation → verdict. Real extraction: POST /api/cases/extract (later).
 */
export default function CheckCasePage() {
  const [step, setStep] = useState<Step>("pick");
  const [c, setC] = useState<SampleCase | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const start = (sc: SampleCase, name?: string) => {
    setC(sc);
    setFileName(name ?? null);
    setStep("reading");
    setTimeout(() => setStep("confirm"), 900);
  };

  return (
    <FlowShell right={<span className="kr-small text-kr-text-2">Dla jury i rodziców</span>}>
      <h1 className="kr-h1">Sprawdź sprawę</h1>

      {step === "pick" && (
        <>
          <p className="mt-2 text-kr-text-2">Wgraj dokumenty (PDF) albo wybierz przykładową sprawę.</p>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="mt-6 flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-kr-border bg-kr-surface p-8 text-center hover:border-kr-primary/50"
          >
            <Upload className="size-8 text-kr-primary" aria-hidden />
            <span className="font-semibold">Wgraj PDF</span>
            <span className="kr-small text-kr-text-2">ZAM, Z-3, Z-3a, ZAS-53, zaświadczenia — także stare formularze</span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              // TODO(step AI): send to /api/cases/extract; skeleton uses demo case 1
              if (f) start(SAMPLE_CASES[0], f.name);
            }}
          />
          <p className="mt-6 mb-2 kr-caption text-kr-text-2">Przykładowe sprawy</p>
          <div className="grid gap-2">
            {SAMPLE_CASES.map((sc) => (
              <button key={sc.id} type="button" onClick={() => start(sc)} className="flex items-start gap-3 rounded-2xl border border-kr-border bg-kr-surface p-4 text-left hover:border-kr-primary/40">
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
          <span>Czytam dokument{fileName ? ` „${fileName}”` : ""}…</span>
        </Panel>
      )}

      {step === "confirm" && c && (
        <>
          <p className="mt-2 text-kr-text-2">Sprawdź rozpoznane dane. Pola z niższą pewnością są podświetlone.</p>
          <Panel className="mt-6">
            <p className="kr-small text-kr-text-2">Rozpoznany typ: <span className="font-medium text-kr-text">{c.formType}</span></p>
            <ul className="mt-3 space-y-3">
              {c.fields.map((f) => {
                const low = f.confidence < 0.8;
                return (
                  <li key={f.key} className={cn("rounded-xl p-3", low ? "bg-[#FBF3E6]" : "bg-muted/60")}>
                    <div className="flex items-center justify-between gap-2">
                      <label htmlFor={f.key} className="kr-small text-kr-text-2">{f.label}</label>
                      <span className={cn("kr-caption", low ? "text-kr-warning" : "text-kr-text-2")}>
                        pewność {Math.round(f.confidence * 100)}% · str. {f.page}
                      </span>
                    </div>
                    <Input id={f.key} defaultValue={f.value} className="mt-1 h-11 bg-white" />
                    <div className="mt-1"><SourceTag source="ai" /></div>
                  </li>
                );
              })}
            </ul>
          </Panel>
          <div className="mt-auto pt-6">
            <Button size="lg" className="h-14 w-full rounded-2xl text-base" onClick={() => setStep("result")}>
              Potwierdzam dane
            </Button>
          </div>
        </>
      )}

      {step === "result" && c && (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Panel>
              <p className="kr-caption text-kr-text-2">Decyzja w sprawie</p>
              <p className="mt-1 font-semibold">{c.zusDecision}</p>
            </Panel>
            <Panel>
              <p className="kr-caption text-kr-text-2">Nasz werdykt (silnik reguł)</p>
              <p className="mt-1 font-semibold">{c.ourVerdict}</p>
            </Panel>
          </div>
          <ToneBox
            tone={c.match ? "success" : "danger"}
            title={c.match ? "Werdykt zgodny z decyzją ZUS" : "Werdykt różni się od decyzji ZUS"}
            className="mt-4"
          >
            Szczegóły wyliczenia zobaczysz w „Dlaczego tyle?”.
          </ToneBox>
          <div className="mt-auto flex gap-3 pt-6">
            <Button variant="outline" size="lg" className="h-14 rounded-2xl" onClick={() => setStep("pick")}>Inna sprawa</Button>
            <Button asChild size="lg" className="h-14 flex-1 rounded-2xl text-base">
              <Link href="/plan/dlaczego"><CheckCircle2 aria-hidden /> Dlaczego tyle?</Link>
            </Button>
          </div>
        </>
      )}
    </FlowShell>
  );
}

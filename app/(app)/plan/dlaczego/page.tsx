"use client";

import { Sparkles } from "lucide-react";
import { usePersona } from "@/components/kr/persona-provider";
import { DemoDataNote, PageHeader, Panel, SourceTag } from "@/components/kr/ui";
import { formatPLN } from "@/lib/format";

/**
 * Ekran 7 — Dlaczego tyle? Step-by-step trace.
 * Skeleton: steps are illustrative; in step 3 they come from the engine trace.
 * TODO(ZUS): wzór podstawy wymiaru i stawki dziennej — brak w PDF.
 */
export default function WhyPage() {
  const { persona } = usePersona();
  const plan = persona.demoPlan;
  const steps = [
    { label: "Podstawa wymiaru (przeciętnie z 12 mies.)", value: formatPLN(persona.a.avgMonthlyBase), note: "Wzór podstawy: do potwierdzenia z materiałów ZUS", source: "zus" as const },
    { label: "Procent zasiłku", value: plan.variant, note: "81,5% za cały okres, jeśli wniosek ≤ 21 dni po porodzie" },
    { label: "Kwota miesięczna", value: formatPLN(plan.monthlyA), note: "Wynik — liczony przez silnik reguł" },
  ];

  return (
    <div className="max-w-2xl">
      <PageHeader title="Dlaczego tyle?" subtitle="Rozliczenie krok po kroku" back="/plan" />
      <Panel>
        <ol className="space-y-0">
          {steps.map((s, i) => (
            <li key={s.label} className="relative flex gap-4 pb-6 last:pb-0">
              <span className="z-10 grid size-8 shrink-0 place-items-center rounded-full bg-kr-tint font-heading font-bold text-kr-primary-dark">
                {i + 1}
              </span>
              {i < steps.length - 1 && <span className="absolute left-4 top-8 h-full w-px bg-kr-border" aria-hidden />}
              <div className="flex-1">
                <p className="kr-small text-kr-text-2">{s.label}</p>
                <p className="font-heading text-xl font-bold tabular">{s.value}</p>
                <p className="kr-small text-kr-text-2">{s.note}</p>
                {s.source && <div className="mt-1"><SourceTag source={s.source} /></div>}
              </div>
            </li>
          ))}
        </ol>
      </Panel>

      <Panel className="mt-4 bg-kr-partner-tint/40">
        <div className="flex items-center gap-2 text-kr-partner">
          <Sparkles className="size-4" aria-hidden />
          <p className="kr-caption">Wyjaśnienie AI</p>
        </div>
        <p className="mt-2">
          Twój zasiłek liczymy od przeciętnej podstawy z ostatnich 12 miesięcy. Wybrałaś wariant {plan.variant}, więc
          dostajesz tę samą kwotę przez cały urlop. Liczby w tym tekście wstawia silnik reguł — AI ich nie zmienia.
        </p>
      </Panel>
      <div className="mt-4"><DemoDataNote /></div>
    </div>
  );
}

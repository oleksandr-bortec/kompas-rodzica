"use client";

import { BookOpen, Sparkles } from "lucide-react";
import { usePlan } from "@/components/kr/use-plan";
import { PageHeader, Panel, SourceTag } from "@/components/kr/ui";
import { formatPLN } from "@/lib/format";

/**
 * Ekran 7 — Dlaczego tyle? Shows the engine trace step by step.
 * Amount: podstawa × procent = kwota za pełny miesiąc (podstawa podana z ZUS;
 * TODO(ZUS): wzór podstawy i stawka dzienna — brak w materiałach).
 */
export default function WhyPage() {
  const { persona, plan } = usePlan();
  const main = plan.segments.find((s) => s.parent === "A" && s.kind !== "ojcowski");
  const base = persona.a.avgMonthlyBase;

  return (
    <div className="max-w-2xl">
      <PageHeader title="Dlaczego tyle?" subtitle="Każdy krok silnika reguł z podstawą prawną" back="/plan" />

      {main && main.monthlyAmount !== null && (
        <Panel className="mb-4">
          <p className="kr-caption text-kr-text-2">Wyliczenie kwoty</p>
          <div className="mt-3 grid grid-cols-[1fr_auto] gap-y-2 tabular">
            <span className="text-kr-text-2">Podstawa wymiaru <SourceTag source="zus" /></span>
            <span className="text-right font-semibold">{formatPLN(base)}</span>
            <span className="text-kr-text-2">× procent zasiłku</span>
            <span className="text-right font-semibold">{String(main.ratePercent).replace(".", ",")}%</span>
            <span className="border-t border-kr-border pt-2 font-semibold">= za pełny miesiąc</span>
            <span className="border-t border-kr-border pt-2 text-right font-heading text-xl font-extrabold text-kr-primary-dark">
              {formatPLN(main.monthlyAmount)}
            </span>
          </div>
        </Panel>
      )}

      <Panel>
        <ol>
          {plan.trace.map((s, i) => (
            <li key={s.id} className="relative flex gap-4 pb-6 last:pb-0">
              <span className="z-10 grid size-8 shrink-0 place-items-center rounded-full bg-kr-tint font-heading font-bold text-kr-primary-dark">
                {i + 1}
              </span>
              {i < plan.trace.length - 1 && <span className="absolute left-4 top-8 h-full w-px bg-kr-border" aria-hidden />}
              <div className="flex-1">
                <p className="font-semibold">{s.label}</p>
                <p className="kr-small text-kr-text-2">{s.detail}</p>
                <p className="mt-1 inline-flex items-center gap-1 kr-caption font-normal text-kr-text-2">
                  <BookOpen className="size-3.5" aria-hidden /> {s.rule}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Panel>

      <Panel className="mt-4 bg-kr-partner-tint/40">
        <div className="flex items-center gap-2 text-kr-partner">
          <Sparkles className="size-4" aria-hidden />
          <p className="kr-caption">Wyjaśnienie AI — wkrótce</p>
        </div>
        <p className="mt-2 kr-small">
          AI opisze te kroki prostym językiem. Liczby wstawi silnik reguł — AI ich nie zmienia.
        </p>
      </Panel>
    </div>
  );
}

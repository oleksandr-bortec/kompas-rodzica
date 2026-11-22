"use client";

import { BookOpen } from "lucide-react";
import { usePlan } from "@/components/kr/use-plan";
import { ExplainCard } from "@/components/kr/explain-card";
import { personaToInput } from "@/lib/personas/to-engine";
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

      <div className="mb-4">
        <ExplainCard plan={plan} input={personaToInput(persona)} names={{ A: persona.a.name, B: persona.b?.name }} />
      </div>

      {base !== null && main && main.monthlyAmount !== null && (
        <Panel className="mb-4">
          <p className="kr-caption text-kr-text-2">Wyliczenie kwoty</p>
          <div className="mt-3 grid grid-cols-[1fr_auto] gap-y-2 tabular">
            <span className="text-kr-text-2">Podstawa wymiaru zasiłku <SourceTag source={persona.id === "custom" ? "user" : "zus"} /></span>
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
                <p className="font-semibold">
                  {s.label}
                  {persona.b && /-(A|B)$/.test(s.id) && (
                    <span className="ml-1 font-normal text-kr-text-2">· {s.id.endsWith("-B") ? persona.b.name : persona.a.name}</span>
                  )}
                </p>
                <p className="kr-small text-kr-text-2">{s.detail}</p>
                <p className="mt-1 inline-flex items-center gap-1 kr-caption font-normal text-kr-text-2">
                  <BookOpen className="size-3.5" aria-hidden /> {s.rule}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Panel>

    </div>
  );
}

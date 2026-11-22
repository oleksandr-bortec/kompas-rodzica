"use client";

import { BookOpen } from "lucide-react";
import { usePlan } from "@/components/kr/use-plan";
import { PageHeader, Panel, ToneIcon } from "@/components/kr/ui";

const SEVERITY = { danger: "Poważne", warning: "Ważne", info: "Dobrze wiedzieć" } as const;

/** Ekran 10 — Ryzyka (z silnika reguł). */
export default function RisksPage() {
  const { persona, plan } = usePlan();
  const name = (p: "A" | "B") => (p === "A" ? persona.a.name : persona.b?.name);
  return (
    <div className="max-w-3xl">
      <PageHeader title="Ryzyka" subtitle="Co może odebrać lub obniżyć zasiłek — i jak temu zapobiec" back="/plan" />
      {plan.risks.length === 0 ? (
        <Panel><p className="text-kr-text-2">Nie widzimy ryzyk w Twojej sytuacji.</p></Panel>
      ) : (
        <ul className="space-y-4">
          {plan.risks.map((r) => (
            <Panel as="li" key={r.id}>
              <div className="flex gap-3">
                <ToneIcon tone={r.severity} className="mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="kr-caption text-kr-text-2">{SEVERITY[r.severity]}{persona.b ? ` · ${name(r.parent)}` : ""}</p>
                  <h2 className="kr-card-title">{r.title}</h2>
                  <dl className="mt-3 space-y-2 kr-small">
                    <div><dt className="font-semibold">Dlaczego to ważne</dt><dd className="text-kr-text-2">{r.why}</dd></div>
                    <div><dt className="font-semibold">Co zrobić</dt><dd className="text-kr-text-2">{r.todo}</dd></div>
                  </dl>
                  <p className="mt-3 flex items-start gap-1.5 kr-caption font-normal text-kr-text-2">
                    <BookOpen className="mt-0.5 size-3.5 shrink-0" aria-hidden /> <span className="min-w-0 break-words [overflow-wrap:anywhere]">{r.rule}</span>
                  </p>
                </div>
              </div>
            </Panel>
          ))}
        </ul>
      )}
    </div>
  );
}

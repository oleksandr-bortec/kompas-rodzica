"use client";

import { BookOpen } from "lucide-react";
import { usePersona } from "@/components/kr/persona-provider";
import { PageHeader, Panel, ToneIcon } from "@/components/kr/ui";

const SEVERITY = { danger: "Poważne", warning: "Ważne", info: "Dobrze wiedzieć", success: "OK" } as const;

/** Ekran 10 — Ryzyka. */
export default function RisksPage() {
  const { persona } = usePersona();
  const risks = persona.demoPlan.risks;
  return (
    <div className="max-w-3xl">
      <PageHeader title="Ryzyka" subtitle="Co może odebrać lub obniżyć zasiłek — i jak temu zapobiec" back="/plan" />
      {risks.length === 0 ? (
        <Panel><p className="text-kr-text-2">Nie widzimy ryzyk w Twojej sytuacji.</p></Panel>
      ) : (
        <ul className="space-y-4">
          {risks.map((r) => (
            <Panel as="li" key={r.id}>
              <div className="flex gap-3">
                <ToneIcon tone={r.tone} className="mt-0.5" />
                <div className="flex-1">
                  <p className="kr-caption text-kr-text-2">{SEVERITY[r.tone]}</p>
                  <h2 className="kr-card-title">{r.title}</h2>
                  <dl className="mt-3 space-y-2 kr-small">
                    <div><dt className="font-semibold">Dlaczego to ważne</dt><dd className="text-kr-text-2">{r.why}</dd></div>
                    <div><dt className="font-semibold">Co zrobić</dt><dd className="text-kr-text-2">{r.todo}</dd></div>
                  </dl>
                  <p className="mt-3 inline-flex items-center gap-1.5 kr-caption font-normal text-kr-text-2">
                    <BookOpen className="size-3.5" aria-hidden /> {r.rule}
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

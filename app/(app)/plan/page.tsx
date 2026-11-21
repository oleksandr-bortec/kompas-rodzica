"use client";

import Link from "next/link";
import { ArrowRight, Building2, CalendarClock, ChevronRight, HelpCircle, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MonthlyChart } from "@/components/kr/monthly-chart";
import { usePersona } from "@/components/kr/persona-provider";
import { Timeline } from "@/components/kr/timeline";
import { DemoDataNote, PageHeader, Panel, ToneBox, ToneIcon } from "@/components/kr/ui";
import { daysUntil, formatDate, formatPLN } from "@/lib/format";
import { demoMonths } from "@/lib/personas/derive";

function PayerChip({ payer }: { payer: "pracodawca" | "ZUS" }) {
  const Icon = payer === "ZUS" ? Landmark : Building2;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 kr-small font-medium">
      <Icon className="size-4 text-kr-text-2" aria-hidden /> Wypłaca: {payer === "ZUS" ? "ZUS" : "pracodawca"}
    </span>
  );
}

/** Ekran 5 — Plan (główny). */
export default function PlanPage() {
  const { persona } = usePersona();
  const plan = persona.demoPlan;
  const days = daysUntil(persona.eventDate);
  const eventWord = persona.event === "adopcja" ? "przyjęcia dziecka" : "terminu porodu";

  return (
    <div>
      <PageHeader
        title={`Cześć, ${persona.a.name}${persona.b ? ` i ${persona.b.name}` : ""}`}
        subtitle={
          days > 0
            ? `Do ${eventWord}: ${days} dni (${formatDate(persona.eventDate)})`
            : `Data ${eventWord}: ${formatDate(persona.eventDate)}`
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_340px] lg:gap-6">
        <div className="space-y-4">
          {/* Verdict */}
          <Panel>
            <div className="flex gap-3">
              <ToneIcon tone={plan.verdict.tone} className="mt-1 size-6" />
              <div>
                <h2 className="kr-h2">{plan.verdict.title}</h2>
                <p className="mt-1 text-kr-text-2">{plan.verdict.detail}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <PayerChip payer={plan.payerA} />
                </div>
              </div>
            </div>
          </Panel>

          {/* Amounts */}
          {plan.monthlyA > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Panel>
                <p className="kr-small text-kr-text-2">{persona.a.name} · miesięcznie · wariant {plan.variant}</p>
                <p className="kr-amount mt-1 text-kr-primary-dark">{formatPLN(plan.monthlyA)}</p>
                <Link href="/plan/dlaczego" className="mt-2 inline-flex items-center gap-1 kr-small font-medium text-kr-primary hover:underline">
                  <HelpCircle className="size-4" aria-hidden /> Dlaczego tyle?
                </Link>
              </Panel>
              {persona.b && plan.monthlyB !== undefined && (
                <Panel>
                  <p className="kr-small text-kr-text-2">{persona.b.name} · miesięcznie (rodzicielski)</p>
                  <p className="kr-amount mt-1 text-kr-partner">{formatPLN(plan.monthlyB)}</p>
                  {plan.payerB && <div className="mt-2"><PayerChip payer={plan.payerB} /></div>}
                </Panel>
              )}
            </div>
          )}

          {/* Timeline */}
          <Panel>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="kr-h2">Kto, kiedy i ile</h2>
              <Button asChild variant="ghost" size="sm" className="text-kr-primary-dark">
                <Link href="/kalkulator">Zmień podział <ChevronRight aria-hidden /></Link>
              </Button>
            </div>
            <Timeline segments={plan.segments} nameA={persona.a.name} nameB={persona.b?.name} />
          </Panel>

          {plan.monthlyA > 0 && (
            <Panel>
              <h2 className="kr-h2 mb-4">Pieniądze miesiąc po miesiącu</h2>
              <MonthlyChart data={demoMonths(persona)} nameA={persona.a.name} nameB={persona.b?.name} />
            </Panel>
          )}
          <DemoDataNote />
        </div>

        {/* Right column on desktop */}
        <aside className="space-y-4">
          <Panel className="border-kr-accent/40">
            <span className="inline-flex items-center gap-1 rounded-full bg-kr-accent px-2.5 py-0.5 kr-caption text-kr-text">
              <CalendarClock className="size-3.5" aria-hidden /> Następny krok
            </span>
            <p className="mt-3 kr-card-title">{plan.nextStep.title}</p>
            <p className="mt-1 kr-small text-kr-text-2">do {formatDate(plan.nextStep.date)}</p>
            <Button asChild className="mt-4 h-12 w-full rounded-xl">
              <Link href={plan.nextStep.href}>
                Zrób to teraz <ArrowRight aria-hidden />
              </Link>
            </Button>
          </Panel>

          {plan.risks.length > 0 && (
            <Panel>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="kr-card-title">Na co uważać</h2>
                <Link href="/ryzyka" className="kr-small font-medium text-kr-primary hover:underline">Wszystkie</Link>
              </div>
              <div className="space-y-2">
                {plan.risks.slice(0, 2).map((r) => (
                  <ToneBox key={r.id} tone={r.tone} title={r.title} />
                ))}
              </div>
            </Panel>
          )}

          <Panel>
            <h2 className="kr-card-title">Dokumenty</h2>
            <p className="mt-1 kr-small text-kr-text-2">{plan.documents.length} do złożenia</p>
            <Button asChild variant="outline" className="mt-3 h-11 w-full rounded-xl">
              <Link href="/dokumenty">Zobacz listę</Link>
            </Button>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

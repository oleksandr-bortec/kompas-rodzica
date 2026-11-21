"use client";

import Link from "next/link";
import { ArrowRight, Building2, CalendarClock, ChevronRight, HelpCircle, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MonthlyChart } from "@/components/kr/monthly-chart";
import { Timeline } from "@/components/kr/timeline";
import { PAYER_LABEL, usePlan } from "@/components/kr/use-plan";
import { PageHeader, Panel, ToneBox, ToneIcon } from "@/components/kr/ui";
import { daysUntil, formatDate, formatPLN, monthShort } from "@/lib/format";
import { planMonths } from "@/lib/engine/months";
import type { Payer } from "@/lib/engine";

function PayerChip({ payer }: { payer: Payer }) {
  const Icon = payer === "ZUS" ? Landmark : Building2;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 kr-small font-medium">
      <Icon className="size-4 text-kr-text-2" aria-hidden /> Wypłaca: {PAYER_LABEL[payer]}
    </span>
  );
}

const SEVERITY_TONE = { danger: "danger", warning: "warning", info: "info" } as const;

/** Ekran 5 — Plan (główny). Wszystkie liczby z lib/engine (buildPlan). */
export default function PlanPage() {
  const { persona, plan, verdict } = usePlan();
  const days = daysUntil(persona.eventDate);
  const eventWord = persona.event === "porod" ? "terminu porodu" : "przyjęcia dziecka";
  const variantLabel = plan.variantApplied === "81.5" ? "81,5%" : "100% + 70%";
  const nextDeadline = plan.deadlines[0];
  const months = planMonths(plan, persona.eventDate).map((m) => ({ month: monthShort(m.month), a: m.a, b: m.b }));
  const hasAmounts = months.some((m) => m.a + m.b > 0);

  return (
    <div>
      <PageHeader
        title={`Cześć, ${persona.a.name}${persona.b ? ` i ${persona.b.name}` : ""}`}
        subtitle={
          days > 0 ? `Do ${eventWord}: ${days} dni (${formatDate(persona.eventDate)})` : `Data ${eventWord}: ${formatDate(persona.eventDate)}`
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_340px] lg:gap-6">
        <div className="space-y-4">
          <Panel>
            <div className="flex gap-3">
              <ToneIcon tone={verdict.tone} className="mt-1 size-6" />
              <div>
                <h2 className="kr-h2">{verdict.title}</h2>
                <p className="mt-1 text-kr-text-2">{verdict.detail}</p>
                {plan.eligibility.A.eligible && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <PayerChip payer={plan.payer.A} />
                  </div>
                )}
              </div>
            </div>
          </Panel>

          {plan.errors.map((e) => <ToneBox key={e} tone="danger" title={e} />)}

          {(plan.monthly.A !== null || plan.monthly.B !== null) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {plan.monthly.A !== null && (
                <Panel>
                  <p className="kr-small text-kr-text-2">{persona.a.name} · za pełny miesiąc · {variantLabel}</p>
                  <p className="kr-amount mt-1 text-kr-primary-dark">{formatPLN(plan.monthly.A)}</p>
                  <Link href="/plan/dlaczego" className="mt-2 inline-flex items-center gap-1 kr-small font-medium text-kr-primary hover:underline">
                    <HelpCircle className="size-4" aria-hidden /> Dlaczego tyle?
                  </Link>
                </Panel>
              )}
              {persona.b && plan.monthly.B !== null && (
                <Panel>
                  <p className="kr-small text-kr-text-2">{persona.b.name} · rodzicielski · za pełny miesiąc</p>
                  <p className="kr-amount mt-1 text-kr-partner">{formatPLN(plan.monthly.B)}</p>
                  {plan.payer.B && <div className="mt-2"><PayerChip payer={plan.payer.B} /></div>}
                </Panel>
              )}
            </div>
          )}

          <Panel>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="kr-h2">Kto, kiedy i ile</h2>
              <Button asChild variant="ghost" size="sm" className="text-kr-primary-dark">
                <Link href="/kalkulator">Zmień podział <ChevronRight aria-hidden /></Link>
              </Button>
            </div>
            <Timeline
              segments={plan.segments.map((s) => ({ parent: s.parent, kind: s.kind, startWeek: s.startWeek, weeks: s.weeks, percent: s.ratePercent }))}
              nameA={persona.a.name}
              nameB={persona.b?.name}
            />
          </Panel>

          {hasAmounts && (
            <Panel>
              <h2 className="kr-h2">Pieniądze miesiąc po miesiącu</h2>
              <p className="mb-4 kr-small text-kr-text-2">Kwoty za pełne miesiące.</p>
              <MonthlyChart data={months} nameA={persona.a.name} nameB={persona.b?.name} />
            </Panel>
          )}

          {plan.todos.length > 0 && (
            <ToneBox tone="info" title="Czego jeszcze nie liczymy">
              <ul className="list-disc pl-4">{plan.todos.map((t) => <li key={t}>{t}</li>)}</ul>
            </ToneBox>
          )}
          <p className="kr-small text-kr-text-2">To informacja, a nie decyzja ZUS. Parametry z dnia {plan.paramsVersion}.</p>
        </div>

        <aside className="space-y-4">
          <Panel className="border-kr-accent/40">
            <span className="inline-flex items-center gap-1 rounded-full bg-kr-accent px-2.5 py-0.5 kr-caption text-kr-text">
              <CalendarClock className="size-3.5" aria-hidden /> Następny krok
            </span>
            <p className="mt-3 kr-card-title">{persona.demoPlan.nextStep.title}</p>
            {nextDeadline && <p className="mt-1 kr-small text-kr-text-2">{nextDeadline.label}: {formatDate(nextDeadline.date)}</p>}
            <Button asChild className="mt-4 h-12 w-full rounded-xl">
              <Link href={persona.demoPlan.nextStep.href}>Zrób to teraz <ArrowRight aria-hidden /></Link>
            </Button>
          </Panel>

          {plan.deadlines.length > 0 && (
            <Panel>
              <h2 className="kr-card-title mb-2">Terminy</h2>
              <ul className="divide-y divide-kr-border">
                {plan.deadlines.map((d) => (
                  <li key={d.id} className="py-2.5">
                    <p className="kr-small text-kr-text-2">{d.label}</p>
                    <p className="font-semibold tabular">{formatDate(d.date)}</p>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {plan.risks.length > 0 && (
            <Panel>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="kr-card-title">Na co uważać</h2>
                <Link href="/ryzyka" className="kr-small font-medium text-kr-primary hover:underline">Wszystkie</Link>
              </div>
              <div className="space-y-2">
                {plan.risks.slice(0, 2).map((r) => <ToneBox key={r.id} tone={SEVERITY_TONE[r.severity]} title={r.title} />)}
              </div>
            </Panel>
          )}

          <Panel>
            <h2 className="kr-card-title">Dokumenty</h2>
            <p className="mt-1 kr-small text-kr-text-2">{persona.demoPlan.documents.length} do złożenia</p>
            <Button asChild variant="outline" className="mt-3 h-11 w-full rounded-xl">
              <Link href="/dokumenty">Zobacz listę</Link>
            </Button>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

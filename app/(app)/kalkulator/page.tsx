"use client";

import { useState } from "react";
import { usePersona } from "@/components/kr/persona-provider";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Timeline } from "@/components/kr/timeline";
import { usePlan } from "@/components/kr/use-plan";
import { PageHeader, Panel, ToneBox } from "@/components/kr/ui";
import { cn } from "@/lib/utils";
import { formatPLN } from "@/lib/format";
import { getParams, periods } from "@/lib/engine";

function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { v: T; l: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="grid grid-flow-col gap-1 rounded-xl bg-muted p-1" role="radiogroup">
      {options.map((o) => (
        <button
          key={o.v}
          type="button"
          role="radio"
          aria-checked={value === o.v}
          onClick={() => onChange(o.v)}
          className={cn("rounded-lg px-3 py-2 kr-small font-medium transition-colors", value === o.v ? "bg-kr-surface text-kr-primary-dark shadow-sm" : "text-kr-text-2")}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <Label className="text-base">{label}</Label>
        {hint && <p className="kr-small text-kr-text-2">{hint}</p>}
      </div>
      <div className="sm:min-w-64">{children}</div>
    </div>
  );
}

/** Ekran 6 — Kalkulator (scenariusze b–f, j). Każda zmiana → buildPlan (silnik reguł). */
export default function CalculatorPage() {
  const { persona: selected } = usePersona();
  const params = getParams(selected.eventDate);
  const [override, setChildren] = useState<"1" | "2+" | null>(null);
  const children = override ?? (selected.children === 1 ? "1" : "2+");
  const [variant, setVariant] = useState<"81.5" | "100-70">("81.5");
  const [zaZyciem, setZaZyciem] = useState(false);
  const [halfTimeA, setHalfTimeA] = useState(false);
  const nChildren = override === null ? selected.children : children === "1" ? 1 : Math.max(2, selected.children);
  const pool = periods.parentalPoolWeeks(nChildren, zaZyciem, params);
  const nt = params.parental.nonTransferableWeeksPerParent;
  const [partnerWeeks, setPartnerWeeks] = useState(nt);
  const max = pool !== null ? pool - nt : nt;
  const wB = Math.min(Math.max(partnerWeeks, nt), max);

  const { persona, plan } = usePlan(
    {
      variant,
      parentalWeeksA: pool !== null ? pool - wB : undefined,
      parentalWeeksB: pool !== null ? wB : undefined,
      workFractionA: halfTimeA ? 0.5 : 0,
    },
    { children: nChildren, zaZyciem },
  );
  const nameA = persona.a.name;
  const nameB = persona.b?.name ?? "Drugi rodzic";
  const segA = plan.segments.filter((s) => s.parent === "A");
  const segB = plan.segments.filter((s) => s.parent === "B");
  const weeksOf = (segs: typeof segA, kind: string) => segs.filter((s) => s.kind === kind).reduce((n, s) => n + s.weeks, 0);

  return (
    <div>
      <PageHeader title="Kalkulator" subtitle="Zmieniaj opcje i od razu zobacz skutki" />
      <div className="grid gap-4 lg:grid-cols-[1fr_340px] lg:gap-6">
        <div className="space-y-4">
          <Panel>
            <h2 className="kr-card-title">Dzieci</h2>
            <div className="divide-y divide-kr-border">
              <Row label={selected.event === "adopcja" ? "Liczba przyjętych dzieci" : "Liczba dzieci przy jednym porodzie"}>
                <Segmented value={children} onChange={setChildren} options={[{ v: "1", l: "Jedno" }, { v: "2+", l: "Dwoje lub więcej" }]} />
              </Row>
              <Row label="Zaświadczenie „Za życiem”" hint="Dłuższy urlop rodzicielski">
                <Switch checked={zaZyciem} onCheckedChange={setZaZyciem} />
              </Row>
            </div>
          </Panel>

          {persona.b && pool !== null && (
            <Panel>
              <h2 className="kr-card-title">Podział urlopu rodzicielskiego</h2>
              <p className="kr-small text-kr-text-2">Pula {pool} tyg., po {nt} tyg. nieprzenoszalnych dla każdego rodzica.</p>
              <div className="py-6">
                <Slider value={[wB]} min={nt} max={max} step={1} onValueChange={(v) => setPartnerWeeks(v[0])} aria-label={`Tygodnie: ${nameB}`} />
                <div className="mt-3 flex justify-between kr-small font-semibold">
                  <span className="text-kr-primary-dark">{nameA}: {pool - wB} tyg.</span>
                  <span className="text-kr-partner">{nameB}: {wB} tyg.</span>
                </div>
              </div>
            </Panel>
          )}

          <Panel>
            <h2 className="kr-card-title">Wariant i praca</h2>
            <div className="divide-y divide-kr-border">
              <Row label="Wariant wypłaty" hint="81,5% wymaga wniosku do 21 dni po porodzie">
                <Segmented value={variant} onChange={setVariant} options={[{ v: "81.5", l: "81,5% cały okres" }, { v: "100-70", l: "100% + 70%" }]} />
              </Row>
              <Row label={`${nameA}: praca na ½ etatu w czasie rodzicielskiego`} hint="Urlop wydłuża się proporcjonalnie">
                <Switch checked={halfTimeA} onCheckedChange={setHalfTimeA} />
              </Row>
            </div>
          </Panel>

          <Panel>
            <h2 className="kr-card-title mb-4">Oś czasu scenariusza</h2>
            <Timeline
              segments={plan.segments.map((s) => ({ parent: s.parent, kind: s.kind, startWeek: s.startWeek, weeks: s.weeks, percent: s.ratePercent }))}
              nameA={nameA}
              nameB={persona.b?.name}
            />
          </Panel>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-10 lg:self-start">
          <Panel className="border-kr-primary/30">
            <p className="kr-caption text-kr-text-2">Wynik scenariusza</p>
            <div className="mt-3 space-y-4">
              <div>
                <p className="kr-small text-kr-text-2">{nameA}</p>
                <p className="font-heading text-2xl font-extrabold text-kr-primary-dark tabular">
                  {plan.monthly.A !== null ? formatPLN(plan.monthly.A) : "—"}
                  <span className="ml-1 kr-small font-medium text-kr-text-2">/ mies.</span>
                </p>
                <p className="kr-small text-kr-text-2">
                  macierzyński {weeksOf(segA, "macierzynski") || weeksOf(segA, "warunki_macierzynskiego")} tyg. · rodzicielski {weeksOf(segA, "rodzicielski")} tyg.
                </p>
              </div>
              {persona.b && (
                <div>
                  <p className="kr-small text-kr-text-2">{nameB}</p>
                  <p className="font-heading text-2xl font-extrabold text-kr-partner tabular">
                    {plan.monthly.B !== null ? formatPLN(plan.monthly.B) : "—"}
                    <span className="ml-1 kr-small font-medium text-kr-text-2">/ mies.</span>
                  </p>
                  <p className="kr-small text-kr-text-2">
                    ojcowski {Math.round(weeksOf(segB, "ojcowski") * 7)} dni · rodzicielski {weeksOf(segB, "rodzicielski")} tyg.
                  </p>
                </div>
              )}
            </div>
          </Panel>
          {plan.errors.map((e) => <ToneBox key={e} tone="danger" title={e} />)}
          {plan.todos.length > 0 && (
            <ToneBox tone="info" title="Czego jeszcze nie liczymy">
              <ul className="list-disc pl-4">{plan.todos.map((t) => <li key={t}>{t}</li>)}</ul>
            </ToneBox>
          )}
        </aside>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { usePersona } from "@/components/kr/persona-provider";
import { PageHeader, Panel } from "@/components/kr/ui";
import { cn } from "@/lib/utils";
import { getParams } from "@/lib/engine/params";

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

/**
 * Ekran 6 — Kalkulator (scenariusze b–f, j). Skeleton: inputs + split of the pool from params.
 * Amounts will be wired to lib/engine in step 3.
 */
export default function CalculatorPage() {
  const { persona } = usePersona();
  const params = getParams();
  const [children, setChildren] = useState<"1" | "2+">("1");
  const [variant, setVariant] = useState<"81.5" | "100-70">("81.5");
  const [zaZyciem, setZaZyciem] = useState(false);
  const [halfTime, setHalfTime] = useState(false);
  const [adoption, setAdoption] = useState(persona.event === "adopcja");
  const pool = children === "1" ? params.parental.poolWeeks : params.parental.poolWeeksMultiple;
  const min = params.parental.nonTransferableWeeksPerParent;
  const [partnerWeeks, setPartnerWeeks] = useState(min);
  const nameA = persona.a.name;
  const nameB = persona.b?.name ?? "Drugi rodzic";

  return (
    <div>
      <PageHeader title="Kalkulator" subtitle="Zmieniaj opcje i od razu zobacz skutki" />
      <div className="grid gap-4 lg:grid-cols-[1fr_340px] lg:gap-6">
        <div className="space-y-4">
          <Panel>
            <h2 className="kr-card-title">Dzieci</h2>
            <div className="divide-y divide-kr-border">
              <Row label="Liczba dzieci przy porodzie">
                <Segmented value={children} onChange={setChildren} options={[{ v: "1", l: "Jedno" }, { v: "2+", l: "Dwoje lub więcej" }]} />
              </Row>
              <Row label="Zaświadczenie „Za życiem”" hint="Dłuższy urlop rodzicielski">
                <Switch checked={zaZyciem} onCheckedChange={setZaZyciem} />
              </Row>
              <Row label="Adopcja lub rodzina zastępcza" hint="Urlop na warunkach macierzyńskiego">
                <Switch checked={adoption} onCheckedChange={setAdoption} />
              </Row>
            </div>
          </Panel>

          <Panel>
            <h2 className="kr-card-title">Podział urlopu rodzicielskiego</h2>
            <p className="kr-small text-kr-text-2">Pula {pool} tyg., po {min} tyg. nieprzenoszalnych dla każdego rodzica.</p>
            <div className="py-6">
              <Slider value={[partnerWeeks]} min={min} max={pool - min} step={1} onValueChange={(v) => setPartnerWeeks(v[0])} aria-label={`Tygodnie: ${nameB}`} />
              <div className="mt-3 flex justify-between kr-small font-semibold">
                <span className="text-kr-primary-dark">{nameA}: {pool - partnerWeeks} tyg.</span>
                <span className="text-kr-partner">{nameB}: {partnerWeeks} tyg.</span>
              </div>
            </div>
          </Panel>

          <Panel>
            <h2 className="kr-card-title">Wariant i praca</h2>
            <div className="divide-y divide-kr-border">
              <Row label="Wariant wypłaty" hint="81,5% wymaga wniosku do 21 dni po porodzie">
                <Segmented value={variant} onChange={setVariant} options={[{ v: "81.5", l: "81,5% cały okres" }, { v: "100-70", l: "100% + 70%" }]} />
              </Row>
              <Row label="Praca na ½ etatu w czasie rodzicielskiego" hint="Urlop wydłuża się proporcjonalnie">
                <Switch checked={halfTime} onCheckedChange={setHalfTime} />
              </Row>
            </div>
          </Panel>
        </div>

        <aside className="lg:sticky lg:top-10 lg:self-start">
          <Panel className="border-kr-primary/30">
            <p className="kr-caption text-kr-text-2">Wynik scenariusza</p>
            <div className="mt-3 space-y-3">
              <div>
                <p className="kr-small text-kr-text-2">{nameA} · rodzicielski</p>
                <p className="font-heading text-2xl font-extrabold text-kr-primary-dark tabular">{pool - partnerWeeks} tyg.</p>
              </div>
              <div>
                <p className="kr-small text-kr-text-2">{nameB} · rodzicielski</p>
                <p className="font-heading text-2xl font-extrabold text-kr-partner tabular">{partnerWeeks} tyg.</p>
              </div>
              <p className="rounded-xl bg-muted px-3 py-2 kr-small text-kr-text-2">
                Kwoty dla tego scenariusza policzy silnik reguł (krok 3).
                {zaZyciem && " „Za życiem”: długość puli do potwierdzenia z ZUS."}
              </p>
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

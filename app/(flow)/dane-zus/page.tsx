"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FlowShell } from "@/components/kr/flow-shell";
import { usePersona } from "@/components/kr/persona-provider";
import { Field, Panel, SymulacjaBadge, ToneBox } from "@/components/kr/ui";
import { formatDateShort, formatPLN, formatPLN2, TITLE_LABEL } from "@/lib/format";
import type { ParentData } from "@/lib/personas/types";

function EditBtn() {
  return (
    <Button variant="ghost" size="sm" className="text-kr-primary-dark">
      <Pencil aria-hidden /> Popraw
    </Button>
  );
}

function ParentCards({ d }: { d: ParentData }) {
  return (
    <div className="space-y-4">
      <Panel>
        <h2 className="kr-card-title">Ubezpieczenie — {d.name}</h2>
        <div className="divide-y divide-kr-border">
          {d.periods.map((p, i) => (
            <div key={i}>
              <Field label="Tytuł ubezpieczenia" value={`${TITLE_LABEL[p.title]} · ${p.payerName}`} source="zus" action={<EditBtn />} />
              <Field
                label="Okres"
                value={`od ${formatDateShort(p.from)}${p.to ? ` do ${formatDateShort(p.to)}` : " — trwa"}`}
                source="zus"
                action={<EditBtn />}
              />
              <Field
                label="Ubezpieczenie chorobowe"
                value={p.sicknessInsurance === "obowiazkowe" ? "Obowiązkowe" : p.sicknessInsurance === "dobrowolne" ? "Dobrowolne" : "Brak"}
                source="zus"
              />
              {p.payerInsuredCount !== undefined && (
                <Field label="Ubezpieczonych u płatnika (30.11 ub.r.)" value={p.payerInsuredCount} source="zus" />
              )}
            </div>
          ))}
          <Field label="Przeciętna podstawa wymiaru (12 mies.)" value={formatPLN(d.avgMonthlyBase)} source="zus" action={<EditBtn />} />
        </div>
      </Panel>

      <Panel>
        <div className="flex items-center justify-between">
          <h2 className="kr-card-title">Zwolnienia e-ZLA</h2>
          <SymulacjaBadge />
        </div>
        {d.ezla.length === 0 ? (
          <p className="mt-2 kr-small text-kr-text-2">Brak zwolnień w ostatnich 12 miesiącach.</p>
        ) : (
          <ul className="mt-2 divide-y divide-kr-border">
            {d.ezla.map((z) => (
              <li key={z.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">
                    {formatDateShort(z.from)} – {formatDateShort(z.to)}
                  </p>
                  <p className="kr-small text-kr-text-2">{z.issuer}</p>
                </div>
                <span className="rounded-full bg-kr-tint px-2 py-0.5 kr-caption text-kr-primary-dark">kod {z.code}{z.code === "B" ? " · ciąża" : ""}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel>
        <div className="flex items-center justify-between">
          <h2 className="kr-card-title">Zaświadczenie o niezaleganiu</h2>
          <SymulacjaBadge />
        </div>
        {d.contributionDebt > 0 ? (
          <ToneBox tone="danger" title={`Zaległość w składkach: ${formatPLN2(d.contributionDebt)}`} className="mt-3">
            Stan na dzień pobrania danych. Zobacz, co zrobić, w zakładce Ryzyka.
          </ToneBox>
        ) : (
          <ToneBox tone="success" title="Brak zaległości w składkach" className="mt-3" />
        )}
      </Panel>
    </div>
  );
}

/** Ekran 3 — Twoje dane z ZUS. */
export default function ZusDataPage() {
  const { persona } = usePersona();
  return (
    <FlowShell right={<SymulacjaBadge />}>
      <h1 className="kr-h1">Twoje dane z ZUS</h1>
      <p className="mt-2 mb-6 text-kr-text-2">Sprawdź, czy wszystko się zgadza. Każde pole ma oznaczone źródło.</p>
      <div className="space-y-8">
        <ParentCards d={persona.a} />
        {persona.b && <ParentCards d={persona.b} />}
      </div>
      <div className="pt-8">
        <Button asChild size="lg" className="h-14 w-full rounded-2xl text-base">
          <Link href="/pytania">Dane się zgadzają</Link>
        </Button>
      </div>
    </FlowShell>
  );
}

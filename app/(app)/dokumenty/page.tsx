"use client";

import { useEffect, useState } from "react";
import { BookOpen, Building2, ExternalLink, FileSignature, Gavel, Landmark, ScrollText } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { usePlan } from "@/components/kr/use-plan";
import { FormDownload } from "@/components/kr/form-download";
import { SimAction } from "@/components/kr/sim-action";
import { PageHeader, Panel, SymulacjaBadge } from "@/components/kr/ui";
import type { DocumentItem } from "@/lib/engine";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const WHERE_ICON = { pracodawca: Building2, ZUS: Landmark, "USC / gov.pl": ScrollText, "sąd": Gavel } as const;

function DocumentRow({ d, storageKey, parentName }: { d: DocumentItem; storageKey: string; parentName?: string }) {
  const [done, setDone] = useState(false);
  const Icon = WHERE_ICON[d.where];

  useEffect(() => {
    function restore() {
      try {
        setDone(localStorage.getItem(storageKey) === "1");
      } catch {
        // Storage can be disabled in private browsing.
      }
    }
    function onStorage(event: StorageEvent) {
      if (event.key === storageKey || event.key === null) restore();
    }
    restore();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [storageKey]);

  function toggle(checked: boolean) {
    setDone(checked);
    try {
      if (checked) localStorage.setItem(storageKey, "1");
      else localStorage.removeItem(storageKey);
    } catch {
      // Keep the checkbox usable for this visit.
    }
  }

  return (
    <li className="flex gap-3 py-4">
      <Checkbox
        checked={done}
        onCheckedChange={(value) => toggle(value === true)}
        className="mt-1"
        aria-label={`Oznacz jako zrobione: ${d.what}`}
      />
      <div className="flex-1">
        <p className={cn("font-medium", done && "text-kr-text-2 line-through")}>
          {d.what} {d.form && <span className="ml-1 rounded bg-muted px-1.5 py-0.5 kr-caption">{d.form}</span>}
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 kr-small text-kr-text-2">
          <span className="inline-flex items-center gap-1"><Icon className="size-4" aria-hidden /> {d.where}</span>
          <span>{d.deadline ? <>do <b className="font-semibold text-kr-text">{formatDate(d.deadline)}</b> · {d.deadlineText}</> : d.deadlineText}</span>
          {parentName && <span className="rounded-full bg-muted px-2 py-0.5 kr-caption text-kr-text">{parentName}</span>}
        </p>
        <p className="mt-1 inline-flex items-center gap-1 kr-caption font-normal text-kr-text-2">
          <BookOpen className="size-3.5" aria-hidden /> {d.rule}
        </p>
      </div>
    </li>
  );
}

/** Ekran 9 — Dokumenty i wnioski. */
export default function DocumentsPage() {
  const { persona, plan } = usePlan();
  const docs = plan.documents;
  const variantLabel = plan.variantApplied === "81.5" ? "81,5%" : "100% + 70%";
  const name = (who: "A" | "B") => (who === "A" ? persona.a.name : persona.b?.name ?? "");

  return (
    <div>
      <PageHeader title="Dokumenty i wnioski" subtitle="Co, dokąd i do kiedy" />
      <div className="grid gap-4 lg:grid-cols-[1fr_340px] lg:gap-6">
        <Panel>
          <h2 className="kr-card-title mb-2">Twoja lista</h2>
          {docs.length === 0 && (
            <p className="kr-small text-kr-text-2">Brak wniosków do złożenia — w Twojej sytuacji zasiłek nie przysługuje. Zobacz zakładkę Ryzyka.</p>
          )}
          <ul className="divide-y divide-kr-border">
            {docs.map((d) => (
              <DocumentRow
                key={`${persona.id}.${d.id}`}
                storageKey={`kr.documents.${persona.id}.${d.id}`}
                d={d}
                parentName={persona.b ? name(d.parent) : undefined}
              />
            ))}
          </ul>
        </Panel>

        <aside className="space-y-4">
          <Panel>
            <div className="flex items-center justify-between">
              <h2 className="kr-card-title">Wypełnij wniosek</h2>
              <SymulacjaBadge />
            </div>
            <p className="mt-1 kr-small text-kr-text-2">Dane uzupełnimy z Twojego planu. Od 24.10.2026 obowiązuje formularz ZAM.</p>
            <div className="mt-4 grid gap-2">
              <SimAction
                label={<><FileSignature aria-hidden /> Wniosek ZAM do ZUS</>}
                title="Wniosek ZAM"
                description="Sprawdź podgląd i wyślij przez PUE/eZUS."
                done="Wniosek ZAM trafił do ZUS. Potwierdzenie znajdziesz w PUE/eZUS."
              >
                <dl className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-3 kr-small">
                  <dt className="text-kr-text-2">Wnioskodawca</dt><dd>{persona.a.name}</dd>
                  <dt className="text-kr-text-2">Świadczenie</dt><dd>Zasiłek macierzyński</dd>
                  <dt className="text-kr-text-2">Wariant</dt><dd>{variantLabel}</dd>
                </dl>
              </SimAction>
              <FormDownload kind="zam" persona={persona} plan={plan} />
              <SimAction
                variant="outline"
                label={<><Building2 aria-hidden /> Wniosek o urlop do pracodawcy</>}
                title="Wniosek o urlop macierzyński i rodzicielski"
                description="Jeden wniosek na oba urlopy. Wyślemy go do działu kadr."
                done="Wniosek trafił do pracodawcy."
              />
              <FormDownload kind="employer" persona={persona} plan={plan} />
            </div>
          </Panel>
          <Panel>
            <div className="flex items-center justify-between">
              <h2 className="kr-card-title">Odpis aktu urodzenia</h2>
              <SymulacjaBadge />
            </div>
            <p className="mt-1 kr-small text-kr-text-2">Pełny lub skrócony — wniosek online w gov.pl.</p>
            <div className="mt-4 grid gap-2">
              <SimAction variant="outline" label="Zamów odpis skrócony" title="Wniosek o odpis aktu urodzenia" description="Odpis skrócony, wysyłka elektroniczna." done="Wniosek złożony. Odpis otrzymasz w skrzynce gov.pl." />
              <a href="https://www.gov.pl/web/gov/uzyskaj-odpis-aktu-urodzenia" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-1 kr-small font-medium text-kr-primary hover:underline">
                Usługa na gov.pl <ExternalLink className="size-3.5" aria-hidden />
              </a>
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

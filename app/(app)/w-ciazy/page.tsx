import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Building2, Landmark } from "lucide-react";
import { PageHeader, Panel, ToneBox } from "@/components/kr/ui";
import { getParams } from "@/lib/engine";

export const metadata: Metadata = { title: "W ciąży" };

/**
 * Wymaganie (a): świadczenia w czasie ciąży — także gdy prawa NIE ma.
 * Źródła: Załącznik ZUS, ustawa zasiłkowa (art. 4, 7, 8, 11, 18, 19, 30), Kodeks pracy (art. 92).
 */
export default function PregnancyPage() {
  const p = getParams();
  const items = [
    {
      icon: Building2,
      who: "Pracodawca",
      title: "Wynagrodzenie chorobowe",
      body: `Pracownica w ciąży na zwolnieniu lekarskim dostaje 100% wynagrodzenia od pracodawcy przez pierwsze ${p.sickness.employerPaidDaysPerYear} dni niezdolności w roku kalendarzowym (${p.sickness.employerPaidDaysPerYearOver50} dni po ukończeniu 50 lat). Potem zasiłek chorobowy wypłaca ZUS albo płatnik.`,
      rule: "Kodeks pracy art. 92 · Załącznik ZUS",
    },
    {
      icon: Landmark,
      who: "ZUS lub płatnik",
      title: "Zasiłek chorobowy w ciąży",
      body: `100% podstawy wymiaru, jeśli na zwolnieniu (e-ZLA) jest kod „B” — ciąża. Przysługuje najdłużej ${p.sickness.maxDays} dni. Prawo powstaje po ${p.eligibility.waitingDaysMandatory} dniach nieprzerwanego ubezpieczenia obowiązkowego albo po ${p.eligibility.waitingDaysVoluntary} dniach dobrowolnego (zlecenie, działalność); osoby, które nie są pracownikami, dostają zasiłek od pierwszego dnia zwolnienia.`,
      rule: "art. 4, 8 i 11 ustawy zasiłkowej",
    },
    {
      icon: Landmark,
      who: "ZUS",
      title: "Zasiłek po ustaniu ubezpieczenia",
      body: `Jeśli niezdolność do pracy w ciąży zaczęła się najpóźniej 14 dni po ustaniu ubezpieczenia, ZUS może wypłacać zasiłek chorobowy także po jego ustaniu — w ciąży do ${p.sickness.maxDays} dni.`,
      rule: "art. 7 i 8 ustawy zasiłkowej · Załącznik ZUS",
    },
    {
      icon: Landmark,
      who: "ZUS",
      title: "Zasiłek w wysokości zasiłku macierzyńskiego",
      body: "100% podstawy do dnia porodu, jeśli w czasie ciąży umowa o pracę wygasła z powodu śmierci pracodawcy albo została rozwiązana z powodu upadłości lub likwidacji pracodawcy, a nie zapewniono innego zatrudnienia. Prawo do zasiłku macierzyńskiego zostaje też wtedy, gdy rozwiązanie umowy z naruszeniem prawa potwierdził sąd.",
      rule: "art. 30 ustawy zasiłkowej",
    },
    {
      icon: Landmark,
      who: "ZUS",
      title: "Świadczenie rehabilitacyjne",
      body: "Po wyczerpaniu zasiłku chorobowego, gdy nadal nie możesz pracować, a leczenie rokuje powrót do pracy — najdłużej 12 miesięcy. Jeśli niezdolność przypada w ciąży, wynosi 100% podstawy. O prawie orzeka lekarz orzecznik ZUS.",
      rule: "art. 18 i 19 ustawy zasiłkowej",
    },
  ];

  return (
    <div className="max-w-3xl">
      <PageHeader title="W ciąży" subtitle="Jakie świadczenia przysługują przed porodem — i kiedy ich nie ma" back="/pomoc" />
      <div className="space-y-4">
        {items.map((it) => (
          <Panel as="article" key={it.title}>
            <div className="flex gap-3">
              <it.icon className="mt-0.5 size-5 shrink-0 text-kr-primary" aria-hidden />
              <div>
                <p className="kr-caption text-kr-text-2">{it.who}</p>
                <h2 className="kr-card-title">{it.title}</h2>
                <p className="mt-1 kr-small text-kr-text">{it.body}</p>
                <p className="mt-2 inline-flex items-center gap-1 kr-caption font-normal text-kr-text-2">
                  <BookOpen className="size-3.5" aria-hidden /> {it.rule}
                </p>
              </div>
            </div>
          </Panel>
        ))}

        <ToneBox tone="warning" title="Kiedy prawa nie ma">
          <ul className="list-disc space-y-1 pl-4">
            <li>Brak ubezpieczenia chorobowego (np. zlecenie bez dobrowolnego chorobowego) — nie ma zasiłku chorobowego ani macierzyńskiego.</li>
            <li>Nie minął okres wyczekiwania ({p.eligibility.waitingDaysMandatory} / {p.eligibility.waitingDaysVoluntary} dni) — zasiłek chorobowy przysługuje dopiero po nim.</li>
            <li>Działalność gospodarcza z zadłużeniem w składkach powyżej 1% minimalnego wynagrodzenia — zasiłki są wstrzymane do spłaty, a po 6 miesiącach prawo się przedawnia.</li>
          </ul>
          <Link href="/ryzyka" className="mt-2 inline-block font-medium text-kr-primary hover:underline">Sprawdź ryzyka w Twojej sytuacji</Link>
        </ToneBox>
        <p className="kr-small text-kr-text-2">To informacja, a nie decyzja ZUS.</p>
      </div>
    </div>
  );
}

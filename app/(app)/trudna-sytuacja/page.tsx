"use client";

import { useState } from "react";
import Link from "next/link";
import { getParams } from "@/lib/engine/params";
import { cn } from "@/lib/utils";

type Situation = "martwe" | "wczesniak" | "choroba" | "matka";

/**
 * Ekran 12 — Trudna sytuacja (tryb delikatny): muted palette, no animations,
 * no accent colour, minimum questions. Content from rules in the ZUS brief.
 */
export default function DelicatePage() {
  const p = getParams();
  const [s, setS] = useState<Situation | null>(null);
  const [pause, setPause] = useState(false);

  const CONTENT: Record<Situation, { label: string; rights: string[]; todo: string[]; help: string[] }> = {
    martwe: {
      label: "Dziecko urodziło się martwe lub zmarło",
      rights: [
        `Przysługuje Ci urlop i zasiłek macierzyński przez ${p.stillbirth.weeksAfterBirth} tygodni po porodzie, nie krócej niż ${p.stillbirth.minDaysAfterDeath} dni od śmierci dziecka.`,
        `Jeśli dziecko zmarło po ${p.stillbirth.weeksAfterBirth} tygodniach życia — ${p.stillbirth.daysIfDeathAfter8Weeks} dni od śmierci.`,
      ],
      todo: ["Wniosek złożysz u pracodawcy lub w ZUS (ZAM) — możesz to zrobić później albo poprosić bliską osobę."],
      help: ["Fundacja Rodzić po Ludzku", "Fundacja Gajusz"],
    },
    wczesniak: {
      label: "Wcześniak lub dziecko w szpitalu",
      rights: ["Uzupełniający urlop macierzyński — jednorazowo, bezpośrednio po urlopie macierzyńskim. Korzysta z niego tylko jeden z rodziców."],
      todo: ["Poproś szpital o zaświadczenie o pobycie dziecka.", "Złóż wniosek przed końcem urlopu macierzyńskiego."],
      help: ["Fundacja Wcześniak Rodzice–Rodzicom"],
    },
    choroba: {
      label: "Ciężka choroba dziecka („Za życiem”)",
      rights: ["Z zaświadczeniem „Za życiem” urlop rodzicielski jest dłuższy."],
      todo: ["Zachowaj zaświadczenie „Za życiem” — dołączysz je do wniosku."],
      help: ["Fundacja Gajusz", "Fundacja Dzieciom „Zdążyć z Pomocą”"],
    },
    matka: {
      label: "Matka jest w szpitalu lub zmarła",
      rights: ["Ojciec dziecka może przejąć urlop macierzyński także przed upływem 14 tygodni — m.in. gdy matka jest w szpitalu, ma orzeczenie o niezdolności do samodzielnej egzystencji, zmarła lub porzuciła dziecko."],
      todo: ["Ojciec składa wniosek u swojego pracodawcy lub w ZUS (ZAM)."],
      help: ["Ośrodek pomocy społecznej w Twojej gminie"],
    },
  };

  const c = s ? CONTENT[s] : null;

  return (
    <div className="-mx-4 -mt-6 min-h-dvh bg-kr-delicate-bg px-4 pt-6 sm:-mx-6 sm:px-6 lg:-mx-10 lg:-mt-10 lg:px-10 lg:pt-10 [&_*]:!transition-none">
      <div className="max-w-2xl">
        <h1 className="kr-h1">Jesteśmy tu, żeby pomóc</h1>
        <p className="mt-2 text-kr-text-2">Nie musisz załatwiać wszystkiego od razu. Wybierz, co Cię dotyczy — pokażemy tylko najważniejsze.</p>

        <div className="mt-6 grid gap-2">
          {(Object.keys(CONTENT) as Situation[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setS(k)}
              aria-pressed={s === k}
              className={cn("rounded-2xl border bg-white p-4 text-left", s === k ? "border-kr-delicate-btn" : "border-kr-border")}
            >
              {CONTENT[k].label}
            </button>
          ))}
        </div>

        {c && (
          <div className="mt-6 space-y-4">
            {[
              ["Co Ci przysługuje", c.rights],
              ["Co trzeba zrobić", c.todo],
              ["Kto może pomóc", c.help],
            ].map(([h, items]) => (
              <section key={h as string} className="rounded-2xl border border-kr-border bg-white p-5">
                <h2 className="kr-card-title">{h as string}</h2>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-kr-text">
                  {(items as string[]).map((t) => <li key={t}>{t}</li>)}
                </ul>
              </section>
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 pb-6 sm:flex-row">
          <button
            type="button"
            onClick={() => setPause(!pause)}
            className="h-12 rounded-xl bg-kr-delicate-btn px-5 font-medium text-white"
          >
            {pause ? "Przypomnienia wstrzymane" : "Wstrzymaj przypomnienia"}
          </button>
          <Link href="/pomoc" className="inline-flex h-12 items-center justify-center rounded-xl border border-kr-border bg-white px-5 font-medium">
            Wróć do Pomocy
          </Link>
        </div>
      </div>
    </div>
  );
}

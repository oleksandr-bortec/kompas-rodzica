"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, ExternalLink, HeartHandshake, MessageSquare } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { SimAction } from "@/components/kr/sim-action";
import { PageHeader, Panel, SymulacjaBadge } from "@/components/kr/ui";
import { cn } from "@/lib/utils";

const FAQ = [
  ["Czy mogę pracować na urlopie rodzicielskim?", "Tak, do połowy etatu. Urlop wydłuża się wtedy proporcjonalnie, a zasiłek przysługuje także za wydłużenie."],
  ["Kiedy wybrać 81,5%?", "Jeśli złożysz wniosek najpóźniej 21 dni po porodzie, dostaniesz 81,5% za cały okres macierzyńskiego i rodzicielskiego."],
  ["Kto wypłaca zasiłek?", "Płatnik, który zgłasza do ubezpieczenia chorobowego ponad 20 osób (stan na 30 listopada poprzedniego roku). W pozostałych przypadkach — ZUS."],
  ["Czy ojciec może wziąć część urlopu macierzyńskiego?", "Tak — po 14 tygodniach, jeśli matka zrezygnuje, a wcześniej w szczególnych sytuacjach (np. pobyt matki w szpitalu)."],
];

const ORG_FILTERS = ["Wszystkie", "Wcześniak", "Strata dziecka", "Choroba dziecka"] as const;
// TODO(team): zweryfikować listę organizacji i linki przed demo
const ORGS: { name: string; url: string; tags: (typeof ORG_FILTERS)[number][] }[] = [
  { name: "Fundacja Rodzić po Ludzku", url: "https://rodzicpoludzku.pl", tags: ["Strata dziecka"] },
  { name: "Fundacja Wcześniak Rodzice–Rodzicom", url: "https://wczesniak.pl", tags: ["Wcześniak"] },
  { name: "Fundacja Gajusz", url: "https://gajusz.org.pl", tags: ["Choroba dziecka", "Strata dziecka"] },
  { name: "Fundacja Dzieciom „Zdążyć z Pomocą”", url: "https://www.dzieciom.pl", tags: ["Choroba dziecka"] },
];

const LINKS = [
  ["ZUS — świadczenia dla rodziców", "https://www.zus.pl"],
  ["Ministerstwo Rodziny, Pracy i Polityki Społecznej", "https://www.gov.pl/web/rodzina"],
  ["Państwowa Inspekcja Pracy", "https://www.pip.gov.pl"],
];

/** Ekran 11 — Pomoc. */
export default function HelpPage() {
  const [filter, setFilter] = useState<(typeof ORG_FILTERS)[number]>("Wszystkie");
  const [q, setQ] = useState("");
  const orgs = ORGS.filter((o) => filter === "Wszystkie" || o.tags.includes(filter));

  return (
    <div>
      <PageHeader title="Pomoc" subtitle="Pytania, organizacje wsparcia i przydatne linki" />
      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <div className="space-y-4">
          <Link href="/trudna-sytuacja" className="block">
            <Panel className="flex items-center gap-4 bg-kr-delicate-bg transition-colors hover:border-kr-delicate-btn/40">
              <HeartHandshake className="size-6 shrink-0 text-kr-delicate-btn" aria-hidden />
              <div className="flex-1">
                <p className="kr-card-title">Trudna sytuacja</p>
                <p className="kr-small text-kr-text-2">Spokojnie przeprowadzimy Cię przez formalności.</p>
              </div>
              <ChevronRight className="size-5 text-kr-text-2" aria-hidden />
            </Panel>
          </Link>

          <Panel>
            <div className="flex items-center justify-between">
              <h2 className="kr-card-title">Zapytaj ZUS przez PUE/eZUS</h2>
              <SymulacjaBadge />
            </div>
            <Textarea value={q} onChange={(e) => setQ(e.target.value)} placeholder="Opisz swoje pytanie…" className="mt-3 min-h-24" />
            <div className="mt-3">
              <SimAction
                label={<><MessageSquare aria-hidden /> Wyślij pytanie</>}
                title="Pytanie do ZUS"
                description={q ? `„${q.slice(0, 120)}”` : "Wyślemy pytanie do Twojego konta w PUE/eZUS."}
                done="Pytanie trafiło do PUE/eZUS. Odpowiedź pojawi się w Twoich wiadomościach."
              />
            </div>
          </Panel>

          <Panel>
            <h2 className="kr-card-title mb-2">Częste pytania</h2>
            <div className="divide-y divide-kr-border">
              {FAQ.map(([qq, a]) => (
                <details key={qq} className="group py-3">
                  <summary className="cursor-pointer list-none font-medium marker:hidden">
                    <span className="flex items-center justify-between gap-2">
                      {qq} <ChevronRight className="size-4 shrink-0 transition-transform group-open:rotate-90" aria-hidden />
                    </span>
                  </summary>
                  <p className="mt-2 kr-small text-kr-text-2">{a}</p>
                </details>
              ))}
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel>
            <h2 className="kr-card-title">Organizacje wsparcia</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {ORG_FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  aria-pressed={filter === f}
                  className={cn("rounded-full border px-3 py-1 kr-small", filter === f ? "border-kr-primary bg-kr-tint text-kr-primary-dark" : "border-kr-border")}
                >
                  {f}
                </button>
              ))}
            </div>
            <ul className="mt-3 divide-y divide-kr-border">
              {orgs.map((o) => (
                <li key={o.name}>
                  <a href={o.url} target="_blank" rel="noreferrer" className="flex items-center justify-between py-3 hover:text-kr-primary">
                    <span>
                      <span className="block font-medium">{o.name}</span>
                      <span className="kr-small text-kr-text-2">{o.tags.join(" · ")}</span>
                    </span>
                    <ExternalLink className="size-4 text-kr-text-2" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel>
            <h2 className="kr-card-title mb-1">Przydatne linki</h2>
            <ul className="divide-y divide-kr-border">
              {LINKS.map(([l, u]) => (
                <li key={u}>
                  <a href={u} target="_blank" rel="noreferrer" className="flex items-center justify-between py-3 hover:text-kr-primary">
                    {l} <ExternalLink className="size-4 text-kr-text-2" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

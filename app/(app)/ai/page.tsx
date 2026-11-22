import { Check, X } from "lucide-react";
import { PageHeader, Panel } from "@/components/kr/ui";

const DOES = [
  ["Czyta dokumenty", "Rozpoznaje typ formularza (ZAM, Z-3, Z-3a, ZAS-53, zaświadczenia, także stare ZUR/ZAO/Z-3b) i wypełnia pola. Każde pole ma poziom pewności — Ty je potwierdzasz."],
  ["Wyjaśnia plan prostym językiem — po polsku, ukraińsku lub angielsku", "„Wyjaśnij mi to” na ekranie „Dlaczego tyle?”. AI dostaje tylko fakty bez liczb i pisze w miejscu kwot i dat znaczniki, np. {kwota}; liczby wstawia silnik reguł. Tekst z jakąkolwiek własną cyfrą AI jest odrzucany."],
];
const DOESNT = [
  "Nie liczy kwot, okresów ani terminów — robi to przejrzysty silnik reguł, sprawdzony testami.",
  "Nie wydaje decyzji zamiast ZUS — wynik to informacja, a nie decyzja.",
  "Nie widzi numeru PESEL ani imion — identyfikatory są maskowane przed wysłaniem.",
  "Nie odpowiada spoza materiałów ZUS — mówi „nie wiem” i proponuje pytanie przez PUE/eZUS.",
];

/** Strona „AI w aplikacji" (wymóg wyzwania: lista funkcji AI). */
export default function AiPage() {
  return (
    <div className="max-w-2xl">
      <PageHeader title="AI w aplikacji" subtitle="AI rozumie i tłumaczy — silnik reguł liczy." back="/profil" />
      <Panel>
        <h2 className="kr-card-title mb-2">Co robi AI</h2>
        <ul className="space-y-3">
          {DOES.map(([t, d]) => (
            <li key={t} className="flex gap-3">
              <Check className="mt-0.5 size-5 shrink-0 text-kr-success" aria-hidden />
              <div><p className="font-medium">{t}</p><p className="kr-small text-kr-text-2">{d}</p></div>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel className="mt-4">
        <h2 className="kr-card-title mb-2">Czego AI nie robi</h2>
        <ul className="space-y-3">
          {DOESNT.map((t) => (
            <li key={t} className="flex gap-3">
              <X className="mt-0.5 size-5 shrink-0 text-kr-danger" aria-hidden />
              <p className="kr-small">{t}</p>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

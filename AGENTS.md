# AGENTS.md — Kompas Rodzica

Instrukcje dla asystentów AI i członków zespołu. Czytaj przed każdą zmianą.

Projekt: **Kompas Rodzica** — HackNation 2026, wyzwanie ZUS „Zasiłkowy Przewodnik
Przyszłego Rodzica". Mobile-first aplikacja webowa (RWD/PWA, **nie** natywna), która w
3 minuty pokazuje przyszłym rodzicom osobisty plan: prawo do zasiłku, kto wypłaca
(pracodawca czy ZUS), kwoty i okresy dla obojga rodziców, podział urlopów, terminy,
dokumenty i gdzie je złożyć, ryzyka.

Koniec pracy: **niedziela 22.11.2026, 11:00 (Warszawa)**. Priorytet: działający, prosty
produkt > idealny kod. Zamrożenie funkcji o 07:00.

## Złote zasady

1. **AI nigdy nie liczy pieniędzy, okresów ani terminów.** Wszystko liczy
   deterministyczny silnik reguł w `lib/engine/` (czysty TypeScript, bez UI, testy
   Vitest). AI tylko czyta dokumenty (PDF → JSON wg schematu Zod) i wyjaśnia wynik;
   w tekstach AI liczby są placeholderami (`{kwota_miesieczna}`), wstawia je aplikacja.
2. **Parametry** (100/70/81,5%, 20 tygodni, 41/43, 9 tygodni, 14 dni, 30/90 dni, 21 dni,
   >20 ubezpieczonych…) żyją w JSON w `lib/engine/params/` z datą wejścia w życie
   (`effectiveFrom`). Nigdy w komponentach. Edytuje je panel `/admin`.
3. **Nie zgadujemy reguł.** Jeśli reguły lub wzoru (np. podstawy wymiaru) nie ma w
   materiałach ZUS — zostaw `// TODO(ZUS): …` i zapytaj zespół. Lepiej brak wyniku
   z wyjaśnieniem niż błędna kwota.
4. **Nigdy nie commituj** przykładowych spraw ZUS (`zus-samples/`, `*.zus.pdf` są w
   `.gitignore`) ani kluczy API (`.env*`). Klucze tylko w zmiennych środowiskowych
   serwera.
5. **Każda imitacja** (mObywatel, dane ZUS, e-ZLA, PUE/eZUS, zaświadczenie o
   niezaleganiu, akt urodzenia, wysyłka wniosków) ma widoczny badge **„Symulacja"**.
6. Wynik to **informacja, a nie decyzja ZUS** — pokazuj to w UI.
7. Formy: od 24.10.2026 ZUR i ZAO połączono w **ZAM**, Z-3b zniesiono. Rozpoznajemy
   stare formy w próbkach, generujemy tylko ZAM.

## Język

- Interfejs: **polski**, na „Ty", prosto; terminy ZUS z podpowiedzią
  (płatnik, ubezpieczony, świadczeniobiorca). Neutralnie płciowo dla obojga rodziców.
- Kod, nazwy plików, identyfikatory: angielski. Komentarze: PL lub EN.
- Komunikacja z zespołem: ukraiński.

## Stos

Next.js 15 (App Router) + TypeScript · Tailwind v4 · shadcn/ui (radix) · lucide-react ·
React Hook Form + Zod · REST przez Route Handlers (`app/api/*`) · Vercel AI SDK (`ai`) ·
pdf-parse · Recharts · Vitest · deploy na Vercel.

## Struktura

```
app/
  page.tsx                 # Powitanie
  (app)/                   # ekrany z nawigacją (dolna na telefonie, boczna na PC)
    plan, kalkulator, dokumenty, pomoc, profil, …
  admin/                   # panel parametrów
  api/                     # REST: eligibility, calculate, cases/extract, params
components/
  ui/                      # shadcn
  layout/                  # nawigacja, shell
lib/
  engine/                  # silnik reguł (bez React!)
    params/                # JSON z effectiveFrom
  ai/                      # rozpoznawanie dokumentów i wyjaśnienia
  mocks/                   # imitacje: mobywatel, zus, ezla, pue, usc
  personas/                # dane demo: Ania, Kasia, Ola, Ewa i Marek
tests/cases/               # testy na sprawach ZUS (same dokumenty poza repo)
docs/                      # opis, ai-usage.md, OpenAPI, lista bibliotek
```

## Reguły z materiałów (podsumowanie)

| Reguła | Treść |
|---|---|
| Prawo do zasiłku chorobowego | ubezp. obowiązkowe: po 30 dniach nieprzerwanego ubezpieczenia; dobrowolne (zlecenie, JDG): po 90 dniach |
| Kto płaci pierwsze dni choroby | pracownik: pracodawca 33 dni/rok (14 po 50 r.ż.), potem zasiłek; nie-pracownik: zasiłek od 1. dnia |
| Zasiłek chorobowy w ciąży | 100% podstawy przy kodzie „B" w e-ZLA; max 270 dni |
| Zasiłek w wys. zasiłku macierzyńskiego | 100% podstawy do porodu, gdy utrata pracy przez upadłość/likwidację/śmierć pracodawcy lub bezprawne zwolnienie potwierdzone sądem |
| Urlop macierzyński | 20 tyg. przy 1 dziecku; do 6 tyg. przed porodem; pierwsze 14 tyg. po porodzie — tylko matka |
| Urlop rodzicielski | pula 41 lub 43 tyg.; po 9 tyg. nieprzenoszalnych na każdego rodzica; do 5 części; do końca roku, w którym dziecko kończy 6 lat; „Za życiem" — dłuższy |
| Urlop ojcowski | 14 dni jednorazowo lub 2×7; do 12 mies. życia dziecka; przy adopcji 12 mies. od uprawomocnienia, max do 14 lat dziecka |
| Uzupełniający urlop macierzyński | wcześniak / dziecko w szpitalu; jednorazowo, bezpośrednio po macierzyńskim; tylko jeden rodzic |
| Ojciec bierze część macierzyńskiego | po 14 tyg., gdy matka zrezygnuje; wcześniej — szpital matki, niezdolność do samodzielnej egzystencji, śmierć, porzucenie dziecka |
| Martwe urodzenie / śmierć do 8 tyg. | 8 tyg. po porodzie, nie mniej niż 7 dni od śmierci; śmierć po 8 tyg. — 7 dni |
| Adopcja / rodzina zastępcza | urlop na warunkach macierzyńskiego: rodzina zastępcza do 7 lat dziecka (10 przy odroczonej szkole), adopcja do 14; potem rodzicielski |
| Praca w czasie rodzicielskiego | do ½ etatu; urlop wydłuża się proporcjonalnie; zasiłek także za wydłużenie |
| Procenty | 100%: macierzyński, na warunkach macierzyńskiego, uzupełniający, ojcowski; 70%: rodzicielski; 81,5% za cały okres, jeśli matka złoży wniosek ≤ 21 dni po porodzie |
| Kto wypłaca | płatnik zgłaszający > 20 ubezpieczonych do ubezp. chorobowego (stan na 30 listopada roku poprzedniego); inaczej ZUS |
| Dokumenty | pracownica: wniosek do pracodawcy (jeden na macierzyński i rodzicielski); nie-pracownica: ZAM do ZUS; zlecenie: ZAM, płatnik wysyła Z-3a; JDG na zwolnieniu: ZAS-53 |
| Ryzyka | fikcyjna umowa / JDG dla ubezpieczenia; podwyższenie podstawy w ciąży; brak ubezp. chorobowego w dniu porodu |
| Ochrona (Kodeks pracy) | zakaz zwolnienia w ciąży i na urlopach; umowa terminowa kończąca się po 3. miesiącu ciąży przedłużona do porodu; nie dotyczy JDG |

**Uzupełnione z materiałów ZUS** (`zus-samples/materialy`, poza repo): długości macierzyńskiego
20/31/33/35/37 tyg. (tak samo przy adopcji, min. 9 tyg.), rodzicielski „Za życiem” 65/67 tyg.,
uzupełniający (1 tydz. za tydz. szpitala, limit 8 / 15 tyg.), 81,5% bez 9 tyg. drugiego rodzica (70%),
podstawa = średnia z 12 mies. − 13,71% (min. pełny etat: 4 806 zł − 13,71%; max dobrowolne: 20 321,30 zł),
zadłużenie JDG > 1% minimalnego wynagrodzenia blokuje zasiłek do spłaty (art. 2a), przerwy ≤ 30 dni
nie przerywają okresu wyczekiwania (art. 4 ust. 2), zasiłek macierzyński bez okresu wyczekiwania (art. 29),
kwoty brutto, zaokrąglenie do grosza w górę od połowy.

**Nadal brak / do zrobienia:** kwota świadczenia rodzicielskiego (minimum zasiłku, art. 31 ust. 3a),
stawka dzienna dla niepełnych miesięcy (do potwierdzenia na decyzjach), uzupełnianie niepełnych miesięcy
w podstawie. (Obniżenie zasiłku przy pracy w czasie rodzicielskiego — art. 31 ust. 4a — już w silniku.)

**Próbki spraw ZUS:** `zus-samples/sprawy/` (skany, poza repo). Testy na nich tylko w
`tests/cases/zus/` (też w `.gitignore`) — nigdy nie przepisuj danych spraw do commitowanych plików.

## Persony demo

| Persona | Sytuacja | Gałąź reguł |
|---|---|---|
| Ania, 29 + Tomek | umowa o pracę, duża firma (>20 ubezp.), Tomek też na UoP | płaci pracodawca; podział urlopów; 81,5% vs 100%+70% |
| Kasia, 33 | JDG, dobrowolne chorobowe, zaległość w składkach | 90 dni; zaległość; ZAM do ZUS |
| Ola, 26 | umowa zlecenie kończy się przed porodem | brak ubezp. w dniu porodu → ryzyko utraty prawa |
| Ewa i Marek | adopcja 3-letniego dziecka | urlop na warunkach macierzyńskiego, potem rodzicielski |

## Design („spokojny fintech")

Kolory (tokeny w `app/globals.css`, klasy `bg-kr-*`/`text-kr-*`): primary `#0E7C66`,
primary dark `#0A5546`, tint `#E3F2EE`, drugi rodzic `#5B5FC7`, akcent `#F08A5D`
(tylko z ciemnym tekstem), tło `#FAF8F5`, tekst `#1D2624` / `#5C6966`, ramki `#E5E2DC`;
success `#177245`, warning `#9A6412`, danger `#C2412D`, info `#2F6FB3`; tryb delikatny
tło `#F3F1F6`, przyciski `#5E6A85` (bez akcentu, bez animacji).

Fonty: **Manrope** (nagłówki, kwoty, `tabular-nums`) + **Inter** (tekst). Skala:
kwota 32/40 800, nagłówek ekranu 24/32 700, sekcja 20/28 700, karta 17/24 600,
tekst 16/24, pomocniczy 14/20, podpisy 12/16 600. Inputy ≥ 16 px.

Karty, dużo powietrza, siatka 8 px, zaokrąglenia 12–16 px, delikatne cienie. Jedna
główna akcja na ekran. Każde pole ma źródło („z ZUS", „wpisane przez Ciebie",
„z dokumentu (AI)"). W timeline nasycenie = procent: 100% pełny, 81,5% średni,
70% jasny + podpis. Nawigacja: telefon — dolny pasek Plan · Kalkulator · Dokumenty ·
Pomoc · Profil; PC — boczny, treść do 1100 px. Sprawdzaj na 360 px i laptopie.

## Komendy

```bash
npm run dev      # http://localhost:3000
npm test         # Vitest (silnik)
npm run build
```

## Workflow

- Nad repo pracuje kilku agentów AI (Claude Code, ChatGPT/Codex, …) i ludzie.
  Każdy agent pracuje na **własnej gałęzi** z prefiksem (`claude/…`, `codex/…`,
  `feat/…`), krótkie PR-y do `main`. Nigdy nie pushuj bezpośrednio do `main`
  i nie nadpisuj cudzej gałęzi. Przed pracą: `git pull` i przeczytaj ten plik.
- Jedna funkcja = jedna gałąź = jeden obszar plików; nie ruszaj plików, nad którymi
  pracuje inna gałąź, bez uzgodnienia.
- Wpis do `docs/ai-usage.md` przy pracy z AI (który agent, co zrobił).
- Przed commitem: `npm test` i `npm run lint` przechodzą.

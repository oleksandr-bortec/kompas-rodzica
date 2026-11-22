# Mapa wymagań wyzwania ZUS → Kompas Rodzica

Demo: **https://kompas-rodzica.vercel.app** · Kod: https://github.com/oleksandr-bortec/kompas-rodzica

Legenda: ✅ gotowe · 🟡 częściowo (opis w uwagach) · ⬜ brak

## Funkcje obowiązkowe (pkt 3 opisu wyzwania)

| Wymaganie | Gdzie w aplikacji | Status | Uwagi |
|---|---|---|---|
| **a)** Świadczenia w czasie ciąży: zasiłek chorobowy, świadczenie rehabilitacyjne, zasiłek w wysokości zasiłku macierzyńskiego — także gdy prawa nie ma | [/w-ciazy](https://kompas-rodzica.vercel.app/w-ciazy) (z Pomocy) | ✅ | Treść z ustawy zasiłkowej (art. 4, 7, 8, 11, 18, 19, 30) i Kodeksu pracy (art. 92); sekcja „Kiedy prawa nie ma” |
| **b)** Kalkulator zasiłku macierzyńskiego dla obojga rodziców (liczba i wiek dzieci, „Za życiem”) | [/kalkulator](https://kompas-rodzica.vercel.app/kalkulator), [/plan](https://kompas-rodzica.vercel.app/plan) | ✅ | 20/31/33/35/37 tyg., pula 41/43, „Za życiem” 65/67 (Załącznik ZUS) |
| **c)** Łączenie pracy z urlopem rodzicielskim | /kalkulator → „praca na ½ etatu” | ✅ | Urlop wydłuża się proporcjonalnie, zasiłek zmniejsza się proporcjonalnie (art. 31 ust. 4a) |
| **d)** Oboje rodzice korzystają z uprawnień | /kalkulator → suwak podziału, /plan → oś czasu dwóch rodziców | ✅ | 9 tyg. nieprzenoszalnych, walidacja podziału, ojcowski 14 dni |
| **e) / j)** Adopcja i rodzina zastępcza | /kalkulator → „Adopcja / Rodzina zastępcza”, persona Ewa i Marek, /dane-reczne | ✅ | Limit wieku 14 / 7 (10) lat, urlop na warunkach macierzyńskiego 20–37 tyg. (min. 9) |
| **f)** Indywidualna podstawa wymiaru na przykładzie sprawy | [/sprawdz-sprawe](https://kompas-rodzica.vercel.app/sprawdz-sprawe), `lib/engine/base.ts` | 🟡 | Podstawa = średnia z 12 mies. − 13,71%, minimum i maksimum z Załącznika; odczyt PDF przez AI wymaga `ANTHROPIC_API_KEY` (bez klucza — przykładowe sprawy) |
| **g)** Dokumenty, terminy, sposób złożenia; kto wypłaca | [/dokumenty](https://kompas-rodzica.vercel.app/dokumenty), karta „Następny krok” | ✅ | Lista z silnika: wniosek do pracodawcy / ZAM do ZUS, Z-3, Z-3a, ZAS-53, terminy z Kodeksu pracy; płatnik > 20 ubezpieczonych |
| **h)** Ryzyka utraty prawa lub niższej kwoty | [/ryzyka](https://kompas-rodzica.vercel.app/ryzyka) | ✅ | Brak ubezpieczenia w dniu porodu, zadłużenie (art. 2a), termin 21 dni, podwyższenie podstawy, brak ochrony KP przy zleceniu/JDG |
| **i)** Organizacje pomocowe w szczególnych sytuacjach | [/pomoc](https://kompas-rodzica.vercel.app/pomoc), [/trudna-sytuacja](https://kompas-rodzica.vercel.app/trudna-sytuacja) | 🟡 | Tryb delikatny (martwe urodzenie, wcześniak, „Za życiem”, choroba matki); lista organizacji do weryfikacji przed finałem |

## Imitacje (oznaczone badge „Symulacja”)

| Imitacja | Gdzie | Status |
|---|---|---|
| Logowanie przez mObywatel | [/logowanie](https://kompas-rodzica.vercel.app/logowanie) | ✅ |
| Dane z systemów ZUS o ubezpieczeniu + wprowadzanie ręczne | [/dane-zus](https://kompas-rodzica.vercel.app/dane-zus) („Popraw” → formularz z danymi), [/dane-reczne](https://kompas-rodzica.vercel.app/dane-reczne) | ✅ |
| Zaświadczenie o niezaleganiu w składkach na dzień powstania prawa | /dane-zus → „Zaświadczenie o niezaleganiu” | ✅ |
| Przegląd zwolnień e-ZLA | /dane-zus → „Zwolnienia e-ZLA” (kod „B”) | ✅ |
| Połączenie z PUE/eZUS: pytanie, sprawdzenie danych | /pomoc → „Zapytaj ZUS przez PUE/eZUS” | ✅ |
| Wypełnienie i wysłanie wniosków do pracodawcy lub ZUS | /dokumenty → wniosek o urlop, ZAM (podgląd, PDF, „Wyślij”) | ✅ |
| Wniosek o odpis aktu urodzenia (link do gov.pl) | /dokumenty → „Odpis aktu urodzenia” | ✅ |

## Pozostałe wymagania

| Wymaganie | Gdzie | Status | Uwagi |
|---|---|---|---|
| Organizacje wsparcia + linki do zus.pl, MRPiPS, PIP | /pomoc | ✅ | |
| Panel administracyjny: procenty, maksymalne okresy, nowe funkcje | [/admin](https://kompas-rodzica.vercel.app/admin) (hasło) | ✅ | Edycja parametrów → nowa wersja z datą wejścia w życie → plany przeliczają się od tej daty; historia wersji. Demo zapisuje w przeglądarce, produkcja: baza danych za `PUT /api/params` |
| Lista funkcji AI | [/ai](https://kompas-rodzica.vercel.app/ai), `docs/ai-usage.md` | ✅ | |
| RWD (komputer + telefon) | cała aplikacja | ✅ | Dolna nawigacja na telefonie, boczna na komputerze |
| REST API | `/api/calculate`, `/api/eligibility`, `/api/params`, `/api/cases/extract` | ✅ | Walidacja Zod |
| Formularz ZAM zamiast ZUR / ZAO (od 24.10.2026); rozpoznawanie starych | /dokumenty, /sprawdz-sprawe | ✅ | |

## Poprawność obliczeń

- Silnik reguł: `lib/engine/` — czysty TypeScript, **bez AI**, każdy krok z odwołaniem do przepisu (trace na ekranie „Dlaczego tyle?”).
- Testy: `npm test` (Vitest) — reguły, kwoty, terminy, dokumenty, 4 persony.
- Parametry: `lib/engine/params/2026-01-01.json` z datą wejścia w życie; źródło każdej wartości opisane w pliku.
- Przykładowe sprawy ZUS testowane lokalnie poza repozytorium (zakaz publikacji).

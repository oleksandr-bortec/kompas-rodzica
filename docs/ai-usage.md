# Wykorzystanie AI

## W aplikacji
- Rozpoznawanie dokumentów (PDF → JSON wg schematu Zod) — `lib/ai/`
- Wyjaśnienia wyniku prostym językiem (liczby wstawia silnik, nie AI)

AI **nie liczy** kwot, okresów ani terminów i nie wydaje decyzji.

## Koszt i limity (szacunek z 22.11.2026)

Domyślny model: `claude-haiku-5-5` — 0,10 USD za 1 mln tokenów wejściowych i 0,50 USD za 1 mln wyjściowych
dla zapytań do 100 tys. tokenów (powyżej: 0,50 / 2,50 USD), wg cennika Anthropic.
Strona PDF to zwykle 1 500–3 000 tokenów; skan bez warstwy tekstu — do ok. 1 600.

| Operacja | Typowo | Najgorzej |
|---|---|---|
| Odczyt akt, 20 stron (mediana 87 przykładowych spraw ZUS) | poniżej 0,01 USD | ok. 0,015 USD |
| Odczyt akt, 42 strony (90% spraw ma nie więcej) | ok. 0,01 USD | ok. 0,10 USD |
| „Wyjaśnij mi to” (jeden język) | ok. 0,001 USD | ok. 0,002 USD |

„Najgorzej” = gęste strony i pełny limit odpowiedzi (`max_tokens` 16 000 przy odczycie, 4 000 przy wyjaśnieniu).
Model można zmienić bez zmiany kodu zmienną `ANTHROPIC_MODEL`, np. `claude-sonnet-5-5`
(2 / 10 USD za 1 mln tokenów, ok. 0,13 USD za sprawę 20 stron).
Zabezpieczenia: limit wydatków w konsoli Anthropic; plik do 4 MB; gdy AI jest niedostępne
(brak klucza lub środków, zły klucz, przeciążenie, odmowa modelu), odczyt akt proponuje przykładowe sprawy,
a wyjaśnienie pokazuje gotowy szablon bez AI — reszta aplikacji działa bez AI.

## W tworzeniu kodu (dziennik)
| Czas | Narzędzie | Co zrobiono |
|---|---|---|
| 2026-11-21 | Claude Code | Szkielet Next.js, tokeny designu, nawigacja, AGENTS.md |
| 2026-11-21 | Claude Code | Szkielet 14 ekranów, 4 persony demo, parametry JSON, komponenty (timeline, wykres, imitacje) |
| 2026-11-21 | Claude Code | Silnik reguł lib/engine (prawo, płatnik, okresy, kwoty, terminy, ryzyka, trace) + 71 testów Vitest; REST /api/calculate, /api/eligibility, /api/params |
| 2026-11-21 | Codex | Poprawiono odliczanie na ekranie planu według daty w Polsce i dodano testy granic dnia oraz zmian czasu. |
| 2026-11-21 | Claude Code | Reguły z materiałów ZUS (załącznik, ustawa): długości urlopów, art. 2a, art. 4 ust. 2, moduł podstawy wymiaru, zaokrąglanie; test na sprawie ZUS (lokalnie) |
| 2026-11-21 | Codex | Formularz danych ręcznych, walidacja i zapis profilu własnego oraz testy przekazywania danych do silnika. |
| 2026-11-21 | Claude Code | Przygotowanie deployu: hasło /admin z ADMIN_PASSWORD, nagłówki bezpieczeństwa, CI GitHub Actions, README z instrukcją Vercel |
| 2026-11-21 | Codex | Zapis stanu listy dokumentów dla każdego profilu demonstracyjnego, również po odświeżeniu i zmianie karty. |
| 2026-11-21 | Codex | Eksport całodniowych terminów planu do iCalendar i testy formatu RFC 5545. |
| 2026-11-21 | Codex | Dwa symulacyjne formularze PDF generowane lokalnie z danych profilu i okresów obliczonych przez silnik. |
| 2026-11-21 | Claude Code | Silnik: lista dokumentów (co, dokąd, do kiedy) wg Kodeksu pracy i ustawy; ekran Dokumenty i „Następny krok” z silnika; daty po polsku |
| 2026-11-21 | Claude Code | „Sprawdź sprawę”: odczyt akt (PDF/skan) przez Claude (claude-opus-5-5, structured outputs + Zod), potwierdzenie przez człowieka, werdykt z silnika, porównanie z decyzją ZUS; plan B na przykładowych sprawach |
| 2026-11-21 | Claude Code | docs/wymagania.md, prezentacja.md, scenariusz-wideo.md; strona „W ciąży” (wymaganie a); adopcja w kalkulatorze; kwota przy pracy na ½ etatu (art. 31 ust. 4a); wynagrodzenia z 12 mies. w formularzu ręcznym; ikony PWA; poprawki dostępności |
| 2026-11-21 | Claude Code | Polerowanie: nowy ekran powitalny (podgląd planu z silnika, „Jak to działa”), strona 404 po polsku, tytuły kart, oś czasu 81,5%, krótszy chip płatnika, „Następny krok” z imieniem, bez migania persony |
| 2026-11-22 | Claude Code | docs/biblioteki.md (biblioteki, fonty, usługi, licencje); usunięte nieużywane zależności ai i pdf-parse |
| 2026-11-22 | Claude Code | Bez zaślepek: odpowiedzi z „Kilka pytań” zmieniają plan; „Popraw” otwiera formularz z danymi z ZUS (+ zadłużenie); panel admina zapisuje wersje parametrów z datą wejścia w życie i plany się przeliczają |
| 2026-11-22 | Claude Code | Weryfikacja na 9 sprawach ZUS (lokalnie): 7/7 zgodnych werdyktów; parametry 2025; płatnik po ustaniu ubezpieczenia (art. 61); ostrzeżenia: umowa w czasie ciąży, ponowne zgłoszenie do dobrowolnego ubezpieczenia |
| 2026-11-22 | Claude Code | „Wyjaśnij mi to”: wyjaśnienie planu PL/UA/EN — AI pisze tylko placeholdery (bez liczb), walidacja odrzuca własne cyfry, wartości wstawia silnik w przeglądarce; szablon bez AI jako zapas |
| 2026-11-22 | Claude Code | Testy całości (4 persony, formularz ręczny, kalkulator, dokumenty, PDF/.ics, „Sprawdź sprawę”, admin, 360 px / desktop, dostępność) i poprawki: tytuły kart z metadanych tras, walidacja `/api/params?date`, limit 4 MB i czytelne błędy wgrywania, badge „Symulacja” w przykładowych sprawach, powód braku prawa z dniem i datą, etykiety stawek z planu (zmiany w panelu admina), oś wykresu, kalkulator (powód braku prawa, kwota rodzicielskiego), zawijanie na 360 px, poprawione opisy na stronie „AI w aplikacji” |
| 2026-11-22 | Claude Code | Szacunek kosztu AI na przykładowych sprawach (87 plików: mediana 20 stron); przy błędzie usługi AI (np. brak środków) odczyt akt proponuje przykłady, a wyjaśnienie nie przekazuje surowych błędów do przeglądarki |
| 2026-11-22 | Claude Code | Model AI zmieniony na `claude-haiku-5-5` (ok. 40× taniej niż Opus 5.5: ok. 1 centa za sprawę 20 stron), z możliwością zmiany zmienną `ANTHROPIC_MODEL`; bez server-side fallback (Haiku 5.5 go nie ma) |

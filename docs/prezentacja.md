# Prezentacja — konspekt (10 slajdów)

**Hasło:** „Od ciąży do powrotu do pracy — z planem.”
**Myśl przewodnia:** AI rozumie i tłumaczy — silnik reguł liczy.

1. **Kompas Rodzica** — nazwa, hasło, zespół, link do demo (QR).
2. **Problem** — pięć powodów z opisu wyzwania: brak wiedzy o prawach, szczególne sytuacje, trudne wyliczenie kwoty, skomplikowane procedury, zmiany zatrudnienia w ciąży. Skutek: listy, spory, późne odmowy.
3. **Rozwiązanie** — plan w 3 minuty: zrzut ekranu Planu (werdykt, kto wypłaca, kwoty, oś czasu dwojga rodziców, następny krok).
4. **Jak to działa** — dane (mObywatel / ZUS / ręcznie / PDF) → silnik reguł → plan, dokumenty, ryzyka. Każdy krok z podstawą prawną.
5. **Kalkulator i scenariusze** — podział urlopu, 81,5% vs 100% + 70%, ½ etatu, bliźnięta, „Za życiem”, adopcja i rodzina zastępcza.
6. **Sprawdź sprawę i poprawność** — PDF → AI odczytuje fakty z pewnością i stroną → człowiek potwierdza → werdykt silnika vs decyzja ZUS. Wynik na przykładowych sprawach ZUS: werdykt zgodny w 7 z 7 spraw w zakresie silnika; w 2 sprawach (umowa dla pozoru, wyrejestrowanie po zasiłku) silnik ostrzega o ryzyku. Liczba testów automatycznych.
7. **AI: co robi, czego nie robi** — odczyt dokumentów i wyjaśnienia; nie liczy kwot, nie wydaje decyzji, nie przetwarza PESEL.
8. **Zgodność z wymaganiami** — tabela a–j + imitacje → ekran (z `docs/wymagania.md`).
9. **Wdrożenie** — moduł do mZUS / PUE eZUS, REST API, panel parametrów z datą wejścia w życie, imitacje jako wymienne adaptery, bezpieczeństwo (hasło admina, nagłówki, brak danych spraw w repo), dostępność.
10. **Co dalej i rozwiązania zewnętrzne** — zapis parametrów w bazie, wersja UA/EN, PWA offline; użyte biblioteki: Next.js, React, Tailwind, shadcn/ui, lucide, Zod, React Hook Form, Recharts, Vitest, pdf-lib, Anthropic SDK (Claude); hosting Vercel.

# Wykorzystanie AI

## W aplikacji
- Rozpoznawanie dokumentów (PDF → JSON wg schematu Zod) — `lib/ai/`
- Wyjaśnienia wyniku prostym językiem (liczby wstawia silnik, nie AI)

AI **nie liczy** kwot, okresów ani terminów i nie wydaje decyzji.

## W tworzeniu kodu (dziennik)
| Czas | Narzędzie | Co zrobiono |
|---|---|---|
| 2026-11-21 | Claude Code | Szkielet Next.js, tokeny designu, nawigacja, AGENTS.md |
| 2026-11-21 | Claude Code | Szkielet 14 ekranów, 4 persony demo, parametry JSON, komponenty (timeline, wykres, imitacje) |
| 2026-11-21 | Claude Code | Silnik reguł lib/engine (prawo, płatnik, okresy, kwoty, terminy, ryzyka, trace) + 71 testów Vitest; REST /api/calculate, /api/eligibility, /api/params |
| 2026-11-21 | Codex | Poprawiono odliczanie na ekranie planu według daty w Polsce i dodano testy granic dnia oraz zmian czasu. |
| 2026-11-21 | Claude Code | Przygotowanie deployu: hasło /admin z ADMIN_PASSWORD, nagłówki bezpieczeństwa, CI GitHub Actions, README z instrukcją Vercel |

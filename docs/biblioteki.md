# Biblioteki, usługi i licencje

Rozwiązanie zbudowano z kodu własnego zespołu oraz poniższych rozwiązań zewnętrznych
(regulamin HackNation pkt 6; opis wyzwania ZUS: „rozwiązania zewnętrzne wskazane w prezentacji”).
Wszystkie biblioteki mają licencje otwarte, dopuszczające użycie komercyjne i przeniesienie praw do własnego kodu.

## Biblioteki w aplikacji

| Biblioteka | Wersja | Licencja | Do czego |
|---|---|---|---|
| [Next.js](https://nextjs.org) | 15.5 | MIT | Framework aplikacji (App Router, REST API) |
| [React](https://react.dev) / React DOM | 19.1 | MIT | Interfejs użytkownika |
| [Tailwind CSS](https://tailwindcss.com) | 4.3 | MIT | Style |
| [shadcn/ui](https://ui.shadcn.com) | 4.23 | MIT | Komponenty UI (kopiowane do `components/ui`) |
| [Radix UI](https://www.radix-ui.com) | 1.8 | MIT | Dostępne prymitywy komponentów (pod shadcn/ui) |
| [lucide-react](https://lucide.dev) | 1.77 | ISC | Ikony |
| [class-variance-authority](https://cva.style) | 0.7 | Apache-2.0 | Warianty komponentów |
| [clsx](https://github.com/lukeed/clsx) | 2.1 | MIT | Łączenie klas CSS |
| [tailwind-merge](https://github.com/dcastil/tailwind-merge) | 3.7 | MIT | Łączenie klas Tailwind |
| [tw-animate-css](https://github.com/Wombosvideo/tw-animate-css) | 1.4 | MIT | Animacje komponentów |
| [Zod](https://zod.dev) | 4.6 | MIT | Schematy i walidacja danych (formularze, API, odpowiedzi AI) |
| [React Hook Form](https://react-hook-form.com) + resolvers | 7.92 / 7.0 | MIT | Formularze |
| [Recharts](https://recharts.org) | 3.11 | MIT | Wykres kwot miesiąc po miesiącu |
| [pdf-lib](https://pdf-lib.js.org) + @pdf-lib/fontkit | 1.17 / 1.1 | MIT | Generowanie wzorów wniosków w PDF |
| [Anthropic SDK](https://github.com/anthropics/anthropic-sdk-typescript) (`@anthropic-ai/sdk`) | 1.12 | Apache-2.0 | Odczyt akt sprawy przez model Claude |
| [server-only](https://www.npmjs.com/package/server-only) | 0.0.1 | MIT | Ochrona kodu serwerowego (klucze) przed trafieniem do przeglądarki |

## Narzędzia deweloperskie

| Narzędzie | Wersja | Licencja | Do czego |
|---|---|---|---|
| [TypeScript](https://www.typescriptlang.org) | 5.9 | Apache-2.0 | Język |
| [Vitest](https://vitest.dev) | 4.1 | MIT | Testy silnika reguł |
| [ESLint](https://eslint.org) + eslint-config-next | 9.39 / 15.5 | MIT | Jakość kodu |
| @tailwindcss/postcss, @types/* | — | MIT | Budowanie stylów, typy |

## Fonty

| Font | Licencja | Gdzie |
|---|---|---|
| [Manrope](https://fonts.google.com/specimen/Manrope) | SIL Open Font License 1.1 | Nagłówki i kwoty (przez `next/font`) |
| [Inter](https://fonts.google.com/specimen/Inter) | SIL Open Font License 1.1 | Tekst (przez `next/font`) |
| [DejaVu Sans](https://dejavu-fonts.github.io) | Bitstream Vera / DejaVu (wolna) — `public/fonts/dejavu-LICENSE.txt` | Polskie znaki we wzorach PDF |

## Usługi zewnętrzne

| Usługa | Do czego | Uwagi |
|---|---|---|
| [Claude API](https://www.anthropic.com/api) (Anthropic), model `claude-opus-5-5` | Odczyt akt sprawy (PDF/skan) → dane do potwierdzenia przez człowieka | Wymaga `ANTHROPIC_API_KEY`; AI nie liczy kwot ani nie wydaje decyzji; plik nie jest zapisywany |
| [Vercel](https://vercel.com) | Hosting demo i podglądy PR | Plan Hobby |
| [GitHub](https://github.com) + GitHub Actions | Repozytorium i CI (lint, testy, build) | |

## Treści i grafika

- Ikony: lucide (ISC). Ikona aplikacji (kompas) — własna, generowana kodem (`lib/brand-icon.tsx`).
- Teksty reguł i świadczeń opracowane przez zespół na podstawie materiałów ZUS dla uczestników
  (Załącznik, ustawa zasiłkowa, Kodeks pracy, rozporządzenia, Poradnik dla rodziców 2026).
- Przykładowe sprawy ZUS **nie są** częścią repozytorium ani demo (zakaz rozpowszechniania);
  sprawy w demo są fikcyjne.

## Bezpieczeństwo zależności (`npm audit`, 22.11.2026)

- W zależnościach produkcyjnych zostają 2 zgłoszenia: `postcss` wbudowany w `next` 15.5 (XSS przy
  serializacji CSS, odczyt plików `.map`). Dotyczą przetwarzania CSS w czasie budowania, a nie
  działającej aplikacji: nie przetwarzamy CSS od użytkowników. Poprawka wymaga Next.js 16
  (zmiana łamiąca) — świadomie odkładamy ją na po hackathonie.
- Pozostałe zgłoszenia dotyczą narzędzi deweloperskich (np. `shadcn` CLI → `minimatch`), które nie
  trafiają do wdrożonej aplikacji; `shadcn` jest w `devDependencies`.

## AI w tworzeniu kodu

Szczegóły w [`docs/ai-usage.md`](ai-usage.md): asystenci AI (Claude Code, ChatGPT/Codex) pomagali pisać kod;
każda zmiana przechodziła testy, przegląd i CI.

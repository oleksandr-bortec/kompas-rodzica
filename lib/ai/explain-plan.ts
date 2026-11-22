import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import type { Plan } from "@/lib/engine";
import { isSafeText } from "@/lib/explain/fill";
import { reasonCode } from "@/lib/explain/template";
import type { Lang } from "@/lib/explain/variables";

/**
 * AI step 2 of 2: explains a plan in plain language (PL / UK / EN).
 * The model never sees amounts, dates or percentages — only facts without numbers and a
 * list of placeholders. It must write numbers as {placeholders}; any digit of its own makes
 * the text invalid. The browser fills placeholders with values from the rules engine.
 */
export const EXPLAIN_MODEL = "claude-opus-5-5";

const OutputSchema = z.object({ paragraphs: z.array(z.string()).max(6) });

const PLACEHOLDER_MEANING: Record<string, string> = {
  imie_A: "imię pierwszego rodzica (osoby, która bierze urlop macierzyński)",
  imie_B: "imię drugiego rodzica",
  data_zdarzenia: "data porodu lub przyjęcia dziecka",
  platnik_A: "kto wypłaca zasiłek pierwszemu rodzicowi (pracodawca albo ZUS)",
  platnik_B: "kto wypłaca zasiłek drugiemu rodzicowi",
  kwota_A: "miesięczna kwota zasiłku pierwszego rodzica za pełny miesiąc",
  procent_A: "procent podstawy dla tej kwoty",
  kwota_rodz_A: "miesięczna kwota za urlop rodzicielski pierwszego rodzica",
  procent_rodz_A: "procent podstawy za urlop rodzicielski pierwszego rodzica",
  tyg_mac: "liczba tygodni urlopu macierzyńskiego (lub na warunkach macierzyńskiego)",
  tyg_rodz_A: "liczba tygodni urlopu rodzicielskiego pierwszego rodzica",
  koniec_A: "data końca urlopów pierwszego rodzica",
  tyg_rodz_B: "liczba tygodni urlopu rodzicielskiego drugiego rodzica (nieprzenoszalne)",
  kwota_B: "miesięczna kwota zasiłku drugiego rodzica za urlop rodzicielski",
  procent_B: "procent podstawy drugiego rodzica",
  dni_ojc: "liczba dni urlopu ojcowskiego",
  data_wniosku: "ostatni dzień na wniosek o wariant 81,5%",
  termin_splaty: "ostatni dzień na spłatę zadłużenia",
  ryzyko: "nazwa najważniejszego ryzyka",
};

const LANG_NAME: Record<Lang, string> = { pl: "po polsku, zwracając się na „Ty”", uk: "українською мовою, звертаючись на «ви»", en: "in plain English" };

export class ExplainUnavailableError extends Error {}

export async function explainPlanWithAI(plan: Plan, placeholderKeys: string[], lang: Lang, event: string): Promise<string[]> {
  if (!process.env.ANTHROPIC_API_KEY) throw new ExplainUnavailableError("Brak klucza ANTHROPIC_API_KEY.");

  const facts = {
    zdarzenie: event,
    prawo_do_zasilku: plan.eligibility.A.eligible,
    powod: reasonCode(plan),
    wariant: plan.variantApplied === "81.5" ? "81,5% za cały okres" : "100% za macierzyński i 70% za rodzicielski",
    urlopy: [...new Set(plan.segments.map((s) => `${s.parent === "A" ? "pierwszy rodzic" : "drugi rodzic"}: ${s.kind}`))],
    ryzyka: plan.risks.slice(0, 3).map((r) => r.title.replace(/\d+([.,]\d+)?/g, "…")),
  };
  const placeholders = placeholderKeys.map((k) => `{${k}} — ${PLACEHOLDER_MEANING[k] ?? k}`).join("\n");

  const client = new Anthropic();
  const response = await client.beta.messages.parse({
    model: EXPLAIN_MODEL,
    max_tokens: 4000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: betaZodOutputFormat(OutputSchema) },
    system:
      "Jesteś spokojnym, życzliwym doradcą, który tłumaczy przyszłym rodzicom ich plan zasiłków ZUS prostym językiem. " +
      "Nie wydajesz decyzji i nie liczysz kwot. Liczby, daty i procenty wolno Ci zapisywać WYŁĄCZNIE jako podane placeholdery w nawiasach klamrowych — nigdy cyframi. " +
      "Nie wymyślaj faktów spoza podanych danych.",
    messages: [
      {
        role: "user",
        content:
          `Napisz wyjaśnienie planu ${LANG_NAME[lang]}: 3–5 krótkich akapitów, bez nagłówków i list, bez żargonu (jeśli używasz polskiego terminu ZUS w innym języku, dodaj go w nawiasie).\n` +
          `Ostatni akapit: jedno zdanie, że to informacja, a nie decyzja ZUS.\n\n` +
          `Fakty (bez liczb):\n${JSON.stringify(facts, null, 2)}\n\n` +
          `Dostępne placeholdery (używaj tylko tych, każdą liczbę/datę zapisuj placeholderem):\n${placeholders}`,
      },
    ],
  });

  if (response.stop_reason === "refusal" || !response.parsed_output) throw new Error("Brak poprawnej odpowiedzi modelu.");
  const paragraphs = response.parsed_output.paragraphs.map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length === 0 || !paragraphs.every((p) => isSafeText(p, placeholderKeys))) {
    throw new Error("Odpowiedź AI zawierała własne liczby lub nieznane pola — użyto wyjaśnienia bez AI.");
  }
  return paragraphs;
}

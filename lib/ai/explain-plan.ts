import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { AI_MODEL } from "./model";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
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
export const EXPLAIN_MODEL = AI_MODEL;

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

const LANG_NAME: Record<Lang, string> = {
  pl: "Polish, addressing the reader informally (\u201eTy\u201d)",
  uk: "Ukrainian (українською мовою), addressing the reader politely with \u00abви\u00bb",
  en: "plain English",
};

const REASON_TEXT: Record<string, string | undefined> = {
  ok: undefined,
  no_insurance: "brak ubezpieczenia chorobowego w dniu porodu lub przyjęcia dziecka",
  debt: "zadłużenie w składkach (działalność gospodarcza) — prawo dopiero po spłacie",
  child_age: "dziecko przekroczyło limit wieku dla adopcji lub rodziny zastępczej",
  other: "nie można potwierdzić prawa na podstawie danych",
};

/** The answer is in the requested language (ZUS terms in parentheses may stay Polish). */
function inLanguage(text: string, lang: Lang): boolean {
  const outside = text.replace(/\([^)]*\)/g, " ");
  if (lang === "uk") return /[\u0400-\u04FF]/.test(outside) && !/\b(jest|oraz|się|który|można|zasiłek)\b/i.test(outside);
  if (lang === "en") return /\b(the|and|you|your|is|of)\b/i.test(outside) && !/\b(jest|oraz|się|który|można)\b/i.test(outside);
  return !/[\u0400-\u04FF]/.test(outside);
}

export class ExplainUnavailableError extends Error {}

export async function explainPlanWithAI(plan: Plan, placeholderKeys: string[], lang: Lang, event: string, eventDate: string): Promise<string[]> {
  if (!process.env.ANTHROPIC_API_KEY) throw new ExplainUnavailableError("Brak klucza ANTHROPIC_API_KEY.");

  const future = eventDate > new Date().toISOString().slice(0, 10);
  const facts = {
    zdarzenie: event === "porod" ? "poród" : event === "adopcja" ? "przyjęcie dziecka (adopcja)" : "przyjęcie dziecka (rodzina zastępcza)",
    kiedy: future ? "w przyszłości — to planowany termin, dziecko jeszcze się nie urodziło / nie zostało przyjęte" : "już było",
    prawo_do_zasilku: plan.eligibility.A.eligible,
    powod_braku_prawa: REASON_TEXT[reasonCode(plan)],
    wariant: plan.variantApplied === "81.5" ? "jedna stawka za cały urlop (macierzyński i rodzicielski)" : "wyższa stawka za macierzyński, niższa za rodzicielski",
    urlopy: [...new Set(plan.segments.map((s) => `${s.parent === "A" ? "pierwszy rodzic" : "drugi rodzic"}: ${s.kind}`))],
    ryzyka: plan.risks.slice(0, 3).map((r) => r.title.replace(/\d+([.,]\d+)?/g, "…")),
  };
  const placeholders = placeholderKeys.map((k) => `{${k}} — ${PLACEHOLDER_MEANING[k] ?? k}`).join("\n");

  const client = new Anthropic();
  const userPrompt =
    `Write the explanation in ${LANG_NAME[lang]} — every sentence in that language.\n` +
    `3–5 short paragraphs, no headings or lists, no jargon; when you use a Polish ZUS term in another language, add it in parentheses.\n` +
    `Last paragraph: one sentence saying this is information, not a ZUS decision.\n` +
    `Never write a digit — numbers, dates, percentages and periods only as the placeholders below (e.g. not "21 days" but "by {data_wniosku}").\n\n` +
    `Facts (in Polish, without numbers):\n${JSON.stringify(facts, null, 2)}\n\n` +
    `Placeholders you may use (only these; write every number or date as one of them):\n${placeholders}`;

  // Second try: tell the model exactly what broke the rules (digits, unknown placeholders, language).
  let feedback = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await client.messages.parse({
      model: EXPLAIN_MODEL,
      max_tokens: 4000,
      output_config: { effort: "low", format: zodOutputFormat(OutputSchema) },
      system:
        "You are a calm, kind adviser who explains a future parent's ZUS benefit plan in plain language. " +
        "You do not decide and you do not calculate. Numbers, dates and percentages may appear ONLY as the given {placeholders} in curly braces — never as digits. " +
        `Do not invent facts beyond the data. Always answer in ${LANG_NAME[lang]}.`,
      messages: [{ role: "user", content: userPrompt + feedback }],
    });
    if (response.stop_reason === "refusal" || !response.parsed_output) throw new Error("Brak poprawnej odpowiedzi modelu.");
    const paragraphs = response.parsed_output.paragraphs.map((p) => p.trim()).filter(Boolean);
    const bad = paragraphs.flatMap((p) => unsafeFragments(p, placeholderKeys));
    const wrongLanguage = paragraphs.some((p) => !inLanguage(p, lang));
    if (paragraphs.length > 0 && bad.length === 0 && !wrongLanguage) return paragraphs;
    feedback =
      "\n\nIMPORTANT: the previous answer was rejected" +
      (bad.length ? ` — it contained: ${bad.slice(0, 6).map((b) => `"${b}"`).join(", ")}` : "") +
      (wrongLanguage ? ` — it was not written in ${LANG_NAME[lang]}` : "") +
      ". Write it again from scratch following all rules.";
  }
  throw new Error("Odpowiedź AI zawierała własne liczby lub nieznane pola — użyto wyjaśnienia bez AI.");
}

/** Fragments that break the rule: words with digits outside placeholders, unknown placeholders. */
function unsafeFragments(text: string, allowed: string[]): string[] {
  if (isSafeText(text, allowed)) return [];
  const unknown = [...text.matchAll(/\{([a-z_AB]+)\}/g)].map((m) => m[1]).filter((k) => !allowed.includes(k)).map((k) => `{${k}}`);
  const digits = text.replace(/\{[a-z_AB]+\}/g, " ").match(/\S*\d\S*/g) ?? [];
  return [...unknown, ...digits];
}

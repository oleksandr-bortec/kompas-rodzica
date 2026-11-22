"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/kr/ui";
import type { Plan, PlanInput } from "@/lib/engine";
import { fill } from "@/lib/explain/fill";
import { localizedVariables, templateExplanation } from "@/lib/explain/template";
import type { Lang, Names } from "@/lib/explain/variables";
import { cn } from "@/lib/utils";

const UI: Record<Lang, { title: string; button: string; ai: string; template: string; note: string; fallback: string }> = {
  pl: {
    title: "Wyjaśnij mi to",
    button: "Wyjaśnij prostym językiem",
    ai: "Wyjaśnienie AI",
    template: "Wyjaśnienie bez AI",
    note: "Liczby wstawia silnik reguł — AI ich nie widzi i nie może ich zmienić.",
    fallback: "AI jest teraz niedostępne — pokazujemy wyjaśnienie z szablonu.",
  },
  uk: {
    title: "Поясніть мені",
    button: "Пояснити простою мовою",
    ai: "Пояснення AI",
    template: "Пояснення без AI",
    note: "Числа підставляє рушій правил — AI їх не бачить і не може змінити.",
    fallback: "AI зараз недоступний — показуємо пояснення за шаблоном.",
  },
  en: {
    title: "Explain it to me",
    button: "Explain in plain language",
    ai: "AI explanation",
    template: "Explanation without AI",
    note: "Numbers are inserted by the rules engine — AI never sees them and cannot change them.",
    fallback: "AI is unavailable right now — showing the template explanation.",
  },
};

const LANGS: { v: Lang; l: string }[] = [
  { v: "pl", l: "Polski" },
  { v: "uk", l: "Українська" },
  { v: "en", l: "English" },
];

/**
 * „Wyjaśnij mi to” — plain-language explanation in PL / UK / EN.
 * AI (if available) returns text with {placeholders} only; values come from this plan.
 */
export function ExplainCard({ plan, input, names }: { plan: Plan; input: PlanInput; names: Names }) {
  const [lang, setLang] = useState<Lang>("pl");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ paragraphs: string[]; source: "ai" | "template"; lang: Lang; fallback?: boolean } | null>(null);
  const t = UI[lang];

  async function explain() {
    setLoading(true);
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ input, lang, names }),
      });
      const json = (await res.json()) as { paragraphs?: string[] };
      if (res.ok && json.paragraphs) {
        const vars = localizedVariables(plan, input.eventDate, names, lang);
        setResult({ paragraphs: json.paragraphs.map((p) => fill(p, vars)), source: "ai", lang });
      } else {
        setResult({ paragraphs: templateExplanation(plan, input.eventDate, names, lang), source: "template", lang, fallback: true });
      }
    } catch {
      setResult({ paragraphs: templateExplanation(plan, input.eventDate, names, lang), source: "template", lang, fallback: true });
    } finally {
      setLoading(false);
    }
  }

  const r = result && result.lang === lang ? result : null;

  return (
    <Panel className="bg-kr-partner-tint/40">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-kr-partner">
          <Sparkles className="size-4" aria-hidden />
          <h2 className="kr-card-title">{t.title}</h2>
        </div>
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-kr-surface p-1" role="radiogroup" aria-label="Język wyjaśnienia">
          {LANGS.map((o) => (
            <button
              key={o.v}
              type="button"
              role="radio"
              aria-checked={lang === o.v}
              onClick={() => setLang(o.v)}
              className={cn("rounded-lg px-2.5 py-1 kr-caption", lang === o.v ? "bg-kr-partner text-white" : "text-kr-text-2")}
            >
              {o.l}
            </button>
          ))}
        </div>
      </div>

      {r ? (
        <div className="mt-3 space-y-2" lang={lang === "uk" ? "uk" : lang}>
          <span className="inline-block rounded-full bg-kr-surface px-2 py-0.5 kr-caption text-kr-partner">{r.source === "ai" ? t.ai : t.template}</span>
          {r.fallback && <p className="kr-small text-kr-text-2">{t.fallback}</p>}
          {r.paragraphs.map((p, i) => <p key={i} className="text-kr-text">{p}</p>)}
        </div>
      ) : (
        <Button className="mt-3 h-11 rounded-xl bg-kr-partner hover:bg-kr-partner/90" onClick={explain} disabled={loading}>
          {loading ? <Loader2 className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />} {t.button}
        </Button>
      )}
      <p className="mt-3 kr-small text-kr-text-2">{t.note}</p>
    </Panel>
  );
}

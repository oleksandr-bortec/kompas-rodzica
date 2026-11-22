/**
 * Values for explanation placeholders — all computed by the rules engine, formatted per language.
 */
import type { Plan } from "@/lib/engine";
import { dateText } from "@/lib/engine/dates";
import type { Vars } from "./fill";

export type Lang = "pl" | "uk" | "en";

const money = (v: number, lang: Lang) => {
  const [i, f] = v.toFixed(2).split(".");
  const int = i.replace(/\B(?=(\d{3})+(?!\d))/g, lang === "en" ? "," : " ");
  const frac = f === "00" ? "" : (lang === "en" ? "." : ",") + f;
  return `${int}${frac} zł`;
};
const pct = (p: number, lang: Lang) => `${lang === "en" ? String(p) : String(p).replace(".", ",")}%`;
const num = (n: number, lang: Lang) => (lang === "en" ? String(n) : String(n).replace(".", ","));

const PAYER: Record<Lang, Record<string, string>> = {
  pl: { platnik: "pracodawca", ZUS: "ZUS", nieznany: "płatnik albo ZUS (do ustalenia)" },
  uk: { platnik: "роботодавець", ZUS: "ZUS", nieznany: "роботодавець або ZUS (треба уточнити)" },
  en: { platnik: "the employer", ZUS: "ZUS", nieznany: "the employer or ZUS (to be confirmed)" },
};

export interface Names { A: string; B?: string }

export function buildVariables(plan: Plan, eventDate: string, names: Names, lang: Lang): Vars {
  const v: Vars = { imie_A: names.A, data_zdarzenia: dateText(eventDate), platnik_A: PAYER[lang][plan.payer.A] };
  if (names.B) v.imie_B = names.B;
  if (plan.payer.B) v.platnik_B = PAYER[lang][plan.payer.B];
  const segs = (parent: "A" | "B", kind: string) => plan.segments.filter((s) => s.parent === parent && s.kind === kind);
  const weeks = (parent: "A" | "B", kind: string) => segs(parent, kind).reduce((n, s) => n + s.weeks, 0);

  const firstA = plan.segments.find((s) => s.parent === "A" && s.kind !== "ojcowski");
  if (firstA?.monthlyAmount != null) {
    v.kwota_A = money(firstA.monthlyAmount, lang);
    v.procent_A = pct(firstA.ratePercent, lang);
  }
  const parA = segs("A", "rodzicielski")[0];
  if (parA?.monthlyAmount != null) {
    v.kwota_rodz_A = money(parA.monthlyAmount, lang);
    v.procent_rodz_A = pct(parA.ratePercent, lang);
  }
  const mac = weeks("A", "macierzynski") || weeks("A", "warunki_macierzynskiego");
  if (mac) v.tyg_mac = num(mac, lang);
  if (weeks("A", "rodzicielski")) v.tyg_rodz_A = num(weeks("A", "rodzicielski"), lang);
  if (firstA) v.koniec_A = dateText(plan.segments.filter((s) => s.parent === "A").at(-1)!.end);
  const parB = segs("B", "rodzicielski")[0];
  if (parB) {
    v.tyg_rodz_B = num(weeks("B", "rodzicielski"), lang);
    if (parB.monthlyAmount != null) v.kwota_B = money(parB.monthlyAmount, lang);
    v.procent_B = pct(parB.ratePercent, lang);
  }
  const pat = segs("B", "ojcowski")[0];
  if (pat) v.dni_ojc = num(Math.round(pat.weeks * 7), lang);
  const dl = (id: string) => plan.deadlines.find((d) => d.id === id)?.date;
  if (dl("combined-rate")) v.data_wniosku = dateText(dl("combined-rate")!);
  if (dl("debt")) v.termin_splaty = dateText(dl("debt")!);
  const top = plan.risks[0];
  if (top) v.ryzyko = top.title;
  return v;
}

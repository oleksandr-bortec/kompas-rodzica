/**
 * Kto wypłaca zasiłek: płatnik, który zgłasza do ubezpieczenia chorobowego
 * ponad 20 ubezpieczonych (stan na 30 listopada roku poprzedniego); inaczej ZUS.
 * Osoba prowadząca działalność (JDG) — ZUS. Za okres po ustaniu ubezpieczenia — ZUS (art. 61 ust. 1 pkt 2 lit. d).
 */
import type { Params } from "./params";
import { periodOn } from "./eligibility";
import { dateText } from "./dates";
import type { InsurancePeriod, Payer, TraceStep } from "./types";

export function determinePayer(
  periods: InsurancePeriod[],
  date: string,
  params: Params,
  trace?: TraceStep[],
  parent: "A" | "B" = "A",
): Payer {
  const p = periodOn(periods, date);
  let payer: Payer;
  let detail: string;
  if (!p) {
    payer = "nieznany";
    detail = `Brak tytułu ubezpieczenia w dniu ${dateText(date)} — nie ma kto wypłacić zasiłku.`;
  } else if (p.title === "jdg") {
    payer = "ZUS";
    detail = "Działalność gospodarcza — zasiłek wypłaca ZUS.";
  } else if (p.to !== null && p.to <= date) {
    // e.g. fixed-term contract extended until the day of birth (art. 177 § 3 KP)
    payer = "ZUS";
    detail = `Ubezpieczenie kończy się ${dateText(p.to)} — za okres po ustaniu ubezpieczenia zasiłek wypłaca ZUS (art. 61 ust. 1 pkt 2 lit. d).`;
  } else if (p.payerInsuredCount === undefined) {
    payer = "nieznany";
    detail = "Brak liczby ubezpieczonych u płatnika — nie wiadomo, kto wypłaca.";
  } else if (p.payerInsuredCount > params.payer.employerPaysAboveInsured) {
    payer = "platnik";
    detail = `Płatnik zgłasza ${p.payerInsuredCount} osób (> ${params.payer.employerPaysAboveInsured}) — wypłaca płatnik.`;
  } else {
    payer = "ZUS";
    detail = `Płatnik zgłasza ${p.payerInsuredCount} osób (≤ ${params.payer.employerPaysAboveInsured}) — wypłaca ZUS.`;
  }
  trace?.push({
    id: `payer-${parent}`,
    label: "Kto wypłaca",
    detail,
    rule: "params.payer.employerPaysAboveInsured",
    values: { liczbaUbezpieczonych: p?.payerInsuredCount ?? null, prog: params.payer.employerPaysAboveInsured },
  });
  return payer;
}

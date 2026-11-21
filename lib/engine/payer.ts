/**
 * Kto wypłaca zasiłek: płatnik, który zgłasza do ubezpieczenia chorobowego
 * ponad 20 ubezpieczonych (stan na 30 listopada roku poprzedniego); inaczej ZUS.
 * Osoba prowadząca działalność (JDG) — ZUS.
 */
import type { Params } from "./params";
import { periodOn } from "./eligibility";
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
    detail = "Brak tytułu ubezpieczenia w dniu zdarzenia.";
  } else if (p.title === "jdg") {
    payer = "ZUS";
    detail = "Działalność gospodarcza — zasiłek wypłaca ZUS.";
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

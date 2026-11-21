/**
 * Prawo do zasiłku. Rules (opis wyzwania ZUS):
 * - zasiłek chorobowy: po 30 dniach nieprzerwanego ubezp. obowiązkowego,
 *   po 90 dniach przy dobrowolnym (zlecenie, JDG);
 * - zasiłek macierzyński: ubezpieczenie chorobowe w dniu porodu
 *   (ryzyko z PDF: „brak ubezpieczenia chorobowego na dzień porodu”);
 * - adopcja: dziecko do 14 lat; rodzina zastępcza: do 7 lat (10 przy odroczonej szkole);
 * - umowa o pracę na czas określony, która skończyłaby się po 3. miesiącu ciąży,
 *   przedłuża się do dnia porodu (Kodeks pracy).
 */
import type { Params } from "./params";
import { addDays, addMonths, dateText, diffDays } from "./dates";
import { plnText } from "./money";
import type { EligibilityResult, InsurancePeriod, PlanInputParsed, TraceStep } from "./types";

/** Polish plural for years: 1 rok, 2–4 lata, 5+ lat. */
export function yearsPl(n: number): string {
  if (n === 1) return "1 rok";
  const last = n % 10, last2 = n % 100;
  return `${n} ${Number.isInteger(n) && last >= 2 && last <= 4 && (last2 < 12 || last2 > 14) ? "lata" : "lat"}`;
}

const covers = (p: InsurancePeriod, date: string) => p.from <= date && (p.to === null || p.to >= date);
const hasSickness = (p: InsurancePeriod) => p.sickness !== "brak";

/** Estimated end of the 3rd month of pregnancy from the due date (40 weeks). */
export function endOfThirdMonthOfPregnancy(dueDate: string): string {
  const conception = addDays(dueDate, -280);
  return addDays(addMonths(conception, 3), -1);
}

/**
 * Applies the Labour Code extension: fixed-term employment contract ending after
 * the 3rd month of pregnancy is extended until the day of birth.
 */
export function applyContractExtension(
  periods: InsurancePeriod[],
  dueDate: string,
  trace?: TraceStep[],
): InsurancePeriod[] {
  const threshold = endOfThirdMonthOfPregnancy(dueDate);
  return periods.map((p) => {
    if (p.title === "umowa_o_prace" && p.fixedTerm && p.to !== null && p.to < dueDate && p.to > threshold) {
      trace?.push({
        id: "kp-extension",
        label: "Przedłużenie umowy do dnia porodu",
        detail: `Umowa na czas określony kończy się ${dateText(p.to)}, czyli po 3. miesiącu ciąży (szacunkowo po ${dateText(threshold)}) — przedłuża się do dnia porodu.`,
        rule: "Kodeks pracy — ochrona w ciąży (opis wyzwania ZUS)",
        values: { umowaDo: p.to, przedluzonaDo: dueDate },
      });
      return { ...p, to: dueDate };
    }
    return p;
  });
}

export function isInsuredOn(periods: InsurancePeriod[], date: string): boolean {
  return periods.some((p) => hasSickness(p) && covers(p, date));
}

/** Period with sickness insurance covering the date (first match). */
export function periodOn(periods: InsurancePeriod[], date: string): InsurancePeriod | undefined {
  return periods.find((p) => hasSickness(p) && covers(p, date));
}

/**
 * Days of sickness insurance counted for the waiting period before `date`
 * (art. 4 ust. 2: earlier periods count if the gap was ≤ maxGapDays; gap days
 * themselves are not counted). 0 if not insured on `date`.
 */
export function continuousInsuranceDays(periods: InsurancePeriod[], date: string, maxGapDays = 0): number {
  const sorted = periods.filter(hasSickness).sort((a, b) => b.from.localeCompare(a.from)); // newest first
  const current = sorted.find((p) => covers(p, date));
  if (!current) return 0;
  let total = diffDays(current.from, date);
  let chainStart = current.from;
  for (const p of sorted) {
    if (p === current || p.from >= chainStart || p.to === null) continue;
    const end = p.to < chainStart ? p.to : addDays(chainStart, -1);
    const gap = diffDays(end, chainStart) - 1;
    if (gap > maxGapDays) break;
    total += diffDays(p.from, end) + 1;
    chainStart = p.from;
  }
  return total;
}

/** Debt threshold (art. 2a): 1% of the minimum wage. */
export function debtThreshold(params: Params): number {
  return Math.round(params.base.minimumWage * params.debt.thresholdPercentOfMinWage) / 100;
}

/**
 * Art. 2a: for people running a business (JDG) and their collaborators, contribution
 * debt above 1% of the minimum wage on the day the right arises blocks the benefit
 * until the whole debt is paid.
 */
export function debtBlocksBenefit(periods: InsurancePeriod[], date: string, debt: number | undefined, params: Params): boolean {
  const p = periodOn(periods, date);
  return !!p && p.title === "jdg" && (debt ?? 0) > debtThreshold(params);
}

export function sicknessWaitingDays(periods: InsurancePeriod[], date: string, params: Params): number {
  const p = periodOn(periods, date);
  return p?.sickness === "dobrowolne" ? params.eligibility.waitingDaysVoluntary : params.eligibility.waitingDaysMandatory;
}

export function checkEligibility(
  input: PlanInputParsed,
  parent: "A" | "B",
  params: Params,
  trace: TraceStep[],
): EligibilityResult {
  const data = parent === "A" ? input.parentA : input.parentB!;
  const periods = input.event === "porod" ? applyContractExtension(data.periods, input.eventDate, trace) : data.periods;
  const date = input.eventDate;

  const insured = isInsuredOn(periods, date);
  const days = continuousInsuranceDays(periods, date, params.eligibility.maxGapDaysForContinuity);
  const waiting = sicknessWaitingDays(periods, date, params);
  const sicknessOk = insured && days >= waiting;

  trace.push({
    id: `insurance-${parent}`,
    label: "Ubezpieczenie chorobowe",
    detail: insured
      ? `W dniu ${dateText(date)} jest ubezpieczenie chorobowe; nieprzerwanie od ${days} dni (dla zasiłku chorobowego wymagane ${waiting}).`
      : `W dniu ${dateText(date)} brak ubezpieczenia chorobowego.`,
    rule: insured ? `params.eligibility.waitingDays${waiting === params.eligibility.waitingDaysVoluntary ? "Voluntary" : "Mandatory"}` : "Ubezpieczenie w dniu porodu",
    values: { ubezpieczony: insured, dni: days, wymagane: waiting },
  });

  let eligible: boolean | null = insured;
  let reason = insured ? "Ubezpieczenie chorobowe w dniu zdarzenia." : "Brak ubezpieczenia chorobowego w dniu zdarzenia.";

  if (insured && debtBlocksBenefit(periods, date, data.contributionDebt, params)) {
    eligible = false;
    reason = `Zadłużenie z tytułu składek (${plnText(data.contributionDebt ?? 0)}) przekracza 1% minimalnego wynagrodzenia (${plnText(debtThreshold(params))}) — zasiłek nie przysługuje do czasu spłaty całego zadłużenia.`;
    trace.push({
      id: `debt-${parent}`,
      label: "Zadłużenie w składkach",
      detail: reason,
      rule: "art. 2a ustawy zasiłkowej · params.debt",
      values: { zadluzenie: data.contributionDebt ?? 0, prog: debtThreshold(params) },
    });
  }

  if (insured && eligible !== false && input.event !== "porod") {
    const age = input.childAgeYears;
    const max =
      input.event === "adopcja"
        ? params.adoption.adoptionMaxChildAgeYears
        : input.schoolDeferred
          ? params.adoption.fosterMaxChildAgeYearsSchoolDeferred
          : params.adoption.fosterMaxChildAgeYears;
    if (age === undefined) {
      eligible = null;
      reason = "Brak wieku dziecka — nie można sprawdzić limitu wieku.";
    } else if (age > max) {
      eligible = false;
      reason = `Dziecko ma ${yearsPl(age)} — limit to ${yearsPl(max)}.`;
    } else {
      reason = `Dziecko ma ${yearsPl(age)} (limit: ${yearsPl(max)}), a w dniu przyjęcia dziecka jest ubezpieczenie chorobowe.`;
    }
    trace.push({
      id: `child-age-${parent}`,
      label: "Wiek dziecka",
      detail: reason,
      rule: input.event === "adopcja" ? "params.adoption.adoptionMaxChildAgeYears" : "params.adoption.fosterMaxChildAgeYears",
      values: { wiek: age ?? null, limit: max },
    });
  }

  return {
    eligible,
    reason,
    insuredOnEventDate: insured,
    continuousDays: days,
    sicknessWaitingDays: waiting,
    sicknessBenefitEligible: sicknessOk,
  };
}

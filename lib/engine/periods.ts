/**
 * Okresy urlopów (opis wyzwania ZUS):
 * - macierzyński: 20 tyg. przy 1 dziecku; do 6 tyg. przed porodem; pierwsze 14 tyg. po porodzie tylko matka;
 * - rodzicielski: pula 41 (1 dziecko) lub 43 tyg. (więcej dzieci); po 9 tyg. nieprzenoszalnych dla każdego rodzica;
 *   do końca roku, w którym dziecko kończy 6 lat; praca do ½ etatu wydłuża urlop proporcjonalnie;
 * - ojcowski: 14 dni, w 1 lub 2 częściach (min. 7 dni), do 12 mies. życia dziecka;
 *   adopcja: 12 mies. od uprawomocnienia, max do 14 lat dziecka;
 * - martwe urodzenie / śmierć dziecka do 8 tyg.: 8 tyg. po porodzie, nie mniej niż 7 dni od śmierci;
 *   śmierć po 8 tyg. — 7 dni od śmierci.
 * Values come from params — nothing is hard-coded here.
 */
import type { Params } from "./params";
import { addDays, addMonths, addWeeks, addYears, diffDays, endOfYear, maxDate, minDate } from "./dates";

type ByChildren = Params["maternity"]["weeksByChildren"];
const childrenKey = (children: number) => String(Math.min(Math.max(children, 1), 5)) as keyof ByChildren;

/** Maternity leave: 20 / 31 / 33 / 35 / 37 weeks for 1 / 2 / 3 / 4 / 5+ children (Załącznik ZUS). */
export function maternityWeeks(children: number, params: Params): number | null {
  return params.maternity.weeksByChildren[childrenKey(children)] ?? null;
}

/**
 * Leave on maternity terms (adoption / foster): same lengths as maternity, by number
 * of children taken at once; never shorter than params.adoption.minWeeks (9).
 */
export function adoptionLeaveWeeks(children: number, params: Params): number | null {
  const w = params.adoption.weeksByChildren[childrenKey(children)];
  return w == null ? null : Math.max(w, params.adoption.minWeeks);
}

/** Parental pool: 41 / 43 weeks; with „Za życiem” 65 / 67 weeks (Załącznik ZUS). */
export function parentalPoolWeeks(children: number, zaZyciem: boolean | undefined, params: Params): number | null {
  const p = params.parental;
  if (zaZyciem) return (children > 1 ? p.poolWeeksZaZyciemMultiple : p.poolWeeksZaZyciem) ?? null;
  return children > 1 ? p.poolWeeksMultiple : p.poolWeeks;
}

/**
 * Supplementary maternity leave (premature / hospitalised child): 1 week per started
 * week of hospitalisation, capped at 15 weeks (born before 28th week of pregnancy or
 * birth weight ≤ 1000 g) or 8 weeks (other cases).
 */
export function supplementaryWeeks(hospitalDays: number, extremelyPreterm: boolean, params: Params): number {
  if (hospitalDays <= 0) return 0;
  const cap = extremelyPreterm ? params.supplementaryMaternity.maxWeeksExtremelyPreterm : params.supplementaryMaternity.maxWeeksOther;
  return Math.min(Math.ceil(hospitalDays / 7), cap);
}

/** Validates a parental-leave split. Returns error messages (empty = OK). */
export function validateParentalSplit(
  pool: number,
  weeksA: number,
  weeksB: number,
  params: Params,
): string[] {
  const nt = params.parental.nonTransferableWeeksPerParent;
  const errors: string[] = [];
  if (weeksA + weeksB > pool) errors.push(`Suma urlopu rodzicielskiego (${weeksA + weeksB} tyg.) przekracza pulę ${pool} tyg.`);
  if (weeksA > pool - nt) errors.push(`Jeden rodzic może wykorzystać najwyżej ${pool - nt} tyg. — ${nt} tyg. przysługuje wyłącznie drugiemu rodzicowi.`);
  if (weeksB > pool - nt) errors.push(`Jeden rodzic może wykorzystać najwyżej ${pool - nt} tyg. — ${nt} tyg. przysługuje wyłącznie drugiemu rodzicowi.`);
  return errors;
}

/** Default split: second parent takes the non-transferable part, first parent the rest. */
export function defaultParentalSplit(pool: number, hasSecondParent: boolean, params: Params) {
  const nt = params.parental.nonTransferableWeeksPerParent;
  return hasSecondParent ? { a: pool - nt, b: nt } : { a: pool - nt, b: 0 };
}

/**
 * Leave length when working part-time during parental leave: the leave is extended
 * proportionally to working time (½ etatu → 2× longer). Returns null if fraction is above the limit.
 */
export function extendForPartTimeWork(weeks: number, workFraction: number, params: Params): number | null {
  if (workFraction <= 0) return weeks;
  if (workFraction > params.parental.maxWorkFraction) return null;
  return Math.round((weeks / (1 - workFraction)) * 100) / 100;
}

/** End date (inclusive) of a leave that starts on `start` and lasts `weeks` weeks. */
export function leaveEnd(start: string, weeks: number): string {
  return addDays(start, Math.round(weeks * 7) - 1);
}

/** Last day on which parental leave can be used: 31.12 of the year the child turns 6. */
export function parentalDeadline(birthDate: string, params: Params): string {
  return endOfYear(addYears(birthDate, params.parental.untilChildAgeYearEnd));
}

/** Last day to use paternity leave. */
export function paternityDeadline(
  event: "porod" | "adopcja" | "rodzina_zastepcza",
  eventDate: string,
  params: Params,
  childAgeYears?: number,
): string {
  if (event === "porod") return addDays(addMonths(eventDate, params.paternity.untilChildAgeMonths), -1);
  const byDecision = addDays(addMonths(eventDate, params.paternity.adoptionMonthsFromDecision), -1);
  if (childAgeYears === undefined) return byDecision;
  // estimated 14th birthday from the child's age on the decision date
  const turns14 = addYears(eventDate, params.paternity.adoptionMaxChildAgeYears - childAgeYears);
  return minDate(byDecision, addDays(turns14, -1));
}

/** Validates paternity parts: 1 part of 14 days or 2 parts of ≥ 7 days. */
export function validatePaternityParts(partsDays: number[], params: Params): string[] {
  const errors: string[] = [];
  const total = partsDays.reduce((s, d) => s + d, 0);
  if (partsDays.length > params.paternity.maxParts) errors.push(`Urlop ojcowski można podzielić najwyżej na ${params.paternity.maxParts} części.`);
  if (total > params.paternity.days) errors.push(`Urlop ojcowski trwa najwyżej ${params.paternity.days} dni.`);
  if (partsDays.some((d) => d < params.paternity.minPartDays)) errors.push(`Każda część urlopu ojcowskiego musi trwać co najmniej ${params.paternity.minPartDays} dni.`);
  return errors;
}

/**
 * Maternity leave after stillbirth or death of the child.
 * Returns the last day of leave (inclusive).
 */
export function stillbirthLeaveEnd(birthDate: string, deathDate: string, params: Params): string {
  const p = params.stillbirth;
  const eightWeeksEnd = addDays(addWeeks(birthDate, p.weeksAfterBirth), -1);
  const minAfterDeath = addDays(deathDate, p.minDaysAfterDeath - 1);
  const childAgeDays = diffDays(birthDate, deathDate);
  if (childAgeDays < p.weeksAfterBirth * 7) return maxDate(eightWeeksEnd, minAfterDeath);
  return addDays(deathDate, p.daysIfDeathAfter8Weeks - 1);
}

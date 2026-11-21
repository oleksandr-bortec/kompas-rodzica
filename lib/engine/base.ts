/**
 * Podstawa wymiaru zasiłku (Załącznik ZUS, ustawa zasiłkowa art. 36, 45, 48):
 * - pracownik: przeciętne miesięczne wynagrodzenie z 12 pełnych miesięcy kalendarzowych
 *   przed miesiącem powstania prawa, pomniejszone o 13,71% (składki społeczne pracownika);
 *   przy krótszym ubezpieczeniu — z pełnych miesięcy ubezpieczenia;
 *   miesiąc przepracowany w mniej niż połowie jest pomijany;
 *   przy pełnym etacie podstawa nie może być niższa niż minimalne wynagrodzenie po odliczeniu 13,71%;
 * - niepracownik (JDG, zlecenie): przeciętny miesięczny przychód z 12 mies., pomniejszony o 13,71%;
 *   przy dobrowolnym chorobowym limit: maksymalna podstawa składki po odliczeniu 13,71%.
 *
 * Not implemented (TODO): uzupełnianie niepełnych miesięcy, składniki kwartalne/roczne,
 * zmiana wymiaru czasu pracy w okresie 12 miesięcy, art. 48a (kwota zadeklarowana < 12 mies.).
 */
import type { Params } from "./params";
import { percentOf } from "./money";
import type { TraceStep } from "./types";

export interface MonthIncome {
  month: string; // YYYY-MM
  gross: number; // przychód brutto stanowiący podstawę składek
  /** Pracownik przepracował co najmniej połowę obowiązującego czasu pracy. */
  workedAtLeastHalf?: boolean;
}

export interface BaseInput {
  employee: boolean;
  fullTime?: boolean;
  voluntarySickness?: boolean;
  months: MonthIncome[];
}

export interface BaseResult {
  base: number | null;
  monthsUsed: number;
  averageGross: number | null;
  raisedToMinimum: boolean;
  cappedAtMaximum: boolean;
  trace: TraceStep[];
}

const net = (gross: number, params: Params) => percentOf(gross, 100 - params.base.socialContributionPercent);

export function minimumBase(params: Params): number {
  return net(params.base.minimumWage, params);
}

export function voluntaryMaximumBase(params: Params): number {
  return net(params.base.voluntarySicknessMaxDeclaredBase, params);
}

export function computeBase(input: BaseInput, params: Params): BaseResult {
  const trace: TraceStep[] = [];
  const months = input.months
    .slice()
    .sort((a, b) => b.month.localeCompare(a.month))
    .slice(0, params.base.monthsBack)
    .filter((m) => !input.employee || m.workedAtLeastHalf !== false);

  if (months.length === 0) {
    return { base: null, monthsUsed: 0, averageGross: null, raisedToMinimum: false, cappedAtMaximum: false, trace };
  }

  const sumGross = months.reduce((s, m) => s + Math.round(m.gross * 100), 0) / 100;
  const averageGross = Math.round((sumGross / months.length) * 100) / 100;
  let base = net(averageGross, params);
  trace.push({
    id: "base-average",
    label: "Podstawa wymiaru",
    detail: `Średnia z ${months.length} mies. (${averageGross} zł brutto) pomniejszona o ${params.base.socialContributionPercent}% = ${base} zł.`,
    rule: "Załącznik ZUS · art. 36 / 48 ustawy zasiłkowej · params.base",
    values: { miesiace: months.length, sredniaBrutto: averageGross, podstawa: base },
  });

  let raisedToMinimum = false;
  if (input.employee && input.fullTime && base < minimumBase(params)) {
    base = minimumBase(params);
    raisedToMinimum = true;
    trace.push({
      id: "base-minimum",
      label: "Minimalna podstawa",
      detail: `Pełny etat — podstawa nie może być niższa niż ${params.base.minimumWage} zł − ${params.base.socialContributionPercent}% = ${base} zł.`,
      rule: "art. 45 ustawy zasiłkowej · params.base.minimumWage",
      values: { podstawa: base },
    });
  }

  let cappedAtMaximum = false;
  if (!input.employee && input.voluntarySickness && base > voluntaryMaximumBase(params)) {
    base = voluntaryMaximumBase(params);
    cappedAtMaximum = true;
    trace.push({
      id: "base-maximum",
      label: "Maksymalna podstawa",
      detail: `Dobrowolne chorobowe — limit ${params.base.voluntarySicknessMaxDeclaredBase} zł − ${params.base.socialContributionPercent}% = ${base} zł.`,
      rule: "Załącznik ZUS · params.base.voluntarySicknessMaxDeclaredBase",
      values: { podstawa: base },
    });
  }

  return { base, monthsUsed: months.length, averageGross, raisedToMinimum, cappedAtMaximum, trace };
}

/**
 * buildPlan — the single entry point of the rules engine.
 * Orchestrates eligibility → payer → periods → amounts → deadlines → risks,
 * recording every decision in `trace` (used by „Dlaczego tyle?" and the AI explainer).
 */
import { getParams, type Params } from "./params";
import { addDays, diffDays } from "./dates";
import { checkEligibility, applyContractExtension, periodOn } from "./eligibility";
import { determinePayer } from "./payer";
import {
  defaultParentalSplit,
  extendForPartTimeWork,
  leaveEnd,
  maternityWeeks,
  parentalDeadline,
  parentalPoolWeeks,
  paternityDeadline,
  validateParentalSplit,
} from "./periods";
import { combinedRateDeadline, monthlyBenefit, ratePercent, resolveVariant } from "./amounts";
import {
  PlanInputSchema,
  type Deadline,
  type Plan,
  type PlanInput,
  type Risk,
  type Segment,
  type SegmentKind,
  type TraceStep,
} from "./types";

export function buildPlan(rawInput: PlanInput, paramsOverride?: Params): Plan {
  const input = PlanInputSchema.parse(rawInput);
  const params = paramsOverride ?? getParams(input.eventDate);
  const o = input.options;
  const trace: TraceStep[] = [];
  const todos: string[] = [];
  const errors: string[] = [];
  const risks: Risk[] = [];
  const deadlines: Deadline[] = [];
  const segments: Segment[] = [];
  const isBirth = input.event === "porod";

  trace.push({
    id: "params",
    label: "Parametry",
    detail: `Użyto parametrów obowiązujących od ${params.effectiveFrom}.`,
    rule: `lib/engine/params/${params.version}.json`,
  });

  /* 1. Eligibility & payer */
  const eligA = checkEligibility(input, "A", params, trace);
  const eligB = input.parentB ? checkEligibility(input, "B", params, trace) : undefined;
  const periodsA = isBirth ? applyContractExtension(input.parentA.periods, input.eventDate) : input.parentA.periods;
  const periodsB = input.parentB ? (isBirth ? applyContractExtension(input.parentB.periods, input.eventDate) : input.parentB.periods) : [];
  const payerA = determinePayer(periodsA, input.eventDate, params, trace, "A");
  const payerB = input.parentB ? determinePayer(periodsB, input.eventDate, params, trace, "B") : undefined;
  if (payerA === "nieznany" && eligA.eligible) todos.push("Podaj liczbę ubezpieczonych u płatnika, aby ustalić, kto wypłaca zasiłek.");

  /* 2. Variant (81.5% vs 100% + 70%) */
  const { variant, lateApplication } = resolveVariant(o.variant, input.eventDate, o.applicationDate, params);
  trace.push({
    id: "variant",
    label: "Wariant wypłaty",
    detail: lateApplication
      ? `Wniosek złożony po ${params.combinedRate.applicationDeadlineDays} dniach od porodu — zastosowano 100% + 70% zamiast 81,5%.`
      : variant === "81.5"
        ? `81,5% za cały okres (wniosek do ${params.combinedRate.applicationDeadlineDays} dni po porodzie).`
        : "100% za urlop macierzyński i 70% za rodzicielski.",
    rule: "params.combinedRate",
    values: { wariant: variant },
  });

  const baseA = input.parentA.base;
  const baseB = input.parentB?.base ?? null;
  if (baseA === null) todos.push("Brak podstawy wymiaru — kwot nie można policzyć (wzór podstawy: do uzupełnienia z materiałów ZUS).");

  const addSegment = (parent: "A" | "B", kind: SegmentKind, start: string, weeks: number, opts?: { noAmount?: boolean }) => {
    const rate = ratePercent(kind, parent, variant, params);
    const base = parent === "A" ? baseA : baseB;
    const seg: Segment = {
      parent,
      kind,
      start,
      end: leaveEnd(start, weeks),
      startWeek: Math.round((diffDays(input.eventDate, start) / 7) * 100) / 100,
      weeks,
      ratePercent: rate,
      monthlyAmount: opts?.noAmount ? null : monthlyBenefit(base, rate),
    };
    segments.push(seg);
    return seg;
  };

  /* 3. First leave: maternity (birth) or leave on maternity terms (adoption/foster) */
  let afterFirstLeave = input.eventDate;
  if (eligA.eligible) {
    if (isBirth) {
      const weeks = maternityWeeks(input.children, params);
      if (o.weeksBeforeBirth > params.maternity.maxWeeksBeforeBirth) {
        errors.push(`Przed porodem można wykorzystać najwyżej ${params.maternity.maxWeeksBeforeBirth} tyg. urlopu macierzyńskiego.`);
      }
      if (weeks === null) {
        todos.push(`Długość urlopu macierzyńskiego dla ${input.children} dzieci — brak w materiałach ZUS (params.maternity.weeksByChildren).`);
      } else {
        const before = Math.min(o.weeksBeforeBirth, params.maternity.maxWeeksBeforeBirth);
        const seg = addSegment("A", "macierzynski", addDays(input.eventDate, -before * 7), weeks);
        afterFirstLeave = addDays(seg.end, 1);
        trace.push({
          id: "maternity",
          label: "Urlop macierzyński",
          detail: `${weeks} tyg. (${before} przed porodem), ${seg.start} – ${seg.end}. Pierwsze ${params.maternity.motherOnlyWeeksAfterBirth} tyg. po porodzie — tylko matka.`,
          rule: "params.maternity",
          values: { tygodnie: weeks, przedPorodem: before, procent: seg.ratePercent },
        });
      }
    } else {
      const weeks = params.adoption.weeks;
      if (weeks === null) {
        todos.push("Długość urlopu na warunkach urlopu macierzyńskiego przy adopcji / rodzinie zastępczej — brak w materiałach ZUS (params.adoption.weeks).");
      } else {
        const seg = addSegment("A", "warunki_macierzynskiego", input.eventDate, weeks);
        afterFirstLeave = addDays(seg.end, 1);
        trace.push({
          id: "adoption-leave",
          label: "Urlop na warunkach urlopu macierzyńskiego",
          detail: `${weeks} tyg., ${seg.start} – ${seg.end}.`,
          rule: "params.adoption",
          values: { tygodnie: weeks, procent: seg.ratePercent },
        });
      }
    }
  }

  /* 4. Paternity leave (second parent) */
  const bInsured = !!eligB?.insuredOnEventDate;
  if (input.parentB && bInsured && o.paternityParts > 0) {
    const days = params.paternity.days;
    const start = isBirth ? addDays(input.eventDate, 14) : input.eventDate;
    const seg = addSegment("B", "ojcowski", start, days / 7);
    deadlines.push({
      id: "paternity",
      label: "Ostatni dzień na urlop ojcowski",
      date: paternityDeadline(input.event, input.eventDate, params, input.childAgeYears),
      parent: "B",
      rule: "params.paternity",
    });
    trace.push({
      id: "paternity",
      label: "Urlop ojcowski",
      detail: `${days} dni (${o.paternityParts === 2 ? "można w 2 częściach po 7 dni" : "jednorazowo"}), w planie od ${seg.start}.`,
      rule: "params.paternity",
      values: { dni: days, procent: seg.ratePercent },
    });
  }

  /* 5. Parental leave split */
  const pool = parentalPoolWeeks(input.children, input.zaZyciem, params);
  let afterParentalA = afterFirstLeave;
  if (pool === null) {
    todos.push("Długość urlopu rodzicielskiego z zaświadczeniem „Za życiem” — brak w materiałach ZUS (params.parental.poolWeeksZaZyciem).");
  } else if (eligA.eligible || bInsured) {
    const hasB = !!input.parentB && bInsured;
    const def = defaultParentalSplit(pool, hasB, params);
    const wA = eligA.eligible ? (o.parentalWeeksA ?? def.a) : 0;
    const wB = hasB ? (o.parentalWeeksB ?? def.b) : 0;
    const splitErrors = validateParentalSplit(pool, wA, wB, params);
    errors.push(...splitErrors);
    trace.push({
      id: "parental-split",
      label: "Podział urlopu rodzicielskiego",
      detail: `Pula ${pool} tyg., po ${params.parental.nonTransferableWeeksPerParent} tyg. nieprzenoszalnych dla każdego rodzica. Plan: ${wA} + ${wB} tyg.`,
      rule: input.children > 1 ? "params.parental.poolWeeksMultiple" : "params.parental.poolWeeks",
      values: { pula: pool, A: wA, B: wB },
    });

    if (splitErrors.length === 0) {
      const place = (parent: "A" | "B", weeks: number, fraction: number, start: string) => {
        if (weeks <= 0) return start;
        const extended = extendForPartTimeWork(weeks, fraction, params);
        if (extended === null) {
          errors.push(`Praca w czasie urlopu rodzicielskiego — najwyżej ${params.parental.maxWorkFraction * 100}% etatu.`);
          return start;
        }
        const working = fraction > 0;
        const seg = addSegment(parent, "rodzicielski", start, extended, { noAmount: working });
        if (working) {
          todos.push("Kwota zasiłku przy pracy w czasie urlopu rodzicielskiego — zasady obniżenia nie są opisane w materiałach ZUS.");
          trace.push({
            id: `parental-work-${parent}`,
            label: "Praca w czasie urlopu rodzicielskiego",
            detail: `Praca na ${fraction * 100}% etatu wydłuża urlop proporcjonalnie: ${weeks} tyg. → ${extended} tyg.`,
            rule: "params.parental.maxWorkFraction",
            values: { tygodnie: weeks, wydluzone: extended, etat: fraction },
          });
        }
        return addDays(seg.end, 1);
      };
      afterParentalA = place("A", wA, o.workFractionA, afterFirstLeave);
      const afterB = place("B", wB, o.workFractionB, afterParentalA);

      if (isBirth) {
        const last = parentalDeadline(input.eventDate, params);
        deadlines.push({ id: "parental", label: "Urlop rodzicielski do wykorzystania do", date: last, parent: "A", rule: "params.parental.untilChildAgeYearEnd" });
        if (addDays(afterB, -1) > last) errors.push(`Urlop rodzicielski musi się skończyć do ${last}.`);
      }
    }
  }

  /* 6. Deadlines */
  if (eligA.eligible && variant === "81.5" && !lateApplication) {
    deadlines.push({
      id: "combined-rate",
      label: "Wniosek o wariant 81,5% — najpóźniej",
      date: combinedRateDeadline(input.eventDate, params),
      parent: "A",
      rule: "params.combinedRate.applicationDeadlineDays",
    });
  }
  deadlines.sort((a, b) => a.date.localeCompare(b.date));

  /* 7. Risks */
  const pA = periodOn(periodsA, input.eventDate);
  if (!eligA.insuredOnEventDate) {
    risks.push({
      id: "no-insurance-on-event",
      severity: "danger",
      title: "Brak ubezpieczenia chorobowego w dniu porodu",
      why: "Prawo do zasiłku macierzyńskiego zależy od ubezpieczenia chorobowego w dniu porodu.",
      todo: "Sprawdź z płatnikiem, czy umowa może trwać do porodu, albo czy masz inny tytuł ubezpieczenia.",
      rule: "Ryzyka z opisu wyzwania ZUS",
      parent: "A",
    });
  }
  const original = input.parentA.periods.find((p) => p.title === "umowa_o_prace" && p.fixedTerm && p.to !== null && p.to < input.eventDate);
  if (isBirth && original && pA?.to === input.eventDate) {
    risks.push({
      id: "kp-extension",
      severity: "info",
      title: "Umowa przedłużona do dnia porodu",
      why: "Umowa na czas określony, która skończyłaby się po 3. miesiącu ciąży, przedłuża się do dnia porodu.",
      todo: "Upewnij się, że pracodawca przedłużył umowę.",
      rule: "Kodeks pracy (opis wyzwania ZUS)",
      parent: "A",
    });
  }
  if (isBirth && input.parentA.periods.some((p) => p.title === "umowa_zlecenie" || p.title === "jdg")) {
    risks.push({
      id: "no-kp-protection",
      severity: "info",
      title: "Ochrona z Kodeksu pracy nie obejmuje zlecenia ani działalności",
      why: "Zakaz zwolnienia i przedłużenie umowy do porodu dotyczą umów o pracę.",
      todo: "Zadbaj o ciągłość ubezpieczenia chorobowego do dnia porodu.",
      rule: "Kodeks pracy (opis wyzwania ZUS)",
      parent: "A",
    });
  }
  if ((input.parentA.contributionDebt ?? 0) > 0) {
    risks.push({
      id: "contribution-debt",
      severity: "warning",
      title: "Zaległość w składkach",
      why: "Zaległość na dzień powstania prawa może wpłynąć na wypłatę zasiłku.",
      todo: "Ureguluj zaległość i pobierz zaświadczenie o niezaleganiu.",
      rule: "TODO(ZUS): reguła zaległości — brak szczegółów w materiałach",
      parent: "A",
    });
    todos.push("Wpływ zaległości w składkach na prawo do zasiłku — reguła do potwierdzenia z ZUS.");
  }
  if (input.parentA.baseIncreasedInPregnancy) {
    risks.push({
      id: "base-increase",
      severity: "warning",
      title: "Podwyższenie podstawy wymiaru w ciąży",
      why: "ZUS wskazuje podwyższenie podstawy składek w czasie ciąży jako ryzyko kwestionowania zasiłku.",
      todo: "Przygotuj uzasadnienie zmiany podstawy.",
      rule: "Ryzyka z opisu wyzwania ZUS",
      parent: "A",
    });
  }
  if (eligA.eligible && variant === "81.5" && !lateApplication) {
    risks.push({
      id: "deadline-21",
      severity: "info",
      title: `Termin ${params.combinedRate.applicationDeadlineDays} dni na wariant 81,5%`,
      why: "Po terminie zasiłek wyniesie 100% za macierzyński i 70% za rodzicielski.",
      todo: `Złóż wniosek najpóźniej ${combinedRateDeadline(input.eventDate, params)}.`,
      rule: "params.combinedRate.applicationDeadlineDays",
      parent: "A",
    });
  }
  if (lateApplication) {
    risks.push({
      id: "late-application",
      severity: "warning",
      title: "Wniosek po terminie 21 dni",
      why: "Wariant 81,5% nie jest już dostępny.",
      todo: "Zasiłek: 100% za macierzyński, 70% za rodzicielski.",
      rule: "params.combinedRate.applicationDeadlineDays",
      parent: "A",
    });
  }
  if (input.parentB && !bInsured) {
    risks.push({
      id: "b-not-insured",
      severity: "info",
      title: "Drugi rodzic bez ubezpieczenia chorobowego",
      why: "Bez ubezpieczenia chorobowego nie przysługuje zasiłek za urlop ojcowski ani rodzicielski.",
      todo: "Sprawdź tytuł ubezpieczenia drugiego rodzica.",
      rule: "Zasady z opisu wyzwania ZUS",
      parent: "B",
    });
  }

  const first = (p: "A" | "B") => segments.find((s) => s.parent === p && s.kind !== "ojcowski")?.monthlyAmount ?? null;

  return {
    paramsVersion: params.version,
    eligibility: { A: eligA, B: eligB },
    payer: { A: payerA, B: payerB },
    variantApplied: variant,
    segments,
    monthly: { A: first("A"), B: first("B") },
    deadlines,
    risks,
    todos: [...new Set(todos)],
    errors: [...new Set(errors)],
    trace,
  };
}

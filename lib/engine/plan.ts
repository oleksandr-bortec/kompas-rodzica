/**
 * buildPlan — the single entry point of the rules engine.
 * Orchestrates eligibility → payer → periods → amounts → deadlines → risks,
 * recording every decision in `trace` (used by „Dlaczego tyle?" and the AI explainer).
 */
import { getParams, type Params } from "./params";
import { addDays, addMonths, dateText, diffDays } from "./dates";
import { checkEligibility, applyContractExtension, debtBlocksBenefit, debtThreshold, periodOn } from "./eligibility";
import { determinePayer } from "./payer";
import { buildDocuments } from "./documents";
import {
  defaultParentalSplit,
  extendForPartTimeWork,
  leaveEnd,
  adoptionLeaveWeeks,
  maternityWeeks,
  parentalDeadline,
  parentalPoolWeeks,
  paternityDeadline,
  validateParentalSplit,
} from "./periods";
import { percentOf, plnText } from "./money";
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

const SEVERITY_ORDER = { danger: 0, warning: 1, info: 2 } as const;

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

  const addSegment = (parent: "A" | "B", kind: SegmentKind, start: string, weeks: number, opts?: { workFraction?: number }) => {
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
      // art. 31 ust. 4a: benefit reduced proportionally to working time during parental leave
      monthlyAmount: monthlyBenefit(base === null ? null : percentOf(base, 100 * (1 - (opts?.workFraction ?? 0))), rate),
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
        todos.push(`Długość urlopu macierzyńskiego dla ${input.children} dzieci — brak w parametrach (params.maternity.weeksByChildren).`);
      } else {
        const before = Math.min(o.weeksBeforeBirth, params.maternity.maxWeeksBeforeBirth);
        const seg = addSegment("A", "macierzynski", addDays(input.eventDate, -before * 7), weeks);
        afterFirstLeave = addDays(seg.end, 1);
        trace.push({
          id: "maternity",
          label: "Urlop macierzyński",
          detail: `${weeks} tyg. (${before} przed porodem), ${dateText(seg.start)} – ${dateText(seg.end)}. Pierwsze ${params.maternity.motherOnlyWeeksAfterBirth} tyg. po porodzie — tylko matka.`,
          rule: "params.maternity",
          values: { tygodnie: weeks, przedPorodem: before, procent: seg.ratePercent },
        });
      }
    } else {
      const weeks = adoptionLeaveWeeks(input.children, params);
      if (weeks === null) {
        todos.push("Długość urlopu na warunkach urlopu macierzyńskiego — brak w parametrach (params.adoption.weeksByChildren).");
      } else {
        const seg = addSegment("A", "warunki_macierzynskiego", input.eventDate, weeks);
        afterFirstLeave = addDays(seg.end, 1);
        trace.push({
          id: "adoption-leave",
          label: "Urlop na warunkach urlopu macierzyńskiego",
          detail: `${weeks} tyg., ${dateText(seg.start)} – ${dateText(seg.end)}.`,
          rule: "params.adoption.weeksByChildren",
          values: { tygodnie: weeks, procent: seg.ratePercent },
        });
      }
    }
  }

  /* 4. Paternity leave (second parent) */
  // second parent needs the same right (insurance + child-age limit for adoption/foster)
  const bInsured = !!eligB?.eligible;
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
      detail: `${days} dni (${o.paternityParts === 2 ? "można w 2 częściach po 7 dni" : "jednorazowo"}), w planie od ${dateText(seg.start)}.`,
      rule: "params.paternity",
      values: { dni: days, procent: seg.ratePercent },
    });
  }

  /* 5. Parental leave split */
  const pool = parentalPoolWeeks(input.children, input.zaZyciem, params);
  let afterParentalA = afterFirstLeave;
  if (pool === null) {
    todos.push("Długość urlopu rodzicielskiego — brak w parametrach (params.parental).");
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
      rule: input.zaZyciem
        ? input.children > 1 ? "params.parental.poolWeeksZaZyciemMultiple" : "params.parental.poolWeeksZaZyciem"
        : input.children > 1 ? "params.parental.poolWeeksMultiple" : "params.parental.poolWeeks",
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
        const seg = addSegment(parent, "rodzicielski", start, extended, { workFraction: fraction });
        if (working) {
          trace.push({
            id: `parental-work-${parent}`,
            label: "Praca w czasie urlopu rodzicielskiego",
            detail: `Praca na ${fraction * 100}% etatu wydłuża urlop proporcjonalnie (${weeks} tyg. → ${extended} tyg.), a zasiłek zmniejsza się proporcjonalnie do wymiaru pracy (${Math.round((1 - fraction) * 100)}% kwoty).`,
            rule: "art. 31 ust. 4a ustawy zasiłkowej · params.parental.maxWorkFraction",
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
        if (addDays(afterB, -1) > last) errors.push(`Urlop rodzicielski musi się skończyć do ${dateText(last)}.`);
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
    const blocking = debtBlocksBenefit(periodsA, input.eventDate, input.parentA.contributionDebt, params);
    const lastDay = addDays(addMonths(input.eventDate, params.debt.prescriptionMonths), -1);
    risks.push({
      id: "contribution-debt",
      severity: blocking ? "danger" : "info",
      title: `Zadłużenie w składkach: ${plnText(input.parentA.contributionDebt ?? 0)}`,
      why: blocking
        ? `Przy działalności gospodarczej zadłużenie powyżej ${plnText(debtThreshold(params))} (1% minimalnego wynagrodzenia) w dniu powstania prawa wstrzymuje zasiłek do spłaty całości.`
        : `Zadłużenie nie przekracza ${plnText(debtThreshold(params))} (1% minimalnego wynagrodzenia) albo nie dotyczy Twojego tytułu ubezpieczenia.`,
      todo: blocking
        ? `Spłać całe zadłużenie najpóźniej do ${dateText(lastDay)} — po 6 miesiącach prawo do zasiłku przedawnia się.`
        : "Mimo to warto uregulować zaległość przed porodem.",
      rule: "art. 2a ustawy zasiłkowej · params.debt",
      parent: "A",
    });
    if (blocking) {
      deadlines.push({ id: "debt", label: "Spłata zadłużenia — inaczej prawo się przedawni", date: lastDay, parent: "A", rule: "art. 2a ust. 2 · params.debt.prescriptionMonths" });
      deadlines.sort((a, b) => a.date.localeCompare(b.date));
    }
  }
  // Insurance title started during pregnancy (est. conception = due date − 280 days)
  const conception = addDays(input.eventDate, -280);
  if (isBirth && pA && pA.from > conception) {
    risks.push({
      id: "insurance-started-in-pregnancy",
      severity: "warning",
      title: pA.title === "jdg" ? "Działalność rozpoczęta w czasie ciąży" : "Umowa zawarta w czasie ciąży",
      why: "ZUS może sprawdzić, czy umowa lub działalność nie zostały zawarte tylko dla uzyskania zasiłku (dla pozoru). Jeśli tak uzna, odmawia prawa do zasiłku.",
      todo: "Zachowaj dowody faktycznej pracy: zakres obowiązków, ewidencję czasu pracy, wynagrodzenie adekwatne do pracy (przy działalności — faktury, klientów).",
      rule: "Ryzyka z opisu wyzwania ZUS: fikcyjna umowa lub działalność dla ubezpieczenia",
      parent: "A",
    });
  }
  // Voluntary sickness insurance ends automatically when maternity benefit starts
  if (eligA.eligible && pA?.sickness === "dobrowolne") {
    risks.push({
      id: "voluntary-reregister",
      severity: "info",
      title: "Po zasiłku zgłoś się ponownie do ubezpieczenia chorobowego",
      why: "Osoby ubezpieczone dobrowolnie (działalność, zlecenie) są automatycznie wyrejestrowane z ubezpieczenia chorobowego, gdy zaczynają pobierać zasiłek macierzyński. Bez ponownego zgłoszenia kolejne świadczenia, np. wniosek o dalszą część urlopu złożony później, mogą zostać odrzucone.",
      todo: "Gdy skończysz pobierać zasiłek macierzyński, zgłoś się ponownie do dobrowolnego ubezpieczenia chorobowego w ZUS.",
      rule: "Poradnik dla rodziców ZUS 2026 — ważne informacje uzupełniające",
      parent: "A",
    });
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
      todo: `Złóż wniosek najpóźniej ${dateText(combinedRateDeadline(input.eventDate, params))}.`,
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
    const notInsured = !eligB?.insuredOnEventDate;
    risks.push({
      id: "b-not-insured",
      severity: "info",
      title: notInsured ? "Drugi rodzic bez ubezpieczenia chorobowego" : "Drugiemu rodzicowi zasiłek nie przysługuje",
      why: notInsured
        ? "Bez ubezpieczenia chorobowego nie przysługuje zasiłek za urlop ojcowski ani rodzicielski."
        : (eligB?.reason ?? "Warunki prawa do zasiłku nie są spełnione."),
      todo: notInsured ? "Sprawdź tytuł ubezpieczenia drugiego rodzica." : "Sprawdź dane w planie.",
      rule: notInsured ? "Zasady z opisu wyzwania ZUS" : "art. 29 ustawy zasiłkowej",
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
    documents: buildDocuments(input, segments, { A: payerA, B: payerB }, eligA.eligible, variant, params),
    risks: risks.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]),
    todos: [...new Set(todos)],
    errors: [...new Set(errors)],
    trace,
  };
}

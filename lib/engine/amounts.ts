/**
 * Kwoty (opis wyzwania ZUS):
 * 100% — macierzyński, na warunkach macierzyńskiego, uzupełniający, ojcowski;
 * 70% — rodzicielski;
 * 81,5% za cały okres macierzyńskiego i rodzicielskiego, jeśli matka złoży wniosek
 * nie później niż 21 dni po porodzie.
 *
 * TODO(ZUS): wzór podstawy wymiaru — engine przyjmuje podstawę jako wejście.
 * TODO(ZUS): stawka dzienna i kwota za niepełny miesiąc — brak w materiałach,
 *            liczymy wyłącznie kwotę za pełny miesiąc.
 * TODO(ZUS): czy 81,5% obejmuje też część rodzicielskiego drugiego rodzica —
 *            przyjęto: 81,5% dla matki, 70% dla drugiego rodzica.
 */
import type { Params } from "./params";
import { addDays } from "./dates";
import { percentOf } from "./money";
import type { SegmentKind } from "./types";

export type Variant = "81.5" | "100-70";

/** Deadline for the 81.5% application: 21 days after birth. */
export function combinedRateDeadline(eventDate: string, params: Params): string {
  return addDays(eventDate, params.combinedRate.applicationDeadlineDays);
}

/** Variant actually applied, considering the 21-day application deadline. */
export function resolveVariant(
  requested: Variant,
  eventDate: string,
  applicationDate: string | undefined,
  params: Params,
): { variant: Variant; lateApplication: boolean } {
  if (requested === "81.5" && applicationDate && applicationDate > combinedRateDeadline(eventDate, params)) {
    return { variant: "100-70", lateApplication: true };
  }
  return { variant: requested, lateApplication: false };
}

/** Benefit rate in percent for a leave segment. */
export function ratePercent(kind: SegmentKind, parent: "A" | "B", variant: Variant, params: Params): number {
  switch (kind) {
    case "ojcowski":
      return params.paternity.ratePercent;
    case "uzupelniajacy":
      return params.supplementaryMaternity.ratePercent;
    case "macierzynski":
      return parent === "A" && variant === "81.5" ? params.combinedRate.ratePercent : params.maternity.ratePercent;
    case "warunki_macierzynskiego":
      return parent === "A" && variant === "81.5" ? params.combinedRate.ratePercent : params.adoption.ratePercent;
    case "rodzicielski":
      return parent === "A" && variant === "81.5" ? params.combinedRate.ratePercent : params.parental.ratePercent;
  }
}

/** Monthly benefit for a full month: base × rate. Null if base is unknown. */
export function monthlyBenefit(base: number | null, rate: number): number | null {
  if (base === null) return null;
  return percentOf(base, rate);
}

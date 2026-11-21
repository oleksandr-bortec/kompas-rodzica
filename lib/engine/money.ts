/**
 * Money helpers. Amounts are computed in grosze (integers) to avoid float drift.
 * Rounding: half-up to 1 grosz (confirmed by the ZUS annex: 20 321,295 → 20 321,30).
 */
export function round2(value: number): number {
  return Math.round(value * 100 + Number.EPSILON) / 100;
}

/**
 * base × percent / 100, rounded half-up to the grosz. Integer arithmetic
 * (grosze × basis points) avoids float errors: 23 550 × 86,29% = 20 321,295 → 20 321,30,
 * as in the ZUS annex.
 */
export function percentOf(base: number, percent: number): number {
  const grosze = Math.round(base * 100);
  const bp = Math.round(percent * 100); // 81.5% → 8150
  return Math.round((grosze * bp) / 10000) / 100;
}

/** Polish money string for engine texts: 412.5 → "412,50 zł" (deterministic, no Intl). */
export function plnText(value: number): string {
  const [i, f] = Math.abs(value).toFixed(2).split(".");
  return `${value < 0 ? "-" : ""}${i.replace(/\B(?=(\d{3})+(?!\d))/g, " ")},${f} zł`;
}

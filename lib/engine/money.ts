/**
 * Money helpers. Amounts are computed in grosze (integers) to avoid float drift.
 * TODO(ZUS): zasady zaokrąglania nie są opisane w materiałach — przyjęto
 * zaokrąglenie matematyczne do 1 grosza.
 */
export function round2(value: number): number {
  return Math.round(value * 100 + Number.EPSILON) / 100;
}

/** base × percent / 100, rounded to grosz. */
export function percentOf(base: number, percent: number): number {
  return Math.round((Math.round(base * 100) * percent) / 100) / 100;
}

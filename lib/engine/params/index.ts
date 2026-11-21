import p20260101 from "./2026-01-01.json";

export type Params = typeof p20260101;

/** All parameter versions, newest last. Admin panel adds new versions. */
export const PARAM_VERSIONS: Params[] = [p20260101];

/** Returns the parameter set in force on a given ISO date (YYYY-MM-DD). */
export function getParams(onDate: string = new Date().toISOString().slice(0, 10)): Params {
  const valid = PARAM_VERSIONS.filter((v) => v.effectiveFrom <= onDate);
  return valid[valid.length - 1] ?? PARAM_VERSIONS[0];
}

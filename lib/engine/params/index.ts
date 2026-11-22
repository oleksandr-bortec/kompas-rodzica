import p20250101 from "./2025-01-01.json";
import p20260101 from "./2026-01-01.json";

export type Params = typeof p20260101;

/** Parameter versions shipped with the code (JSON files, reviewed in PRs). */
export const PARAM_VERSIONS: Params[] = [p20250101, p20260101];

/**
 * Versions added at runtime by the admin panel (demo: stored in the browser;
 * production: database behind PUT /api/params). Empty on the server.
 */
let runtimeVersions: Params[] = [];

export function setRuntimeVersions(versions: Params[]) {
  runtimeVersions = versions;
}

/** All versions sorted by effectiveFrom (a runtime version wins on the same date). */
export function allParamVersions(): Params[] {
  const byDate = new Map<string, Params>();
  for (const v of [...PARAM_VERSIONS, ...runtimeVersions]) byDate.set(v.effectiveFrom, v);
  return [...byDate.values()].sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom));
}

/** Returns the parameter set in force on a given ISO date (YYYY-MM-DD). */
export function getParams(onDate: string = new Date().toISOString().slice(0, 10)): Params {
  const versions = allParamVersions();
  const valid = versions.filter((v) => v.effectiveFrom <= onDate);
  return valid[valid.length - 1] ?? versions[0];
}

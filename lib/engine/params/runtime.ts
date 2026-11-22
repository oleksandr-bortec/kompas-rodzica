/**
 * Browser storage for parameter versions saved in the admin panel (demo).
 * In production the same versions would live in a database behind PUT /api/params.
 */
import { allParamVersions, setRuntimeVersions, type Params } from "./index";

const KEY = "kr.params.versions";

function isParams(v: unknown): v is Params {
  return !!v && typeof v === "object" && typeof (v as Params).effectiveFrom === "string" && typeof (v as Params).version === "string";
}

function read(): Params[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter(isParams) : [];
  } catch {
    return [];
  }
}

export function loadRuntimeParams() {
  setRuntimeVersions(read());
}

export function saveRuntimeVersion(version: Params) {
  const next = [...read().filter((v) => v.effectiveFrom !== version.effectiveFrom), version];
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  setRuntimeVersions(next);
  return allParamVersions();
}

export function clearRuntimeParams() {
  try { localStorage.removeItem(KEY); } catch {}
  setRuntimeVersions([]);
  return allParamVersions();
}

export function runtimeVersionDates(): string[] {
  return read().map((v) => v.effectiveFrom);
}

/** Returns a copy of `base` with numeric values at dotted paths replaced. */
export function withEdits(base: Params, edits: Record<string, number>, effectiveFrom: string): Params {
  const copy = structuredClone(base) as unknown as Record<string, unknown>;
  for (const [path, value] of Object.entries(edits)) {
    const keys = path.split(".");
    let node = copy as Record<string, unknown>;
    for (const k of keys.slice(0, -1)) node = node[k] as Record<string, unknown>;
    node[keys[keys.length - 1]] = value;
  }
  copy.version = `admin-${effectiveFrom}`;
  copy.effectiveFrom = effectiveFrom;
  copy.$comment = `Wersja zapisana w panelu administracyjnym (demo, przeglądarka). Bazą była wersja ${base.version}.`;
  return copy as unknown as Params;
}

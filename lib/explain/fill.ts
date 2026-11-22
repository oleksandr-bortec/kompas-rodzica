/**
 * Placeholder handling for explanations: texts (template or AI) contain only {name}
 * placeholders; the app fills in values computed by the rules engine.
 */
export type Vars = Record<string, string>;

const PLACEHOLDER = /\{([a-z_AB]+)\}/g;

/** Replaces {name} with vars[name]; unknown placeholders are left visible. */
export function fill(text: string, vars: Vars): string {
  return text.replace(PLACEHOLDER, (m, key: string) => (key in vars ? vars[key] : m));
}

/**
 * A text is safe when it contains no digits of its own (every number must come from
 * a placeholder) and only known placeholders. This makes it impossible for AI to
 * write an amount, date or percentage that the engine did not compute.
 */
export function isSafeText(text: string, allowed: string[]): boolean {
  const keys = [...text.matchAll(PLACEHOLDER)].map((m) => m[1]);
  if (keys.some((k) => !allowed.includes(k))) return false;
  return !/\d/.test(text.replace(PLACEHOLDER, ""));
}

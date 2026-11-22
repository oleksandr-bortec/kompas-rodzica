import "server-only";

/**
 * Claude model for both AI steps: reading case files and the plain-language explanation.
 * Default: Claude Haiku 5.5, the low-cost model ($0.10 / $0.50 per million input / output tokens
 * for prompts up to 100K tokens) — about 1 cent for a 20-page scanned case file.
 * Optional override in the environment, e.g. ANTHROPIC_MODEL=claude-sonnet-5-5.
 * No server-side fallback (Haiku 5.5 has none): on a refusal or API error the app falls back
 * to the sample cases / the template explanation.
 */
export const AI_MODEL = process.env.ANTHROPIC_MODEL?.trim() || "claude-haiku-5-5";

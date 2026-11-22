import type { DemoPersona } from "./types";

/** Answers from the onboarding questions („Kilka pytań”). Undefined = keep data from ZUS / the persona. */
export interface OnboardingAnswers {
  eventDate?: string;
  children?: number;
  /** false = the second parent will not take leave (their part is not planned). */
  partner?: boolean;
  zaZyciem?: boolean;
  /** Premature or hospitalised child — supplementary maternity leave may apply. */
  hospital?: boolean;
}

/** Applies onboarding answers on top of a demo persona (pure). */
export function applyAnswers(p: DemoPersona, a?: OnboardingAnswers): DemoPersona {
  if (!a) return p;
  return {
    ...p,
    eventDate: a.eventDate || p.eventDate,
    children: a.children ?? p.children,
    b: a.partner === false ? undefined : p.b,
    zaZyciem: a.zaZyciem ?? p.zaZyciem,
    hospital: a.hospital ?? p.hospital,
  };
}

export const KIDS_OPTIONS = ["Jedno", "Bliźnięta", "Troje lub więcej", "Nie wiem"] as const;
export function kidsFromLabel(label: string): number | undefined {
  return label === "Jedno" ? 1 : label === "Bliźnięta" ? 2 : label === "Troje lub więcej" ? 3 : undefined;
}
export function labelFromKids(n: number): (typeof KIDS_OPTIONS)[number] {
  return n <= 1 ? "Jedno" : n === 2 ? "Bliźnięta" : "Troje lub więcej";
}

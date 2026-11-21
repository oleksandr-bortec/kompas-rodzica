"use client";

import { useMemo } from "react";
import { buildPlan, type Plan, type PlanInput, type PlanOptions } from "@/lib/engine";
import { personaToInput } from "@/lib/personas/to-engine";
import type { Persona, Tone } from "@/lib/personas/types";
import { formatDateShort } from "@/lib/format";
import { usePersona } from "./persona-provider";

export interface Verdict {
  tone: Tone;
  title: string;
  detail: string;
}

/** Turns engine eligibility into user-facing verdict text (no numbers invented here). */
export function verdictFor(plan: Plan, persona: Persona): Verdict {
  const e = plan.eligibility.A;
  const what = persona.event === "porod" ? "zasiłku macierzyńskiego" : "zasiłku za urlop na warunkach urlopu macierzyńskiego";
  if (e.eligible === null) return { tone: "warning", title: "Nie możemy jeszcze ustalić prawa", detail: e.reason };
  if (!e.eligible) return { tone: "danger", title: `Brak prawa do ${what}`, detail: e.reason };
  const debt = plan.risks.some((r) => r.id === "contribution-debt");
  return {
    tone: debt ? "warning" : "success",
    title: debt ? `Prawo do ${what} — sprawdź zaległość` : `Masz prawo do ${what}`,
    detail:
      persona.event === "porod"
        ? `W dniu porodu (${formatDateShort(persona.eventDate)}) masz ubezpieczenie chorobowe — to warunek zasiłku macierzyńskiego.`
        : e.reason,
  };
}

export type PlanOverrides = Partial<Pick<PlanInput, "event" | "children" | "zaZyciem" | "childAgeYears">>;

export function usePlan(options?: Partial<PlanOptions>, overrides?: PlanOverrides) {
  const { persona } = usePersona();
  const key = JSON.stringify([options ?? {}, overrides ?? {}]);
  const plan = useMemo(
    () => buildPlan({ ...personaToInput(persona, options), ...overrides }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [persona, key],
  );
  return { persona, plan, verdict: verdictFor(plan, persona) };
}

export const PAYER_LABEL = { platnik: "pracodawca (płatnik)", ZUS: "ZUS", nieznany: "do ustalenia" } as const;

import type { ParentInput, PlanInput, PlanOptions } from "@/lib/engine/types";
import type { ParentData, Persona } from "./types";

function toParent(d: ParentData): ParentInput {
  return {
    name: d.name,
    base: d.avgMonthlyBase, // demo: podstawa podana wprost (wzór: TODO ZUS)
    contributionDebt: d.contributionDebt,
    periods: d.periods.map((p) => ({
      title: p.title === "brak" ? "inne" : p.title,
      from: p.from,
      to: p.to,
      sickness: p.sicknessInsurance,
      payerInsuredCount: p.title === "jdg" ? undefined : p.payerInsuredCount,
      fixedTerm: p.fixedTerm,
    })),
  };
}

/** Maps a demo persona to engine input. */
export function personaToInput(p: Persona, options?: Partial<PlanOptions>): PlanInput {
  return {
    event: p.event,
    eventDate: p.eventDate,
    children: p.children,
    childAgeYears: p.childAgeYears,
    parentA: toParent(p.a),
    parentB: p.b ? toParent(p.b) : undefined,
    options: { variant: "81.5", ...options },
  };
}

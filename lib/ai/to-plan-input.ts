/**
 * Deterministic mapping: confirmed case data → rules-engine input.
 * Runs after a human has checked the AI-extracted fields. No AI here.
 */
import { computeBase, getParams, type PlanInput } from "@/lib/engine";
import type { CaseExtraction } from "./case-schema";

export interface CaseMapping {
  input: PlanInput | null;
  missing: string[];
}

export function caseToPlanInput(c: CaseExtraction): CaseMapping {
  const missing: string[] = [];
  const date = c.event.date.value;
  if (!date) missing.push("data porodu / przyjęcia dziecka");
  const from = c.insurance.from.value;
  if (!from) missing.push("początek ubezpieczenia");
  const titleRaw = c.insurance.title.value;
  if (!titleRaw) missing.push("tytuł ubezpieczenia");
  if (missing.length > 0 || !date || !from || !titleRaw) return { input: null, missing };

  const eventType = c.event.type.value;
  const event = eventType === "adopcja" || eventType === "rodzina_zastepcza" ? eventType : "porod";
  // art. 2a covers both business owners and their collaborators → same engine title
  const title = titleRaw === "osoba_wspolpracujaca" ? "jdg" : titleRaw === "brak" ? "inne" : titleRaw;
  const sickness = titleRaw === "brak" ? "brak" : (c.insurance.sickness.value ?? (title === "umowa_o_prace" ? "obowiazkowe" : "dobrowolne"));
  const over20 = c.payerOver20Insured.value;

  const params = getParams(date);
  const base =
    c.wages.length > 0
      ? computeBase(
          {
            employee: title === "umowa_o_prace",
            fullTime: c.insurance.fullTime.value ?? undefined,
            voluntarySickness: sickness === "dobrowolne",
            months: c.wages.map((w) => ({ month: w.month, gross: w.gross })),
          },
          params,
        ).base
      : null;

  return {
    missing,
    input: {
      event,
      eventDate: date,
      children: c.children.value ?? 1,
      parentA: {
        base,
        contributionDebt: c.contributionDebt.value ?? undefined,
        periods: [
          {
            title,
            from,
            to: c.insurance.to.value,
            sickness,
            payerInsuredCount: over20 === null ? undefined : over20 ? 21 : 20,
          },
        ],
      },
      options: {
        variant: c.leave.fullLeaveRequested.value === false ? "100-70" : "81.5",
        applicationDate: c.applicationDate.value ?? undefined,
        paternityParts: 0,
      },
    },
  };
}

/** Does the engine verdict agree with the ZUS decision found in the file? */
export function compareWithDecision(eligible: boolean | null, c: CaseExtraction): "zgodny" | "rozbieżny" | "brak_decyzji" {
  const outcome = c.zusDecision.outcome.value;
  if (!outcome || outcome === "brak_informacji" || eligible === null) return "brak_decyzji";
  return (outcome === "przyznano") === eligible ? "zgodny" : "rozbieżny";
}

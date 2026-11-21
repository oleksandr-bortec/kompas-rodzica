import { describe, expect, it } from "vitest";
import { buildPlan } from "@/lib/engine";
import type { CaseExtraction } from "./case-schema";
import { caseToPlanInput, compareWithDecision } from "./to-plan-input";

const f = <T>(value: T | null, confidence = 0.95) => ({ value, confidence, page: 1 });
const sample = (over: Partial<CaseExtraction> = {}): CaseExtraction => ({
  documents: [{ form: "Z-3", page: 1 }],
  event: { type: f("porod"), date: f("2026-03-10") },
  children: f(1),
  claimant: f("matka"),
  insurance: { title: f("umowa_o_prace"), from: f("2022-01-01"), to: f(null), sickness: f("obowiazkowe"), fullTime: f(true) },
  payerOver20Insured: f(false),
  leave: { kinds: f(["macierzynski", "rodzicielski"]), from: f("2026-03-10"), to: f("2027-03-07"), fullLeaveRequested: f(true) },
  applicationDate: f("2026-03-20"),
  wages: Array.from({ length: 12 }, (_, i) => ({ month: `2025-${String(i + 1).padStart(2, "0")}`, gross: 6000 })),
  contributionDebt: f(null),
  zusDecision: { outcome: f("przyznano"), reason: f(null) },
  notes: [],
  ...over,
});

describe("case → engine input", () => {
  it("maps an employee case and computes the base from wages (−13.71%)", () => {
    const { input, missing } = caseToPlanInput(sample());
    expect(missing).toEqual([]);
    expect(input!.parentA.base).toBe(5177.4);
    expect(input!.parentA.periods[0].payerInsuredCount).toBe(20);
    const plan = buildPlan(input!);
    expect(plan.eligibility.A.eligible).toBe(true);
    expect(plan.payer.A).toBe("ZUS");
    expect(plan.variantApplied).toBe("81.5");
    expect(plan.monthly.A).toBe(4219.58);
  });
  it("reports missing essentials instead of guessing", () => {
    const { input, missing } = caseToPlanInput(sample({ event: { type: f("porod"), date: f(null) } }));
    expect(input).toBeNull();
    expect(missing).toContain("data porodu / przyjęcia dziecka");
  });
  it("osoba współpracująca is treated like JDG for the debt rule (art. 2a)", () => {
    const c = sample({
      insurance: { title: f("osoba_wspolpracujaca"), from: f("2022-01-01"), to: f(null), sickness: f("dobrowolne"), fullTime: f(null) },
      contributionDebt: f(300),
      zusDecision: { outcome: f("odmowa"), reason: f("zadłużenie") },
    });
    const plan = buildPlan(caseToPlanInput(c).input!);
    expect(plan.eligibility.A.eligible).toBe(false);
    expect(compareWithDecision(plan.eligibility.A.eligible, c)).toBe("zgodny");
  });
  it("no sickness insurance → no right; matches a refusal", () => {
    const c = sample({
      insurance: { title: f("umowa_zlecenie"), from: f("2025-01-01"), to: f(null), sickness: f("brak"), fullTime: f(null) },
      zusDecision: { outcome: f("odmowa"), reason: f("brak ubezpieczenia chorobowego") },
    });
    const plan = buildPlan(caseToPlanInput(c).input!);
    expect(plan.eligibility.A.eligible).toBe(false);
    expect(compareWithDecision(false, c)).toBe("zgodny");
  });
  it("comparison: mismatch and missing decision", () => {
    expect(compareWithDecision(false, sample())).toBe("rozbieżny");
    expect(compareWithDecision(true, sample({ zusDecision: { outcome: f("brak_informacji"), reason: f(null) } }))).toBe("brak_decyzji");
  });
});

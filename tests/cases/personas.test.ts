/**
 * End-to-end engine tests on the 4 demo personas (fake data).
 * Real ZUS sample cases go to tests/cases/zus/*.test.ts and read files from
 * zus-samples/ (gitignored) — they are never committed.
 */
import { describe, expect, it } from "vitest";
import { buildPlan } from "@/lib/engine";
import { getPersona } from "@/lib/personas/data";
import { personaToInput } from "@/lib/personas/to-engine";

describe("Ania + Tomek — UoP, large employer", () => {
  const plan = buildPlan(personaToInput(getPersona("ania")));
  it("has the right to maternity benefit, paid by the employer", () => {
    expect(plan.eligibility.A.eligible).toBe(true);
    expect(plan.payer.A).toBe("platnik");
    expect(plan.payer.B).toBe("platnik");
  });
  it("81.5% of 8200 = 6683 zł monthly; Tomek's parental 70% of 9500 = 6650 zł", () => {
    expect(plan.monthly.A).toBe(6683);
    expect(plan.monthly.B).toBe(6650);
  });
  it("20 weeks maternity + 32/9 split + 14 days paternity", () => {
    const kinds = plan.segments.map((s) => `${s.parent}:${s.kind}:${s.weeks}`);
    expect(kinds).toEqual(["A:macierzynski:20", "B:ojcowski:2", "A:rodzicielski:32", "B:rodzicielski:9"]);
  });
  it("deadline for 81.5% is 21 days after birth", () => {
    expect(plan.deadlines.find((d) => d.id === "combined-rate")?.date).toBe("2027-04-05");
  });
  it("has no errors", () => expect(plan.errors).toEqual([]));
});

describe("Kasia — JDG, voluntary sickness insurance, contribution debt", () => {
  const plan = buildPlan(personaToInput(getPersona("kasia")));
  it("is insured on the due date and passed 90 days", () => {
    expect(plan.eligibility.A.insuredOnEventDate).toBe(true);
    expect(plan.eligibility.A.sicknessWaitingDays).toBe(90);
    expect(plan.eligibility.A.sicknessBenefitEligible).toBe(true);
  });
  it("ZUS pays", () => expect(plan.payer.A).toBe("ZUS"));
  it("flags the debt as a risk and a TODO (rule missing in brief)", () => {
    expect(plan.risks.map((r) => r.id)).toContain("contribution-debt");
    expect(plan.todos.join(" ")).toMatch(/zaległości/i);
  });
});

describe("Ola — umowa zlecenie ends before birth", () => {
  const plan = buildPlan(personaToInput(getPersona("ola")));
  it("has no right — not insured on the day of birth", () => {
    expect(plan.eligibility.A.eligible).toBe(false);
    expect(plan.risks[0].id).toBe("no-insurance-on-event");
  });
  it("gets no leave segments", () => expect(plan.segments).toHaveLength(0));
});

describe("Ewa + Marek — adoption of a 3-year-old", () => {
  const plan = buildPlan(personaToInput(getPersona("ewa-marek")));
  it("has the right (child under 14)", () => expect(plan.eligibility.A.eligible).toBe(true));
  it("Ewa paid by ZUS (12 insured), Marek by employer (540)", () => {
    expect(plan.payer.A).toBe("ZUS");
    expect(plan.payer.B).toBe("platnik");
  });
  it("adoption leave length is a TODO, not a guess", () => {
    expect(plan.segments.some((s) => s.kind === "warunki_macierzynskiego")).toBe(false);
    expect(plan.todos.join(" ")).toMatch(/adopcji/);
  });
  it("paternity deadline: 12 months from the decision", () => {
    expect(plan.deadlines.find((d) => d.id === "paternity")?.date).toBe("2027-11-30");
  });
});

describe("options", () => {
  const ania = getPersona("ania");
  it("late application → 100% + 70%", () => {
    const plan = buildPlan(personaToInput(ania, { applicationDate: "2027-04-20" }));
    expect(plan.variantApplied).toBe("100-70");
    expect(plan.monthly.A).toBe(8200);
  });
  it("invalid split is reported as an error", () => {
    const plan = buildPlan(personaToInput(ania, { parentalWeeksA: 35, parentalWeeksB: 6 }));
    expect(plan.errors.length).toBeGreaterThan(0);
  });
  it("half-time work doubles the parental leave and leaves the amount as TODO", () => {
    const plan = buildPlan(personaToInput(ania, { workFractionA: 0.5 }));
    const seg = plan.segments.find((s) => s.parent === "A" && s.kind === "rodzicielski")!;
    expect(seg.weeks).toBe(64);
    expect(seg.monthlyAmount).toBeNull();
  });
  it("trace explains every step", () => {
    const plan = buildPlan(personaToInput(ania));
    expect(plan.trace.map((t) => t.id)).toEqual(
      expect.arrayContaining(["params", "insurance-A", "payer-A", "variant", "maternity", "parental-split"]),
    );
  });
});

import { describe, expect, it } from "vitest";
import { buildPlan } from "@/lib/engine";
import { getPersona } from "./data";
import { applyAnswers, kidsFromLabel, labelFromKids } from "./answers";
import { personaToInput } from "./to-engine";
import type { DemoPersona } from "./types";

const ania = getPersona("ania") as DemoPersona;

describe("onboarding answers change the plan", () => {
  it("no answers → persona unchanged", () => expect(applyAnswers(ania, undefined)).toBe(ania));
  it("new due date moves the plan", () => {
    const plan = buildPlan(personaToInput(applyAnswers(ania, { eventDate: "2027-05-10" })));
    expect(plan.segments[0].start).toBe("2027-05-10");
  });
  it("twins → 31 weeks of maternity leave and a 43-week pool", () => {
    const plan = buildPlan(personaToInput(applyAnswers(ania, { children: 2 })));
    const weeks = (kind: string) => plan.segments.filter((s) => s.kind === kind).reduce((n, s) => n + s.weeks, 0);
    expect(weeks("macierzynski")).toBe(31);
    expect(weeks("rodzicielski")).toBe(43);
  });
  it("„Za życiem” → 65-week parental pool", () => {
    const plan = buildPlan(personaToInput(applyAnswers(ania, { zaZyciem: true })));
    expect(plan.segments.filter((s) => s.kind === "rodzicielski").reduce((n, s) => n + s.weeks, 0)).toBe(65);
  });
  it("second parent not taking leave → only the first parent is planned", () => {
    const plan = buildPlan(personaToInput(applyAnswers(ania, { partner: false })));
    expect(plan.segments.every((s) => s.parent === "A")).toBe(true);
  });
  it("kids labels round-trip", () => {
    expect(kidsFromLabel("Bliźnięta")).toBe(2);
    expect(kidsFromLabel("Nie wiem")).toBeUndefined();
    expect(labelFromKids(3)).toBe("Troje lub więcej");
  });
});

import { describe, expect, it } from "vitest";
import { buildPlan } from "@/lib/engine";
import { customPersona, manualEntrySchema, personaToManualFields, wageMonths, type ManualFields } from "./manual-entry";
import { PERSONAS } from "./data";
import { personaToInput } from "./to-engine";

const fields: ManualFields = {
  event: "porod", eventDate: "2027-03-15", children: "1",
  parentA: {
    title: "umowa_o_prace", from: "2026-01-01", to: "", sickness: "obowiazkowe",
    payerInsuredCount: "25", base: "5000,50",
  },
};

describe("manual form → PlanInput", () => {
  it("maps dates, an open period, Polish decimal amounts and payer data", () => {
    const input = manualEntrySchema.parse(fields);
    expect(input.parentA).toEqual({
      name: "Rodzic 1", base: 5000.5, periods: [{
        title: "umowa_o_prace", from: "2026-01-01", to: null,
        sickness: "obowiazkowe", payerInsuredCount: 25,
      }],
    });
    expect(input.parentB).toBeUndefined();
    expect(input.eventDate).toBe(fields.eventDate);
    expect(input.children).toBe(1);
    const persona = customPersona(JSON.parse(JSON.stringify(fields)));
    expect(persona.id).toBe("custom");
    expect(personaToInput(persona)).toEqual(input);
    const plan = buildPlan(personaToInput(persona, { variant: "100-70" }));
    expect(plan.monthly.A).toBe(5000.5);
    expect(plan.payer.A).toBe("platnik");
  });

  it("maps adoption, multiple children and a second independent insurance period", () => {
    const input = manualEntrySchema.parse({
      ...fields, event: "adopcja", childAgeYears: "0", children: "3",
      parentB: { ...fields.parentA, title: "jdg", sickness: "dobrowolne", to: "2027-03-01", base: "0.00" },
    });
    expect(input).toMatchObject({
      event: "adopcja", children: 3, childAgeYears: 0,
      parentB: { name: "Rodzic 2", base: 0, periods: [{ title: "jdg", sickness: "dobrowolne", to: "2027-03-01" }] },
    });
    expect(buildPlan(input).eligibility.B?.insuredOnEventDate).toBe(false);
  });

  it("keeps unknown values distinct from zero", () => {
    const input = manualEntrySchema.parse({
      ...fields, parentA: { ...fields.parentA, base: "", payerInsuredCount: "" },
    });
    expect(input.parentA.base).toBeNull();
    expect(input.parentA.periods[0].payerInsuredCount).toBeUndefined();
    expect(buildPlan(input).monthly.A).toBeNull();
    expect(buildPlan(input).payer.A).toBe("nieznany");
  });

  it.each([
    { eventDate: "2027-02-29" }, { children: "0" }, { children: "1.5" },
    { parentB: { ...fields.parentA, to: "2025-12-31" } },
    { parentA: { ...fields.parentA, base: "-50" } },
    { parentA: { ...fields.parentA, payerInsuredCount: "2,5" } },
  ])("rejects invalid input %j", changes => {
    expect(manualEntrySchema.safeParse({ ...fields, ...changes }).success).toBe(false);
  });

  it("lists the 12 months before the event month, newest first", () => {
    expect(wageMonths("2027-03-15")).toEqual([
      "2027-02", "2027-01", "2026-12", "2026-11", "2026-10", "2026-09",
      "2026-08", "2026-07", "2026-06", "2026-05", "2026-04", "2026-03",
    ]);
  });

  it("computes the base from 12 months of wages when no base is typed (avg − 13.71%)", () => {
    const input = manualEntrySchema.parse({
      ...fields, parentA: { ...fields.parentA, base: "", wages: Array(12).fill("6000"), fullTime: true },
    });
    expect(input.parentA.base).toBe(5177.4);
  });

  it("raises a full-time employee to the minimum base", () => {
    const input = manualEntrySchema.parse({
      ...fields, parentA: { ...fields.parentA, base: "", wages: ["3000", "3000", "", ""], fullTime: true },
    });
    expect(input.parentA.base).toBe(4147.1);
  });

  it("a typed base wins over wages", () => {
    const input = manualEntrySchema.parse({ ...fields, parentA: { ...fields.parentA, wages: Array(12).fill("9000") } });
    expect(input.parentA.base).toBe(5000.5);
  });

  it.each(PERSONAS.map((p) => [p.id, p] as const))("„Popraw” prefill reproduces the same plan for %s", (_id, persona) => {
    const fromForm = buildPlan(manualEntrySchema.parse(personaToManualFields(persona)));
    const original = buildPlan(personaToInput(persona));
    expect(fromForm.eligibility.A.eligible).toBe(original.eligibility.A.eligible);
    expect(fromForm.payer).toEqual(original.payer);
    expect(fromForm.monthly).toEqual(original.monthly);
    expect(fromForm.segments.map((s) => [s.kind, s.weeks])).toEqual(original.segments.map((s) => [s.kind, s.weeks]));
  });
});

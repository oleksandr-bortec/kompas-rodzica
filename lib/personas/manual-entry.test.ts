import { describe, expect, it } from "vitest";
import { buildPlan } from "@/lib/engine";
import { customPersona, manualEntrySchema, type ManualFields } from "./manual-entry";
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
});

import { afterEach, describe, expect, it } from "vitest";
import { getParams, setRuntimeVersions } from "./index";
import { withEdits } from "./runtime";
import { buildPlan } from "../plan";

afterEach(() => setRuntimeVersions([]));

describe("parameter versions from the admin panel", () => {
  it("a new version applies from its effective date", () => {
    const base = getParams("2027-01-01");
    setRuntimeVersions([withEdits(base, { "parental.ratePercent": 75 }, "2027-01-01")]);
    expect(getParams("2026-12-31").parental.ratePercent).toBe(70);
    expect(getParams("2027-03-15").parental.ratePercent).toBe(75);
  });
  it("the engine recalculates with the new value", () => {
    const input = {
      event: "porod" as const,
      eventDate: "2027-03-15",
      parentA: { base: 8000, periods: [{ title: "umowa_o_prace" as const, from: "2020-01-01", to: null, sickness: "obowiazkowe" as const, payerInsuredCount: 50 }] },
      options: { variant: "100-70" as const },
    };
    const before = buildPlan(input).segments.find((s) => s.kind === "rodzicielski")!.monthlyAmount;
    setRuntimeVersions([withEdits(getParams("2027-01-01"), { "parental.ratePercent": 75 }, "2027-01-01")]);
    const after = buildPlan(input).segments.find((s) => s.kind === "rodzicielski")!.monthlyAmount;
    expect(before).toBe(5600);
    expect(after).toBe(6000);
  });
  it("edits are applied to a copy (shipped JSON stays unchanged)", () => {
    const base = getParams("2026-06-01");
    const v = withEdits(base, { "maternity.weeksOneChild": 21 }, "2027-01-01");
    expect(v.maternity.weeksOneChild).toBe(21);
    expect(base.maternity.weeksOneChild).toBe(20);
    expect(v.version).toBe("admin-2027-01-01");
  });
});

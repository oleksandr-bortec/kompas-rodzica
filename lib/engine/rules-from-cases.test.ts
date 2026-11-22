/** Rules added after checking the engine against ZUS sample cases (cases themselves stay outside the repo). */
import { describe, expect, it } from "vitest";
import { buildPlan } from "./plan";
import type { PlanInput } from "./types";

const base = (period: Partial<PlanInput["parentA"]["periods"][number]>, eventDate = "2026-04-20"): PlanInput => ({
  event: "porod",
  eventDate,
  parentA: {
    base: 6000,
    periods: [{ title: "umowa_o_prace", from: "2020-01-01", to: null, sickness: "obowiazkowe", payerInsuredCount: 50, ...period }],
  },
});

describe("payer after insurance ends (art. 61 ust. 1 pkt 2 lit. d)", () => {
  it("fixed-term contract extended to the day of birth → ZUS pays, even at a large employer", () => {
    const plan = buildPlan(base({ from: "2024-03-01", to: "2026-04-10", fixedTerm: true, payerInsuredCount: 150 }, "2026-04-10"));
    expect(plan.eligibility.A.eligible).toBe(true);
    expect(plan.payer.A).toBe("ZUS");
  });
  it("ongoing contract at a large employer → employer pays", () => {
    expect(buildPlan(base({ payerInsuredCount: 150 })).payer.A).toBe("platnik");
  });
});

describe("risk: insurance title started during pregnancy", () => {
  it("employment ~11 weeks before birth → warning about a sham contract", () => {
    const plan = buildPlan(base({ from: "2026-02-02" }));
    expect(plan.risks.find((r) => r.id === "insurance-started-in-pregnancy")?.severity).toBe("warning");
    expect(plan.eligibility.A.eligible).toBe(true); // the engine does not decide on sham contracts — ZUS does
  });
  it("long employment → no such warning", () => {
    expect(buildPlan(base({})).risks.map((r) => r.id)).not.toContain("insurance-started-in-pregnancy");
  });
});

describe("risk: voluntary insurance ends when maternity benefit starts", () => {
  it("JDG with voluntary sickness insurance → reminder to re-register", () => {
    const plan = buildPlan(base({ title: "jdg", sickness: "dobrowolne", payerInsuredCount: undefined }));
    expect(plan.risks.map((r) => r.id)).toContain("voluntary-reregister");
  });
  it("employee (mandatory insurance) → no reminder", () => {
    expect(buildPlan(base({})).risks.map((r) => r.id)).not.toContain("voluntary-reregister");
  });
});

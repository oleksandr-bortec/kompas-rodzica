import { describe, expect, it } from "vitest";
import { buildPlan } from "./plan";
import type { PlanInput } from "./types";

const uop = (count: number) => ({ title: "umowa_o_prace" as const, from: "2020-01-01", to: null, sickness: "obowiazkowe" as const, payerInsuredCount: count });
const base: PlanInput = { event: "porod", eventDate: "2027-03-15", parentA: { base: 8000, periods: [uop(214)] } };
const ids = (p: ReturnType<typeof buildPlan>) => p.documents.map((d) => d.id);

describe("documents — what, where, until when", () => {
  it("employee, large employer: one application to the employer within 21 days + birth certificate", () => {
    const p = buildPlan(base);
    expect(ids(p)).toEqual(["leave-application-A", "birth-certificate"]);
    const app = p.documents[0];
    expect(app.where).toBe("pracodawca");
    expect(app.deadline).toBe("2027-04-05");
  });
  it("employee, small employer (ZUS pays): employer sends Z-3 to ZUS", () => {
    const p = buildPlan({ ...base, parentA: { base: 8000, periods: [uop(12)] } });
    expect(ids(p)).toContain("z3-A");
  });
  it("umowa zlecenie: ZAM to ZUS + Z-3a from the payer", () => {
    const p = buildPlan({ ...base, parentA: { base: 4000, periods: [{ title: "umowa_zlecenie", from: "2020-01-01", to: null, sickness: "dobrowolne", payerInsuredCount: 5 }] } });
    expect(ids(p)).toEqual(expect.arrayContaining(["zam-A", "z3a-A", "birth-certificate"]));
    expect(p.documents.find((d) => d.id === "zam-A")?.form).toBe("ZAM");
  });
  it("JDG: ZAM + ZAS-53", () => {
    const p = buildPlan({ ...base, parentA: { base: 5000, periods: [{ title: "jdg", from: "2020-01-01", to: null, sickness: "dobrowolne" }] } });
    expect(ids(p)).toEqual(expect.arrayContaining(["zam-A", "zas53-A"]));
  });
  it("second parent (employee): paternity 7 days before, parental 21 days before", () => {
    const p = buildPlan({ ...base, parentB: { base: 9000, periods: [uop(87)] } });
    const pat = p.documents.find((d) => d.id === "paternity-B")!;
    const par = p.documents.find((d) => d.id === "parental-B")!;
    const patSeg = p.segments.find((s) => s.parent === "B" && s.kind === "ojcowski")!;
    expect(pat.deadline).toBe("2027-03-22"); // start 2027-03-29 − 7
    expect(patSeg.start).toBe("2027-03-29");
    const parSeg = p.segments.find((s) => s.parent === "B" && s.kind === "rodzicielski")!;
    expect(par.deadline! < parSeg.start).toBe(true);
  });
  it("adoption: application within 7 days + court document", () => {
    const p = buildPlan({ event: "adopcja", eventDate: "2026-12-01", childAgeYears: 3, parentA: { base: 6000, periods: [uop(12)] } });
    expect(p.documents[0].deadline).toBe("2026-12-08");
    expect(ids(p)).toContain("court-document");
  });
  it("no right → no application documents", () => {
    const p = buildPlan({ ...base, parentA: { base: 4000, periods: [{ title: "umowa_zlecenie", from: "2026-01-01", to: "2027-01-31", sickness: "dobrowolne" }] } });
    expect(p.documents).toEqual([]);
  });
  it("sorted by deadline, undated last", () => {
    const p = buildPlan({ ...base, parentB: { base: 9000, periods: [uop(87)] } });
    const dated = p.documents.filter((d) => d.deadline).map((d) => d.deadline!);
    expect(dated).toEqual([...dated].sort());
    expect(p.documents[p.documents.length - 1].deadline).toBeNull();
  });
});

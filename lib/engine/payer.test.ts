import { describe, expect, it } from "vitest";
import { getParams } from "./params";
import { determinePayer } from "./payer";
import type { InsurancePeriod } from "./types";

const params = getParams("2026-06-01");
const at = "2027-03-15";
const uop = (count?: number): InsurancePeriod => ({
  title: "umowa_o_prace",
  from: "2020-01-01",
  to: null,
  sickness: "obowiazkowe",
  payerInsuredCount: count,
});

describe("who pays (> 20 insured → płatnik)", () => {
  it("21 insured → płatnik", () => expect(determinePayer([uop(21)], at, params)).toBe("platnik"));
  it("exactly 20 insured → ZUS", () => expect(determinePayer([uop(20)], at, params)).toBe("ZUS"));
  it("5 insured → ZUS", () => expect(determinePayer([uop(5)], at, params)).toBe("ZUS"));
  it("JDG → ZUS", () =>
    expect(determinePayer([{ title: "jdg", from: "2026-01-01", to: null, sickness: "dobrowolne" }], at, params)).toBe("ZUS"));
  it("unknown insured count → nieznany", () => expect(determinePayer([uop(undefined)], at, params)).toBe("nieznany"));
  it("no insurance → nieznany", () => expect(determinePayer([], at, params)).toBe("nieznany"));
  it("threshold comes from params", () => {
    const changed = { ...params, payer: { ...params.payer, employerPaysAboveInsured: 50 } };
    expect(determinePayer([uop(30)], at, changed)).toBe("ZUS");
  });
});

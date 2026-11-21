import { describe, expect, it } from "vitest";
import { getParams } from "./params";
import {
  applyContractExtension,
  continuousInsuranceDays,
  isInsuredOn,
  sicknessWaitingDays,
  endOfThirdMonthOfPregnancy,
} from "./eligibility";
import type { InsurancePeriod } from "./types";

const params = getParams("2026-06-01");
const uop = (from: string, to: string | null, extra: Partial<InsurancePeriod> = {}): InsurancePeriod => ({
  title: "umowa_o_prace",
  from,
  to,
  sickness: "obowiazkowe",
  payerInsuredCount: 50,
  ...extra,
});

describe("insurance on a date", () => {
  it("is insured inside an open-ended period", () => {
    expect(isInsuredOn([uop("2020-01-01", null)], "2027-03-15")).toBe(true);
  });
  it("is not insured after the contract ended", () => {
    expect(isInsuredOn([uop("2020-01-01", "2027-01-31")], "2027-02-20")).toBe(false);
  });
  it("is not insured when sickness insurance is 'brak'", () => {
    expect(isInsuredOn([{ ...uop("2020-01-01", null), title: "umowa_zlecenie", sickness: "brak" }], "2027-02-20")).toBe(false);
  });
});

describe("waiting period for sickness benefit (30 / 90 days)", () => {
  it("mandatory insurance: 30 days", () => {
    expect(sicknessWaitingDays([uop("2026-01-01", null)], "2026-03-01", params)).toBe(30);
  });
  it("voluntary insurance: 90 days", () => {
    const jdg: InsurancePeriod = { title: "jdg", from: "2026-05-01", to: null, sickness: "dobrowolne" };
    expect(sicknessWaitingDays([jdg], "2026-08-01", params)).toBe(90);
  });
  it("counts completed days of uninterrupted insurance", () => {
    expect(continuousInsuranceDays([uop("2026-01-01", null)], "2026-01-31")).toBe(30);
    expect(continuousInsuranceDays([uop("2026-01-01", null)], "2026-01-30")).toBe(29);
  });
  it("joins adjacent periods without a gap", () => {
    const periods = [uop("2026-01-01", "2026-01-15"), uop("2026-01-16", null)];
    expect(continuousInsuranceDays(periods, "2026-02-01")).toBe(31);
  });
  it("a gap breaks continuity", () => {
    const periods = [uop("2026-01-01", "2026-01-15"), uop("2026-01-20", null)];
    expect(continuousInsuranceDays(periods, "2026-02-01")).toBe(12);
  });
});

describe("Labour Code: fixed-term contract extended to birth", () => {
  it("extends a contract ending after the 3rd month of pregnancy", () => {
    const due = "2027-03-15";
    expect(endOfThirdMonthOfPregnancy(due)).toBe("2026-09-07");
    const [p] = applyContractExtension([uop("2025-01-01", "2026-12-31", { fixedTerm: true })], due);
    expect(p.to).toBe(due);
  });
  it("does not extend a contract ending before the end of the 3rd month", () => {
    const [p] = applyContractExtension([uop("2025-01-01", "2026-08-31", { fixedTerm: true })], "2027-03-15");
    expect(p.to).toBe("2026-08-31");
  });
  it("does not extend umowa zlecenie", () => {
    const [p] = applyContractExtension(
      [{ title: "umowa_zlecenie", from: "2026-01-01", to: "2027-01-31", sickness: "dobrowolne", fixedTerm: true }],
      "2027-02-20",
    );
    expect(p.to).toBe("2027-01-31");
  });
});

import { yearsPl } from "./eligibility";
describe("yearsPl", () => {
  it("polish plural", () => {
    expect(yearsPl(1)).toBe("1 rok");
    expect(yearsPl(3)).toBe("3 lata");
    expect(yearsPl(7)).toBe("7 lat");
    expect(yearsPl(14)).toBe("14 lat");
    expect(yearsPl(22)).toBe("22 lata");
  });
});

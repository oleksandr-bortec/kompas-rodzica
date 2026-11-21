import { describe, expect, it } from "vitest";
import { getParams } from "./params";
import { combinedRateDeadline, monthlyBenefit, ratePercent, resolveVariant } from "./amounts";
import { percentOf } from "./money";

const params = getParams("2026-06-01");

describe("rates", () => {
  it("variant 81.5%: mother's maternity and parental at 81.5%", () => {
    expect(ratePercent("macierzynski", "A", "81.5", params)).toBe(81.5);
    expect(ratePercent("rodzicielski", "A", "81.5", params)).toBe(81.5);
  });
  it("variant 100% + 70%", () => {
    expect(ratePercent("macierzynski", "A", "100-70", params)).toBe(100);
    expect(ratePercent("rodzicielski", "A", "100-70", params)).toBe(70);
  });
  it("paternity and supplementary always 100%", () => {
    expect(ratePercent("ojcowski", "B", "81.5", params)).toBe(100);
    expect(ratePercent("uzupelniajacy", "A", "81.5", params)).toBe(100);
  });
  it("second parent's parental leave at 70%", () => expect(ratePercent("rodzicielski", "B", "81.5", params)).toBe(70));
});

describe("monthly amounts", () => {
  it("8200 × 81.5% = 6683.00", () => expect(monthlyBenefit(8200, 81.5)).toBe(6683));
  it("9500 × 70% = 6650.00", () => expect(monthlyBenefit(9500, 70)).toBe(6650));
  it("rounds to the grosz", () => expect(percentOf(4321.11, 81.5)).toBe(3521.7));
  it("unknown base → null (no guessing)", () => expect(monthlyBenefit(null, 100)).toBeNull());
});

describe("21-day deadline for 81.5%", () => {
  it("deadline is 21 days after birth", () => expect(combinedRateDeadline("2027-03-15", params)).toBe("2027-04-05"));
  it("on time keeps 81.5%", () =>
    expect(resolveVariant("81.5", "2027-03-15", "2027-04-05", params)).toEqual({ variant: "81.5", lateApplication: false }));
  it("late falls back to 100% + 70%", () =>
    expect(resolveVariant("81.5", "2027-03-15", "2027-04-06", params)).toEqual({ variant: "100-70", lateApplication: true }));
});

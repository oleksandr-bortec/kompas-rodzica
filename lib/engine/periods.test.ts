import { describe, expect, it } from "vitest";
import { getParams } from "./params";
import {
  defaultParentalSplit,
  extendForPartTimeWork,
  leaveEnd,
  maternityWeeks,
  parentalDeadline,
  parentalPoolWeeks,
  paternityDeadline,
  stillbirthLeaveEnd,
  validateParentalSplit,
  validatePaternityParts,
} from "./periods";

const params = getParams("2026-06-01");

describe("maternity leave", () => {
  it("20 weeks for one child", () => expect(maternityWeeks(1, params)).toBe(20));
  it("unknown for twins (missing in ZUS brief) → null, not a guess", () => expect(maternityWeeks(2, params)).toBeNull());
  it("20 weeks from birth ends the day before week 21", () => expect(leaveEnd("2027-03-15", 20)).toBe("2027-08-01"));
});

describe("parental leave", () => {
  it("pool 41 weeks for one child, 43 for more", () => {
    expect(parentalPoolWeeks(1, false, params)).toBe(41);
    expect(parentalPoolWeeks(2, false, params)).toBe(43);
  });
  it("'Za życiem' pool is missing in the brief → null", () => expect(parentalPoolWeeks(1, true, params)).toBeNull());
  it("default split keeps 9 weeks for the second parent", () => {
    expect(defaultParentalSplit(41, true, params)).toEqual({ a: 32, b: 9 });
    expect(defaultParentalSplit(41, false, params)).toEqual({ a: 32, b: 0 });
  });
  it("one parent cannot take the other's 9 non-transferable weeks", () => {
    expect(validateParentalSplit(41, 33, 8, params)).not.toHaveLength(0);
    expect(validateParentalSplit(41, 32, 9, params)).toHaveLength(0);
    expect(validateParentalSplit(41, 20, 21, params)).toHaveLength(0);
  });
  it("sum cannot exceed the pool", () => expect(validateParentalSplit(41, 32, 10, params)).not.toHaveLength(0));
  it("half-time work doubles the leave length", () => expect(extendForPartTimeWork(32, 0.5, params)).toBe(64));
  it("work above ½ etatu is not allowed", () => expect(extendForPartTimeWork(32, 0.75, params)).toBeNull());
  it("usable until 31.12 of the year the child turns 6", () => expect(parentalDeadline("2027-03-15", params)).toBe("2033-12-31"));
});

describe("paternity leave", () => {
  it("until the child is 12 months old", () => expect(paternityDeadline("porod", "2027-03-15", params)).toBe("2028-03-14"));
  it("adoption: 12 months from the decision", () =>
    expect(paternityDeadline("adopcja", "2026-12-01", params, 3)).toBe("2027-11-30"));
  it("adoption: not beyond the child's 14th birthday", () =>
    expect(paternityDeadline("adopcja", "2026-12-01", params, 13.5)).toBe("2027-05-31"));
  it("14 days in one part or two parts of ≥ 7 days", () => {
    expect(validatePaternityParts([14], params)).toHaveLength(0);
    expect(validatePaternityParts([7, 7], params)).toHaveLength(0);
    expect(validatePaternityParts([10, 4], params)).not.toHaveLength(0);
    expect(validatePaternityParts([7, 7, 7], params)).not.toHaveLength(0);
  });
});

describe("stillbirth / death of the child", () => {
  it("stillbirth: 8 weeks after birth", () => expect(stillbirthLeaveEnd("2027-03-15", "2027-03-15", params)).toBe("2027-05-09"));
  it("death at week 7: at least 7 days after death", () =>
    expect(stillbirthLeaveEnd("2027-03-15", "2027-05-05", params)).toBe("2027-05-11"));
  it("death after 8 weeks: 7 days after death", () =>
    expect(stillbirthLeaveEnd("2027-03-15", "2027-06-01", params)).toBe("2027-06-07"));
});

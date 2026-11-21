import { describe, expect, it } from "vitest";
import { getParams } from "./params";
import {
  adoptionLeaveWeeks,
  defaultParentalSplit,
  extendForPartTimeWork,
  leaveEnd,
  maternityWeeks,
  parentalDeadline,
  parentalPoolWeeks,
  paternityDeadline,
  stillbirthLeaveEnd,
  supplementaryWeeks,
  validateParentalSplit,
  validatePaternityParts,
} from "./periods";

const params = getParams("2026-06-01");

describe("maternity leave", () => {
  it("20 weeks for one child", () => expect(maternityWeeks(1, params)).toBe(20));
  it("31 / 33 / 35 / 37 weeks for 2 / 3 / 4 / 5+ children (Załącznik ZUS)", () => {
    expect([2, 3, 4, 5, 7].map((n) => maternityWeeks(n, params))).toEqual([31, 33, 35, 37, 37]);
  });
  it("adoption: same lengths, never below 9 weeks", () => {
    expect(adoptionLeaveWeeks(1, params)).toBe(20);
    expect(adoptionLeaveWeeks(2, params)).toBe(31);
    expect(adoptionLeaveWeeks(1, { ...params, adoption: { ...params.adoption, weeksByChildren: { ...params.adoption.weeksByChildren, "1": 5 } } })).toBe(9);
  });
  it("20 weeks from birth ends the day before week 21", () => expect(leaveEnd("2027-03-15", 20)).toBe("2027-08-01"));
});

describe("parental leave", () => {
  it("pool 41 weeks for one child, 43 for more", () => {
    expect(parentalPoolWeeks(1, false, params)).toBe(41);
    expect(parentalPoolWeeks(2, false, params)).toBe(43);
  });
  it("'Za życiem' pool: 65 weeks (1 child), 67 (more)", () => {
    expect(parentalPoolWeeks(1, true, params)).toBe(65);
    expect(parentalPoolWeeks(2, true, params)).toBe(67);
  });
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

describe("supplementary maternity leave", () => {
  it("1 week per started week in hospital", () => expect(supplementaryWeeks(10, false, params)).toBe(2));
  it("capped at 8 weeks (other cases)", () => expect(supplementaryWeeks(90, false, params)).toBe(8));
  it("capped at 15 weeks (< 28th week or ≤ 1000 g)", () => expect(supplementaryWeeks(140, true, params)).toBe(15));
  it("no hospitalisation → 0", () => expect(supplementaryWeeks(0, true, params)).toBe(0));
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

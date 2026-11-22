import { describe, expect, it } from "vitest";
import { getParams } from "./params";
import { computeBase, minimumBase, voluntaryMaximumBase } from "./base";

const params = getParams("2026-06-01");
const months = (gross: number, n = 12) =>
  Array.from({ length: n }, (_, i) => ({ month: `2026-${String(12 - i).padStart(2, "0")}`, gross }));

describe("podstawa wymiaru (Załącznik ZUS)", () => {
  it("minimum base 2026: 4806 zł − 13.71% = 4147.10 zł", () => expect(minimumBase(params)).toBe(4147.1));
  it("voluntary maximum: 23 550 zł − 13.71% = 20 321.30 zł (as in the annex)", () =>
    expect(voluntaryMaximumBase(params)).toBe(20321.3));

  it("employee: average of 12 months minus 13.71%", () => {
    const r = computeBase({ employee: true, fullTime: true, months: months(9500) }, params);
    expect(r.base).toBe(8197.55);
    expect(r.monthsUsed).toBe(12);
  });
  it("uses only the 12 most recent months", () => {
    const r = computeBase({ employee: true, months: [...months(5000), { month: "2025-12", gross: 99999 }] }, params);
    expect(r.averageGross).toBe(5000);
  });
  it("shorter insurance: average of full months available", () => {
    const r = computeBase({ employee: true, months: months(6000, 4) }, params);
    expect(r.monthsUsed).toBe(4);
    expect(r.base).toBe(5177.4);
  });
  it("skips months worked less than half", () => {
    const r = computeBase(
      { employee: true, months: [...months(6000, 3), { month: "2026-08", gross: 500, workedAtLeastHalf: false }] },
      params,
    );
    expect(r.monthsUsed).toBe(3);
  });
  it("full-time employee is raised to the minimum base", () => {
    const r = computeBase({ employee: true, fullTime: true, months: months(3000) }, params);
    expect(r.base).toBe(4147.1);
    expect(r.raisedToMinimum).toBe(true);
  });
  it("part-time employee is not raised", () => {
    const r = computeBase({ employee: true, fullTime: false, months: months(3000) }, params);
    expect(r.base).toBe(2588.7);
  });
  it("voluntary sickness insurance is capped", () => {
    const r = computeBase({ employee: false, voluntarySickness: true, months: months(30000) }, params);
    expect(r.base).toBe(20321.3);
    expect(r.cappedAtMaximum).toBe(true);
  });
  it("no months → null (no guessing)", () => expect(computeBase({ employee: true, months: [] }, params).base).toBeNull());
});

describe("parameters by year", () => {
  it("2025: minimum base 4 666 zł − 13,71% = 4 026,29 zł", () => expect(minimumBase(getParams("2025-09-26"))).toBe(4026.29));
  it("2026: minimum base 4 806 zł − 13,71% = 4 147,10 zł", () => expect(minimumBase(getParams("2026-03-01"))).toBe(4147.1));
  it("2025: debt threshold 1% of 4 666 zł = 46,66 zł", () => expect(Math.round(getParams("2025-06-01").base.minimumWage) / 100).toBe(46.66));
});

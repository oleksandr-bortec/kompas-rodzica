import { describe, expect, it } from "vitest";
import { addDays, addMonths, addWeeks, diffDays, endOfYear } from "./dates";

describe("dates", () => {
  it("adds days across month/year boundaries", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2027-03-01", -1)).toBe("2027-02-28");
  });
  it("adds weeks", () => {
    expect(addWeeks("2027-03-15", 20)).toBe("2027-08-02");
  });
  it("adds months clamping to month end", () => {
    expect(addMonths("2027-01-31", 1)).toBe("2027-02-28");
    expect(addMonths("2028-01-31", 1)).toBe("2028-02-29");
  });
  it("diffs days", () => {
    expect(diffDays("2026-01-01", "2026-01-31")).toBe(30);
  });
  it("end of year", () => {
    expect(endOfYear("2033-03-15")).toBe("2033-12-31");
  });
});

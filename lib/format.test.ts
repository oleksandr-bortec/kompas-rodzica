import { expect, it } from "vitest";
import { daysUntil } from "./format";

it.each([
  ["2026-11-22", "2026-11-21T07:00:00Z", 1],
  ["2026-11-22", "2026-11-21T22:59:59Z", 1],
  ["2026-11-22", "2026-11-21T23:00:00Z", 0],
  ["2026-11-20", "2026-11-21T23:00:00Z", -2],
  ["2026-03-30", "2026-03-28T23:00:00Z", 1],
  ["2026-10-26", "2026-10-24T22:00:00Z", 1],
] as const)("counts calendar days to %s from %s", (target, instant, expected) => {
  expect(daysUntil(target, new Date(instant))).toBe(expected);
});

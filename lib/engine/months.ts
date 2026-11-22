/**
 * Month-by-month view of a plan for the chart: for each calendar month, the
 * full-month benefit of the segment active in the middle of that month.
 * TODO(ZUS): partial months (daily rate) are not described in the brief —
 * the chart shows full-month amounts only.
 */
import { addMonths } from "./dates";
import type { Plan } from "./types";

export interface MonthAmount {
  month: string; // YYYY-MM
  a: number;
  b: number;
  /** Payment % of the segment active mid-month (0 = none). */
  rateA: number;
  rateB: number;
}

export function planMonths(plan: Plan, fromDate: string, months = 14): MonthAmount[] {
  const startMonth = `${fromDate.slice(0, 7)}-15`;
  return Array.from({ length: months }, (_, i) => {
    const mid = addMonths(startMonth, i);
    const amount = (parent: "A" | "B") => {
      const segs = plan.segments.filter((s) => s.parent === parent && s.start <= mid && s.end >= mid);
      return segs.reduce((sum, s) => sum + (s.monthlyAmount ?? 0), 0);
    };
    const rate = (parent: "A" | "B") =>
      Math.max(0, ...plan.segments.filter((s) => s.parent === parent && s.start <= mid && s.end >= mid).map((s) => s.ratePercent));
    return { month: mid.slice(0, 7), a: amount("A"), b: amount("B"), rateA: rate("A"), rateB: rate("B") };
  });
}

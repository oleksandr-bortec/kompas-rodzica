import type { Persona } from "./types";
import type { MonthRow } from "@/components/kr/monthly-chart";

/**
 * UI-only helper for the skeleton: spreads demo monthly amounts over months.
 * Replaced by engine output in step 3 — do not add business rules here.
 */
export function demoMonths(p: Persona, months = 14): MonthRow[] {
  const start = new Date(p.eventDate + "T12:00:00");
  const fmt = new Intl.DateTimeFormat("pl-PL", { month: "short" });
  return Array.from({ length: months }, (_, m) => {
    const week = m * 4.345 + 2;
    const active = (parent: "A" | "B") =>
      p.demoPlan.segments.find((s) => s.parent === parent && week >= s.startWeek && week < s.startWeek + s.weeks);
    const d = new Date(start);
    d.setMonth(d.getMonth() + m);
    return {
      month: fmt.format(d).replace(".", ""),
      a: active("A") ? p.demoPlan.monthlyA : 0,
      b: active("B") ? p.demoPlan.monthlyB ?? 0 : 0,
    };
  });
}

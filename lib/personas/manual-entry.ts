import { z } from "zod";
import { InsurancePeriodSchema, PlanInputSchema, type ParentInput, type PlanInput } from "@/lib/engine/types";
import { computeBase } from "@/lib/engine/base";
import { addMonths } from "@/lib/engine/dates";
import { getParams } from "@/lib/engine/params";
import type { CustomPersona, DemoPersona, ParentData } from "./types";

const date = z.iso.date("Podaj poprawną datę.");
const whole = z.string().trim().regex(/^\d+$/, "Podaj liczbę całkowitą.").transform(Number);
const optionalWhole = z.union([z.literal("").transform(() => undefined), whole]);
const amount = z.string().trim().regex(/^\d+(?:[.,]\d{1,2})?$/, "Podaj kwotę w złotych, maksymalnie dwa miejsca po przecinku.")
  .transform(value => Number(value.replace(",", ".")));

const parentForm = z.object({
  title: InsurancePeriodSchema.shape.title,
  from: date,
  to: z.union([z.literal(""), date]),
  sickness: InsurancePeriodSchema.shape.sickness,
  payerInsuredCount: optionalWhole,
  base: z.union([z.literal("").transform(() => null), amount]),
  /** Optional: contribution debt in zł (matters for business owners — art. 2a). */
  contributionDebt: z.union([z.literal("").transform(() => undefined), amount]).optional(),
  /** Optional: gross income of the 12 months before the event month (index 0 = month right before). */
  wages: z.array(z.union([z.literal("").transform(() => null), amount])).max(12).optional(),
  fullTime: z.boolean().optional(),
}).refine(p => !p.to || p.from <= p.to, {
  path: ["to"], message: "Data końca musi przypadać w dniu rozpoczęcia lub później.",
});

/** The 12 calendar months before the event month, newest first: ["2026-02", "2026-01", …]. */
export function wageMonths(eventDate: string): string[] {
  const first = `${eventDate.slice(0, 7)}-01`;
  return Array.from({ length: 12 }, (_, i) => addMonths(first, -(i + 1)).slice(0, 7));
}

/**
 * Base: typed directly, or computed by the engine from the 12 months of wages
 * (average − 13.71%, minimum for full time, cap for voluntary insurance).
 */
function toParent(p: z.output<typeof parentForm>, name: string, eventDate: string): ParentInput {
  const { base, to, wages, fullTime, contributionDebt, ...period } = p;
  let finalBase = base;
  const months = wageMonths(eventDate);
  const filled = (wages ?? []).flatMap((gross, i) => (gross === null ? [] : [{ month: months[i], gross }]));
  if (finalBase === null && filled.length > 0) {
    finalBase = computeBase(
      { employee: p.title === "umowa_o_prace", fullTime, voluntarySickness: p.sickness === "dobrowolne", months: filled },
      getParams(eventDate),
    ).base;
  }
  return { name, base: finalBase, contributionDebt, periods: [{ ...period, to: to || null }] };
}

export const manualEntrySchema = z.object({
  event: PlanInputSchema.shape.event.extract(["porod", "adopcja"]),
  eventDate: date,
  children: whole.pipe(PlanInputSchema.shape.children.unwrap()),
  childAgeYears: optionalWhole.optional(),
  parentA: parentForm,
  parentB: parentForm.optional(),
}).transform((v): PlanInput => ({
  event: v.event, eventDate: v.eventDate, children: v.children,
  childAgeYears: v.event === "adopcja" ? v.childAgeYears : undefined,
  parentA: toParent(v.parentA, "Rodzic 1", v.eventDate),
  parentB: v.parentB ? toParent(v.parentB, "Rodzic 2", v.eventDate) : undefined,
})).pipe(PlanInputSchema);

export type ManualFields = z.input<typeof manualEntrySchema>;

function displayParent(p: ParentInput): ParentData {
  return {
    name: p.name!, avgMonthlyBase: p.base, ezla: [],
    periods: p.periods.map(v => ({ ...v, payerName: "", sicknessInsurance: v.sickness })),
  };
}

export function customPersona(fields: ManualFields): CustomPersona {
  const input = manualEntrySchema.parse(fields);
  return {
    id: "custom", label: "Twój profil", tagline: "Dane wpisane przez Ciebie",
    event: fields.event, eventDate: input.eventDate, children: input.children,
    childAgeYears: input.childAgeYears, a: displayParent(input.parentA),
    b: input.parentB ? displayParent(input.parentB) : undefined, input,
  };
}

/** Prefills the manual form with (simulated) ZUS data, so the user can correct it („Popraw”). */
export function personaToManualFields(p: DemoPersona): ManualFields {
  const parent = (d: ParentData) => {
    const period = d.periods[0];
    return {
      title: period.title === "brak" ? "inne" : period.title,
      from: period.from,
      to: period.to ?? "",
      sickness: period.sicknessInsurance,
      payerInsuredCount: period.payerInsuredCount === undefined ? "" : String(period.payerInsuredCount),
      base: d.avgMonthlyBase === null ? "" : String(d.avgMonthlyBase).replace(".", ","),
      contributionDebt: d.contributionDebt ? d.contributionDebt.toFixed(Number.isInteger(d.contributionDebt) ? 0 : 2).replace(".", ",") : "",
    } as ManualFields["parentA"];
  };
  return {
    event: p.event,
    eventDate: p.eventDate,
    children: String(p.children),
    childAgeYears: p.childAgeYears === undefined ? "" : String(p.childAgeYears),
    parentA: parent(p.a),
    parentB: p.b ? parent(p.b) : undefined,
  } as ManualFields;
}

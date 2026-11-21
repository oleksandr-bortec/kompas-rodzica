import { z } from "zod";
import { InsurancePeriodSchema, PlanInputSchema, type ParentInput, type PlanInput } from "@/lib/engine/types";
import type { CustomPersona, ParentData } from "./types";

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
}).refine(p => !p.to || p.from <= p.to, {
  path: ["to"], message: "Data końca musi przypadać w dniu rozpoczęcia lub później.",
});

function toParent(p: z.output<typeof parentForm>, name: string): ParentInput {
  const { base, to, ...period } = p;
  return { name, base, periods: [{ ...period, to: to || null }] };
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
  parentA: toParent(v.parentA, "Rodzic 1"),
  parentB: v.parentB ? toParent(v.parentB, "Rodzic 2") : undefined,
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

/**
 * Engine input/output types. The engine is pure TypeScript: no React, no I/O,
 * no AI. Same input + same params → same output.
 */
import { z } from "zod";

export const InsuranceTitleSchema = z.enum(["umowa_o_prace", "umowa_zlecenie", "jdg", "inne"]);
export type InsuranceTitle = z.infer<typeof InsuranceTitleSchema>;

const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data w formacie RRRR-MM-DD");

export const InsurancePeriodSchema = z.object({
  title: InsuranceTitleSchema,
  from: IsoDate,
  to: IsoDate.nullable(), // null = trwa
  sickness: z.enum(["obowiazkowe", "dobrowolne", "brak"]),
  /** Liczba zgłoszonych do ubezp. chorobowego u płatnika (stan na 30.11 roku poprzedniego). */
  payerInsuredCount: z.number().int().nonnegative().optional(),
  /** Umowa o pracę na czas określony. */
  fixedTerm: z.boolean().optional(),
});
export type InsurancePeriod = z.infer<typeof InsurancePeriodSchema>;

export const ParentInputSchema = z.object({
  name: z.string().optional(),
  periods: z.array(InsurancePeriodSchema),
  /**
   * Podstawa wymiaru zasiłku (miesięcznie, zł) — podana z zewnątrz.
   * TODO(ZUS): wzór wyliczenia podstawy nie jest opisany w materiałach.
   */
  base: z.number().nonnegative().nullable(),
  contributionDebt: z.number().nonnegative().optional(),
  baseIncreasedInPregnancy: z.boolean().optional(),
});
export type ParentInput = z.infer<typeof ParentInputSchema>;

export const PlanOptionsSchema = z.object({
  variant: z.enum(["81.5", "100-70"]).default("81.5"),
  /** Tygodnie urlopu macierzyńskiego przed porodem (0–6). */
  weeksBeforeBirth: z.number().int().min(0).default(0),
  /** Tygodnie urlopu rodzicielskiego. Brak = domyślny podział. */
  parentalWeeksA: z.number().int().min(0).optional(),
  parentalWeeksB: z.number().int().min(0).optional(),
  /** Urlop ojcowski drugiego rodzica: 0, 1 lub 2 części po 7 dni. */
  paternityParts: z.number().int().min(0).max(2).default(2),
  /** Wymiar pracy w czasie urlopu rodzicielskiego (0–0.5). */
  workFractionA: z.number().min(0).max(1).default(0),
  workFractionB: z.number().min(0).max(1).default(0),
  /** Data złożenia wniosku (do sprawdzenia terminu 21 dni). */
  applicationDate: IsoDate.optional(),
});
export type PlanOptions = z.infer<typeof PlanOptionsSchema>;

export const PlanInputSchema = z.object({
  event: z.enum(["porod", "adopcja", "rodzina_zastepcza"]),
  /** Data porodu (lub termin), przyjęcia dziecka albo uprawomocnienia postanowienia. */
  eventDate: IsoDate,
  children: z.number().int().min(1).default(1),
  childAgeYears: z.number().min(0).optional(),
  schoolDeferred: z.boolean().optional(),
  zaZyciem: z.boolean().optional(),
  parentA: ParentInputSchema,
  parentB: ParentInputSchema.optional(),
  options: PlanOptionsSchema.default({ variant: "81.5", weeksBeforeBirth: 0, paternityParts: 2, workFractionA: 0, workFractionB: 0 }),
});
export type PlanInput = z.input<typeof PlanInputSchema>;
export type PlanInputParsed = z.output<typeof PlanInputSchema>;

/* ---------- output ---------- */

export type ParentKey = "A" | "B";
export type Payer = "platnik" | "ZUS" | "nieznany";

export interface TraceStep {
  id: string;
  label: string;
  detail: string;
  rule: string; // reference to the rule (brief / params path)
  values?: Record<string, string | number | boolean | null>;
}

export interface EligibilityResult {
  eligible: boolean | null; // null = nie da się ustalić
  reason: string;
  insuredOnEventDate: boolean;
  /** Dni nieprzerwanego ubezp. chorobowego przed datą zdarzenia. */
  continuousDays: number;
  sicknessWaitingDays: number;
  sicknessBenefitEligible: boolean;
}

export type SegmentKind =
  | "macierzynski"
  | "warunki_macierzynskiego"
  | "rodzicielski"
  | "ojcowski"
  | "uzupelniajacy";

export interface Segment {
  parent: ParentKey;
  kind: SegmentKind;
  start: string;
  end: string; // inclusive
  /** Tygodnie względem daty zdarzenia (do osi czasu). */
  startWeek: number;
  weeks: number;
  ratePercent: number;
  /** Zasiłek za pełny miesiąc; null gdy brak podstawy. */
  monthlyAmount: number | null;
}

export interface Deadline {
  id: string;
  label: string;
  date: string;
  parent: ParentKey;
  rule: string;
}

export interface Risk {
  id: string;
  severity: "danger" | "warning" | "info";
  title: string;
  why: string;
  todo: string;
  rule: string;
  parent: ParentKey;
}

export interface DocumentItem {
  id: string;
  parent: ParentKey;
  what: string;
  form?: string;
  where: "pracodawca" | "ZUS" | "USC / gov.pl" | "sąd";
  /** Last day to submit (ISO) — null when there is no fixed date. */
  deadline: string | null;
  deadlineText: string;
  rule: string;
}

export interface Plan {
  paramsVersion: string;
  eligibility: { A: EligibilityResult; B?: EligibilityResult };
  payer: { A: Payer; B?: Payer };
  variantApplied: "81.5" | "100-70";
  segments: Segment[];
  monthly: { A: number | null; B: number | null };
  deadlines: Deadline[];
  risks: Risk[];
  documents: DocumentItem[];
  /** Missing rules/params — shown honestly instead of guessing. */
  todos: string[];
  errors: string[];
  trace: TraceStep[];
}

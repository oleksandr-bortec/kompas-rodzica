/**
 * Demo persona shape. Everything here is FAKE data for the UI skeleton.
 * `demoPlan` is a placeholder until lib/engine computes the real plan (step 3).
 */

export type Source = "zus" | "user" | "ai";
export type Tone = "success" | "warning" | "danger" | "info";

export type InsuranceTitle = "umowa_o_prace" | "umowa_zlecenie" | "jdg" | "brak";

export interface InsurancePeriod {
  title: InsuranceTitle;
  payerName: string;
  from: string; // ISO
  to: string | null;
  sicknessInsurance: "obowiazkowe" | "dobrowolne" | "brak";
  payerInsuredCount?: number; // stan na 30.11 roku poprzedniego
  fixedTerm?: boolean; // umowa o pracę na czas określony
}

export interface Ezla {
  id: string;
  from: string;
  to: string;
  code: string; // np. "B" = ciąża
  issuer: string;
}

export interface ParentData {
  name: string;
  age: number;
  periods: InsurancePeriod[];
  /** średni przychód z 12 mies. — dane przykładowe (wzór podstawy: TODO ZUS) */
  avgMonthlyBase: number;
  ezla: Ezla[];
  contributionDebt: number; // zł, 0 = brak
}

export type SegmentKind =
  | "chorobowy"
  | "macierzynski"
  | "warunki_macierzynskiego"
  | "rodzicielski"
  | "ojcowski"
  | "praca";

export interface Segment {
  parent: "A" | "B";
  kind: SegmentKind;
  startWeek: number; // tydzień względem porodu/przyjęcia dziecka (0 = start)
  weeks: number;
  percent: number; // 100 / 81.5 / 70 / 0
}

export interface RiskItem {
  id: string;
  tone: Tone;
  title: string;
  why: string;
  todo: string;
  rule: string;
}

export interface DocItem {
  id: string;
  what: string;
  form?: string;
  where: "pracodawca" | "ZUS" | "USC / gov.pl";
  deadline: string;
  who: "A" | "B";
  done?: boolean;
}

export interface DemoPlan {
  verdict: { tone: Tone; title: string; detail: string };
  payerA: "pracodawca" | "ZUS";
  payerB?: "pracodawca" | "ZUS";
  monthlyA: number;
  monthlyB?: number;
  variant: "81,5%" | "100% + 70%";
  segments: Segment[];
  nextStep: { title: string; date: string; href: string };
  risks: RiskItem[];
  documents: DocItem[];
}

export interface Persona {
  id: "ania" | "kasia" | "ola" | "ewa-marek";
  label: string;
  tagline: string;
  event: "porod" | "adopcja";
  eventDate: string; // termin porodu lub data przyjęcia dziecka
  childAgeYears?: number;
  children: number;
  a: ParentData;
  b?: ParentData;
  demoPlan: DemoPlan;
}

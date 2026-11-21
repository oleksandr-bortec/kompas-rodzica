/**
 * FAKE demo cases for „Sprawdź sprawę” (plan B without an AI key). They use the same
 * shape the AI returns, so the confirm → engine → verdict path is identical.
 * Real ZUS sample cases are never committed (zus-samples/ is gitignored).
 */
import type { CaseExtraction } from "@/lib/ai/case-schema";

export interface SampleCase {
  id: string;
  title: string;
  formType: string;
  extraction: CaseExtraction;
}

const f = <T>(value: T | null, confidence: number, page: number | null = 1) => ({ value, confidence, page });
const wages = (gross: number, year = 2026) =>
  Array.from({ length: 12 }, (_, i) => ({ month: `${year - 1}-${String(i + 1).padStart(2, "0")}`, gross }));

export const SAMPLE_CASES: SampleCase[] = [
  {
    id: "demo-1",
    title: "Przykład 1 — pracownica, mały pracodawca, wniosek 81,5%",
    formType: "Z-3 + wniosek o urlop",
    extraction: {
      documents: [{ form: "Z-3", page: 1 }, { form: "wniosek o urlop macierzyński i rodzicielski", page: 5 }],
      event: { type: f("porod", 0.98), date: f("2026-04-14", 0.97, 3) },
      children: f(1, 0.9),
      claimant: f("matka", 0.95),
      insurance: {
        title: f("umowa_o_prace", 0.98),
        from: f("2021-06-01", 0.95, 3),
        to: f(null, 0.9),
        sickness: f("obowiazkowe", 0.9),
        fullTime: f(true, 0.92, 3),
      },
      payerOver20Insured: f(false, 0.72, 4),
      leave: { kinds: f(["macierzynski", "rodzicielski"], 0.95, 3), from: f("2026-04-14", 0.95, 3), to: f("2027-04-12", 0.9, 3), fullLeaveRequested: f(true, 0.88, 5) },
      applicationDate: f("2026-04-24", 0.93, 3),
      wages: wages(6200),
      contributionDebt: f(null, 0.8, null),
      zusDecision: { outcome: f("przyznano", 0.6, 1), reason: f("adnotacja: zasiłek wypłacony za okres wskazany we wniosku", 0.6, 1) },
      notes: ["Adnotacja o wypłacie napisana odręcznie na stronie 1."],
    },
  },
  {
    id: "demo-2",
    title: "Przykład 2 — zlecenie bez chorobowego, stary formularz Z-3b",
    formType: "ZAM + Z-3b (formularz sprzed 24.10.2026)",
    extraction: {
      documents: [{ form: "ZAM", page: 1 }, { form: "Z-3b", page: 3 }],
      event: { type: f("porod", 0.96), date: f("2026-02-20", 0.96) },
      children: f(1, 0.9),
      claimant: f("matka", 0.95),
      insurance: {
        title: f("umowa_zlecenie", 0.93),
        from: f("2025-03-01", 0.9, 3),
        to: f("2026-06-30", 0.64, 3),
        sickness: f("brak", 0.85, 3),
        fullTime: f(null, 0.5, null),
      },
      payerOver20Insured: f(null, 0.4, null),
      leave: { kinds: f(["macierzynski"], 0.9), from: f("2026-02-20", 0.9), to: f(null, 0.5, null), fullLeaveRequested: f(false, 0.7) },
      applicationDate: f("2026-03-02", 0.9),
      wages: [],
      contributionDebt: f(null, 0.8, null),
      zusDecision: { outcome: f("odmowa", 0.9, 6), reason: f("brak ubezpieczenia chorobowego w dniu porodu", 0.9, 6) },
      notes: ["Rozpoznano stary formularz Z-3b — od 24.10.2026 zastąpiony przez ZAM."],
    },
  },
  {
    id: "demo-3",
    title: "Przykład 3 — działalność gospodarcza z zadłużeniem",
    formType: "ZAM + ZAS-53 + zaświadczenie o zadłużeniu",
    extraction: {
      documents: [{ form: "ZAM", page: 1 }, { form: "ZAS-53", page: 2 }],
      event: { type: f("porod", 0.97), date: f("2026-05-05", 0.97) },
      children: f(1, 0.9),
      claimant: f("matka", 0.95),
      insurance: {
        title: f("jdg", 0.96),
        from: f("2023-01-01", 0.9),
        to: f(null, 0.9),
        sickness: f("dobrowolne", 0.94),
        fullTime: f(null, 0.5, null),
      },
      payerOver20Insured: f(null, 0.5, null),
      leave: { kinds: f(["macierzynski", "rodzicielski"], 0.9), from: f("2026-05-05", 0.9), to: f(null, 0.5, null), fullLeaveRequested: f(true, 0.8) },
      applicationDate: f("2026-05-12", 0.9),
      wages: wages(5500),
      contributionDebt: f(612.4, 0.86, 4),
      zusDecision: { outcome: f("odmowa", 0.92, 7), reason: f("zadłużenie z tytułu składek w dniu powstania prawa", 0.92, 7) },
      notes: [],
    },
  },
];

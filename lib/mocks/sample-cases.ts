/**
 * FAKE demo cases for the "Sprawdź sprawę" skeleton. Real ZUS sample cases are
 * never committed (zus-samples/ is gitignored) — they are loaded at runtime.
 */
export interface ExtractedField {
  key: string;
  label: string;
  value: string;
  confidence: number; // 0–1
  page: number;
}

export interface SampleCase {
  id: string;
  title: string;
  formType: string;
  fields: ExtractedField[];
  zusDecision: string;
  ourVerdict: string;
  match: boolean;
}

export const SAMPLE_CASES: SampleCase[] = [
  {
    id: "demo-1",
    title: "Przykład 1 — pracownica, wniosek do pracodawcy",
    formType: "Wniosek o urlop + zaświadczenie płatnika",
    fields: [
      { key: "title", label: "Tytuł ubezpieczenia", value: "Umowa o pracę", confidence: 0.98, page: 1 },
      { key: "from", label: "Ubezpieczenie od", value: "01.09.2019", confidence: 0.95, page: 1 },
      { key: "birth", label: "Data porodu", value: "15.03.2027", confidence: 0.97, page: 2 },
      { key: "insured", label: "Liczba ubezpieczonych u płatnika", value: "214", confidence: 0.72, page: 2 },
    ],
    zusDecision: "Prawo przyznane · wypłaca płatnik",
    ourVerdict: "Prawo przyznane · wypłaca płatnik",
    match: true,
  },
  {
    id: "demo-2",
    title: "Przykład 2 — zlecenie, stary formularz Z-3b",
    formType: "ZAM + Z-3b (formularz sprzed 24.10.2026)",
    fields: [
      { key: "title", label: "Tytuł ubezpieczenia", value: "Umowa zlecenie", confidence: 0.93, page: 1 },
      { key: "sick", label: "Ubezpieczenie chorobowe", value: "Dobrowolne", confidence: 0.88, page: 1 },
      { key: "to", label: "Koniec umowy", value: "31.01.2027", confidence: 0.64, page: 2 },
      { key: "birth", label: "Data porodu", value: "20.02.2027", confidence: 0.96, page: 1 },
    ],
    zusDecision: "Odmowa — brak ubezpieczenia w dniu porodu",
    ourVerdict: "Brak prawa — brak ubezpieczenia chorobowego w dniu porodu",
    match: true,
  },
];

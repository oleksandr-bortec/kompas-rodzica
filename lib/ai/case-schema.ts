/**
 * What AI reads from a ZUS case file (PDF scan): only facts needed by the rules
 * engine, each with confidence and page so a human can verify them.
 * No identifiers (names, PESEL, addresses) are part of the schema.
 */
import { z } from "zod";

const field = <T extends z.ZodType>(value: T) =>
  z.object({
    value: value.nullable(),
    /** 0–1: how sure the model is about this value. */
    confidence: z.number(),
    /** 1-based page of the PDF where the value was found. */
    page: z.number().int().nullable(),
  });

const isoDate = z.string().describe("Data w formacie RRRR-MM-DD");

export const CaseExtractionSchema = z.object({
  documents: z
    .array(z.object({ form: z.string().describe("np. Z-3, Z-3a, Z-3b, ZAM, ZUR, ZAO, ZAS-53, decyzja, zaświadczenie lekarskie"), page: z.number().int() }))
    .describe("Rozpoznane dokumenty w aktach"),
  event: z.object({
    type: field(z.enum(["porod", "adopcja", "rodzina_zastepcza", "martwe_urodzenie", "inne"])),
    date: field(isoDate),
  }),
  children: field(z.number().int()),
  claimant: field(z.enum(["matka", "ojciec", "inny"])),
  insurance: z.object({
    title: field(z.enum(["umowa_o_prace", "umowa_zlecenie", "jdg", "osoba_wspolpracujaca", "brak", "inne"])),
    from: field(isoDate),
    to: field(isoDate),
    sickness: field(z.enum(["obowiazkowe", "dobrowolne", "brak"])),
    fullTime: field(z.boolean()),
  }),
  payerOver20Insured: field(z.boolean()).describe("Czy płatnik zgłasza do ubezpieczenia chorobowego powyżej 20 osób"),
  leave: z.object({
    kinds: field(z.array(z.enum(["macierzynski", "rodzicielski", "ojcowski", "warunki_macierzynskiego", "uzupelniajacy", "chorobowy"]))),
    from: field(isoDate),
    to: field(isoDate),
    fullLeaveRequested: field(z.boolean()).describe("Wniosek o urlop macierzyński i rodzicielski w pełnym wymiarze (wariant 81,5%)"),
  }),
  applicationDate: field(isoDate),
  wages: z
    .array(z.object({ month: z.string().describe("RRRR-MM"), gross: z.number() }))
    .describe("Wynagrodzenie / przychód brutto z kolejnych miesięcy (np. z Z-3)"),
  contributionDebt: field(z.number()).describe("Zadłużenie w składkach w zł, jeśli wynika z akt"),
  zusDecision: z.object({
    outcome: field(z.enum(["przyznano", "odmowa", "brak_informacji"])),
    reason: field(z.string()),
  }),
  notes: z.array(z.string()).describe("Krótkie uwagi: nieczytelne miejsca, sprzeczności, stare formularze"),
});

export type CaseExtraction = z.infer<typeof CaseExtractionSchema>;
export type ExtractedField<T> = { value: T | null; confidence: number; page: number | null };

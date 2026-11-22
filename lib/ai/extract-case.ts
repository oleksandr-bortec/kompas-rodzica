import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { AI_MODEL } from "./model";
import { z } from "zod";
import { CaseExtractionSchema, type CaseExtraction } from "./case-schema";

/**
 * AI step 1 of 2: reads a ZUS case file (PDF, often a scan) and returns facts as JSON
 * validated by Zod. The AI never computes amounts, periods or verdicts — the rules
 * engine does that after a human confirms the fields.
 */
export const EXTRACTION_MODEL = AI_MODEL;

const INSTRUCTIONS = `Jesteś asystentem, który czyta akta spraw zasiłkowych ZUS (skany formularzy: Z-3, Z-3a, Z-3b, ZAM, ZUR, ZAO, ZAS-53, zaświadczenia, decyzje, adnotacje odręczne).

Zadanie: odczytaj z dokumentu wyłącznie fakty potrzebne do ustalenia prawa do zasiłku macierzyńskiego i wypełnij schemat.
Zasady:
- Przepisuj tylko to, co jest w dokumencie. Niczego nie licz i nie oceniaj prawa do zasiłku — tylko odczytaj.
- Jeśli wartości nie ma albo jest nieczytelna: value = null, niska pewność, opisz to w notes.
- confidence: 0–1 (1 = wyraźnie wydrukowane lub zaznaczone; ok. 0,5 = pismo odręczne lub częściowo nieczytelne).
- page: numer strony PDF (od 1), z której pochodzi wartość.
- Daty w formacie RRRR-MM-DD, miesiące wynagrodzeń RRRR-MM, kwoty jako liczby (kropka dziesiętna).
- payerOver20Insured: z pola „zgłosiłeś do ubezpieczenia chorobowego do 20 / powyżej 20 ubezpieczonych”.
- zusDecision: rozstrzygnięcie ZUS, jeśli jest w aktach (decyzja lub adnotacja, np. „zasiłek wypłacony za okres…”, „odmowa”).
- Stare formularze (ZUR, ZAO, Z-3b) odczytuj tak samo; zaznacz je w documents.
- Nie przepisuj imion, nazwisk, numerów PESEL, adresów ani numerów kont.`;

export class ExtractionUnavailableError extends Error {}

export async function extractCase(pdf: Buffer): Promise<CaseExtraction> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new ExtractionUnavailableError("Brak klucza ANTHROPIC_API_KEY — odczyt dokumentów przez AI jest wyłączony.");
  }
  const client = new Anthropic();
  // Plain JSON instead of structured outputs: the schema has ~30 nullable fields, more union-typed
  // parameters than structured outputs accept (400). Zod validates the answer below.
  const response = await client.messages.create({
    model: EXTRACTION_MODEL,
    max_tokens: 16000,
    output_config: { effort: "high" },
    messages: [
      {
        role: "user",
        content: [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: pdf.toString("base64") } },
          { type: "text", text: `${INSTRUCTIONS}\n\nOdpowiedz wyłącznie jednym obiektem JSON zgodnym z tym JSON Schema (bez komentarzy i bez markdown):\n${SCHEMA_TEXT}` },
        ],
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("Model odmówił odczytu dokumentu.");
  }
  const text = response.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
  const parsed = CaseExtractionSchema.safeParse(parseJsonObject(text));
  if (!parsed.success) {
    throw new Error(`Nie udało się odczytać danych (stop_reason: ${response.stop_reason}).`);
  }
  return parsed.data;
}

const SCHEMA_TEXT = JSON.stringify(z.toJSONSchema(CaseExtractionSchema));

/** First {...} object in the model's text (tolerates ```json fences or a sentence around it). */
function parseJsonObject(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

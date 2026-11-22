import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { extractCase, ExtractionUnavailableError } from "@/lib/ai/extract-case";

// Reading a 30-page scan can take a while.
export const maxDuration = 300;

// Vercel request body limit is 4.5 MB; ZUS sample files are up to ~2 MB.
const MAX_BYTES = 4 * 1024 * 1024;

/**
 * POST /api/cases/extract (multipart/form-data, field "file": PDF)
 * → { extraction } — facts read by AI, to be confirmed by a human.
 * The file is processed in memory only and never stored.
 */
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Dołącz plik PDF w polu „file”." }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Obsługujemy tylko pliki PDF." }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Plik jest za duży (limit 4 MB)." }, { status: 413 });
  }

  try {
    const extraction = await extractCase(Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({ extraction });
  } catch (e) {
    if (e instanceof ExtractionUnavailableError) {
      return NextResponse.json({ error: e.message, fallback: true }, { status: 503 });
    }
    if (e instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "Za dużo zapytań do AI — spróbuj za chwilę.", fallback: true }, { status: 429 });
    }
    if (e instanceof Anthropic.APIError) {
      // e.g. credit balance used up, invalid key, service overloaded — the sample cases still work.
      console.error("cases/extract: Claude API error", e.status, e.message);
      return NextResponse.json({ error: `Odczyt przez AI jest chwilowo niedostępny (kod ${e.status ?? "?"}).`, fallback: true }, { status: 502 });
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : "Nieznany błąd." }, { status: 500 });
  }
}

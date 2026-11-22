import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildPlan, PlanInputSchema } from "@/lib/engine";
import { explainPlanWithAI, ExplainUnavailableError } from "@/lib/ai/explain-plan";
import { buildVariables } from "@/lib/explain/variables";

export const maxDuration = 60;

const BodySchema = z.object({
  input: PlanInputSchema,
  lang: z.enum(["pl", "uk", "en"]).default("pl"),
  names: z.object({ A: z.string().max(40), B: z.string().max(40).optional() }),
});

/**
 * POST /api/explain { input, lang, names } → { paragraphs } with {placeholders} only.
 * The client fills placeholders with values from its own engine run, so AI never sees
 * amounts and cannot change them. 503 + fallback when no API key.
 */
export async function POST(req: Request) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Nieprawidłowe dane wejściowe" }, { status: 400 });
  const { input, lang, names } = parsed.data;
  const plan = buildPlan(input);
  const keys = Object.keys(buildVariables(plan, input.eventDate, names, lang));
  try {
    const paragraphs = await explainPlanWithAI(plan, keys, lang, input.event);
    return NextResponse.json({ paragraphs, source: "ai" });
  } catch (e) {
    const fallback = true;
    if (e instanceof ExplainUnavailableError) return NextResponse.json({ error: e.message, fallback }, { status: 503 });
    console.error("explain: AI explanation failed, template used", e instanceof Error ? e.message : e);
    // Do not pass raw upstream errors to the browser.
    const error = e instanceof Anthropic.APIError ? `AI jest chwilowo niedostępne${e.status ? ` (kod ${e.status})` : ""}.` : e instanceof Error ? e.message : "Błąd";
    return NextResponse.json({ error, fallback }, { status: 502 });
  }
}

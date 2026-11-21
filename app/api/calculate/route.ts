import { NextResponse } from "next/server";
import { buildPlan, PlanInputSchema } from "@/lib/engine";

/** POST /api/calculate — full plan (eligibility, payer, periods, amounts, deadlines, risks, trace). */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = PlanInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Nieprawidłowe dane wejściowe", issues: parsed.error.issues }, { status: 400 });
  }
  return NextResponse.json(buildPlan(parsed.data));
}

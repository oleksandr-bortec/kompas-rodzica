import { NextResponse } from "next/server";
import { buildPlan, PlanInputSchema } from "@/lib/engine";

/** POST /api/eligibility — only the right to benefit and who pays. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = PlanInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Nieprawidłowe dane wejściowe", issues: parsed.error.issues }, { status: 400 });
  }
  const plan = buildPlan(parsed.data);
  return NextResponse.json({
    paramsVersion: plan.paramsVersion,
    eligibility: plan.eligibility,
    payer: plan.payer,
    risks: plan.risks,
    todos: plan.todos,
  });
}

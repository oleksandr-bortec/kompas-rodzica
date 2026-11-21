import { NextResponse } from "next/server";
import { getParams, PARAM_VERSIONS } from "@/lib/engine";

/** GET /api/params?date=YYYY-MM-DD — parameters in force on a date (+ all versions). */
export async function GET(req: Request) {
  const date = new URL(req.url).searchParams.get("date") ?? undefined;
  return NextResponse.json({ current: getParams(date ?? undefined), versions: PARAM_VERSIONS.map((v) => v.effectiveFrom) });
}

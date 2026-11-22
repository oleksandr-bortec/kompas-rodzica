import { NextResponse } from "next/server";
import { getParams, PARAM_VERSIONS } from "@/lib/engine";

function isIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** GET /api/params?date=YYYY-MM-DD — parameters in force on a date (+ all versions). */
export async function GET(req: Request) {
  const date = new URL(req.url).searchParams.get("date");
  if (date !== null && !isIsoDate(date)) {
    return NextResponse.json({ error: "Parametr date musi być datą w formacie RRRR-MM-DD." }, { status: 400 });
  }
  return NextResponse.json({ current: getParams(date ?? undefined), versions: PARAM_VERSIONS.map((v) => v.effectiveFrom) });
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, checkPassword, isPasswordConfigured, isValidSession, sessionToken } from "@/lib/admin-auth";

/** GET — is the current admin session valid? `configured` tells whether ADMIN_PASSWORD is set (value never exposed). */
export async function GET() {
  const jar = await cookies();
  return NextResponse.json({
    authed: isValidSession(jar.get(ADMIN_COOKIE)?.value),
    configured: isPasswordConfigured() || process.env.NODE_ENV === "development",
  });
}

/** POST { password } — log in, sets an httpOnly session cookie. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { password?: unknown };
  const password = typeof body.password === "string" ? body.password : "";
  const token = sessionToken();
  if (!isPasswordConfigured() && process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Hasło administratora nie jest skonfigurowane (ADMIN_PASSWORD) — ustaw je w Vercel i zrób Redeploy." },
      { status: 503 },
    );
  }
  if (!token || !checkPassword(password)) {
    return NextResponse.json({ error: "Nieprawidłowe hasło" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return res;
}

/** DELETE — log out. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(ADMIN_COOKIE);
  return res;
}

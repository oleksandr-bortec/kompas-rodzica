import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Simple admin auth for the demo: one password from the ADMIN_PASSWORD env var
 * (set in Vercel → Project → Settings → Environment Variables).
 * The session cookie holds an HMAC of the password, never the password itself.
 * Without ADMIN_PASSWORD the panel is open only in local development.
 */
export const ADMIN_COOKIE = "kr_admin";

/** ADMIN_PASSWORD with accidental surrounding whitespace/quotes removed (common copy-paste issue). */
function configuredPassword(): string | null {
  const raw = process.env.ADMIN_PASSWORD;
  if (!raw) return null;
  const pwd = raw.trim().replace(/^(["'])(.*)\1$/, "$2");
  return pwd.length > 0 ? pwd : null;
}

/** True when an admin password is configured for this deployment (never reveals it). */
export function isPasswordConfigured(): boolean {
  return configuredPassword() !== null;
}

function secret(): string | null {
  const pwd = configuredPassword();
  if (pwd) return pwd;
  return process.env.NODE_ENV === "development" ? "dev-only" : null;
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function checkPassword(input: string): boolean {
  const s = secret();
  if (!s) return false;
  if (!configuredPassword()) return true; // local development without a password
  return safeEqual(input.trim(), s);
}

export function sessionToken(): string | null {
  const s = secret();
  return s ? createHmac("sha256", s).update("kompas-admin-session").digest("hex") : null;
}

export function isValidSession(cookieValue: string | undefined): boolean {
  const t = sessionToken();
  return !!t && !!cookieValue && safeEqual(cookieValue, t);
}

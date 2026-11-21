import { addDays } from "@/lib/engine/dates";
import type { Deadline } from "@/lib/engine/types";

function escapeText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\r\n|[\r\n]/g, "\\n").replace(/[,;]/g, "\\$&");
}

const utf8 = new TextEncoder();

// RFC 5545 §3.1 counts octets, including the space starting each continuation.
function foldLine(line: string): string {
  let result = "";
  let width = 0;
  for (const char of line) {
    const bytes = utf8.encode(char).length;
    if (width + bytes > 75) {
      result += "\r\n ";
      width = 1;
    }
    result += char;
    width += bytes;
  }
  return result;
}

/** Serialize a non-empty family plan. Supply the timestamp to keep the export pure. */
export function deadlinesToIcs(deadlines: readonly Deadline[], planKey: string, exportedAt: Date): string {
  if (!deadlines.length) throw new RangeError("Brak terminów do eksportu.");
  const stamp = exportedAt.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Kompas Rodzica//Terminy//PL",
    "CALSCALE:GREGORIAN",
    "X-WR-CALNAME:Kompas Rodzica — terminy",
    "X-WR-TIMEZONE:Europe/Warsaw",
  ];
  for (const d of deadlines) {
    // The engine already supplies a Warsaw calendar date. DATE values have no TZID.
    lines.push(
      "BEGIN:VEVENT",
      `UID:${encodeURIComponent(planKey)}/${d.parent}/${encodeURIComponent(d.id)}@kompas-rodzica`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${d.date.replace(/-/g, "")}`,
      `DTEND;VALUE=DATE:${addDays(d.date, 1).replace(/-/g, "")}`,
      `SUMMARY:${escapeText(d.label)}`,
      `DESCRIPTION:${d.parent === "B" ? "Drugi rodzic" : "Pierwszy rodzic"}`,
      "TRANSP:TRANSPARENT",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n") + "\r\n";
}

import { describe, expect, it } from "vitest";
import { buildPlan } from "@/lib/engine";
import type { Deadline } from "@/lib/engine/types";
import { getPersona } from "@/lib/personas/data";
import { personaToInput } from "@/lib/personas/to-engine";
import { deadlinesToIcs } from "./ics";

const stamp = new Date("2026-11-21T23:10:04.789+01:00");
const deadline: Deadline = { id: "wniosek", date: "2026-11-21", parent: "A", label: "Termin", rule: "" };

describe("deadlinesToIcs", () => {
  it("exports every deadline from buildPlan with its label and calendar date", () => {
    const { deadlines } = buildPlan(personaToInput(getPersona("ania")));
    const ics = deadlinesToIcs(deadlines, "ania", stamp);
    const events = ics.replace(/\r\n /g, "").split("BEGIN:VEVENT\r\n").slice(1);
    expect(events.length).toBeGreaterThan(0);
    expect(events).toHaveLength(deadlines.length);
    for (const [i, event] of events.entries()) {
      expect(event).toContain("SUMMARY:" + deadlines[i].label.replaceAll(",", "\\,") + "\r\n");
      expect(event).toContain("DTSTART;VALUE=DATE:" + deadlines[i].date.replaceAll("-", ""));
      expect(event).toContain("DTSTAMP:20261121T221004Z");
    }
    expect(ics).toContain("X-WR-TIMEZONE:Europe/Warsaw\r\n");
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics.replaceAll("\r\n", "")).not.toMatch(/[\r\n]/);
  });

  it.each([
    ["2026-03-29", "20260330"], ["2026-10-25", "20261026"],
    ["2028-02-29", "20280301"], ["2026-12-31", "20270101"],
  ])("preserves the whole day on %s", (date, end) => {
    const ics = deadlinesToIcs([{ ...deadline, date }], "test", stamp);
    expect(ics).toContain(`DTSTART;VALUE=DATE:${date.replaceAll("-", "")}\r\nDTEND;VALUE=DATE:${end}\r\n`);
    expect(ics).not.toContain("TZID=");
  });

  it("escapes TEXT and folds long Unicode lines at 75 UTF-8 octets", () => {
    const text = "Zażółć 🗓".repeat(18);
    const label = text + "\\druk, pole; opis\r\nNowa linia";
    const ics = deadlinesToIcs([{ ...deadline, label }], "test", stamp);
    expect(ics).toContain("\r\n ");
    for (const line of ics.split("\r\n")) expect(Buffer.byteLength(line)).toBeLessThanOrEqual(75);
    expect(ics.replace(/\r\n /g, "")).toContain("SUMMARY:" + text + "\\\\druk\\, pole\\; opis\\nNowa linia\r\n");
  });

  it("keeps UIDs stable across exports and distinct for parents and profiles", () => {
    const deadlines: Deadline[] = [deadline, { ...deadline, parent: "B" }];
    const uids = (key: string, at: Date) => deadlinesToIcs(deadlines, key, at).match(/^UID:.+/gm);
    const ids = uids("ania", stamp);
    expect(new Set(ids).size).toBe(2);
    expect(uids("ania", new Date(0))).toEqual(ids);
    expect(uids("custom", stamp)).not.toEqual(ids);
  });

  it("rejects a calendar with no events", () => {
    expect(() => deadlinesToIcs([], "test", stamp)).toThrow(RangeError);
  });
});

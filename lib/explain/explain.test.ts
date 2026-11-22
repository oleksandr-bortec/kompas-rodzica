import { describe, expect, it } from "vitest";
import { buildPlan } from "@/lib/engine";
import { getPersona } from "@/lib/personas/data";
import { personaToInput } from "@/lib/personas/to-engine";
import { fill, isSafeText } from "./fill";
import { buildVariables } from "./variables";
import { templateExplanation } from "./template";

const planOf = (id: string) => {
  const p = getPersona(id);
  return { p, plan: buildPlan(personaToInput(p)) };
};

describe("placeholders", () => {
  it("fills known placeholders", () => expect(fill("Kwota: {kwota_A}", { kwota_A: "6 683 zł" })).toBe("Kwota: 6 683 zł"));
  it("AI text with its own digits is rejected", () => {
    expect(isSafeText("Dostaniesz {kwota_A} miesięcznie.", ["kwota_A"])).toBe(true);
    expect(isSafeText("Dostaniesz 7000 zł miesięcznie.", ["kwota_A"])).toBe(false);
    expect(isSafeText("Wniosek do {data_x}.", ["kwota_A"])).toBe(false);
  });
});

describe("engine values", () => {
  it("amounts and dates come from the plan", () => {
    const { p, plan } = planOf("ania");
    const v = buildVariables(plan, p.eventDate, { A: "Ania", B: "Tomek" }, "pl");
    expect(v.kwota_A).toBe("6 683 zł");
    expect(v.procent_A).toBe("81,5%");
    expect(v.data_wniosku).toBe("05.04.2027");
    expect(v.tyg_mac).toBe("20");
    expect(v.dni_ojc).toBe("14");
    expect(buildVariables(plan, p.eventDate, { A: "Ania" }, "en").procent_A).toBe("81.5%");
  });
});

describe("template explanation", () => {
  it("Polish, eligible persona: amount, deadline, second parent, disclaimer", () => {
    const { p, plan } = planOf("ania");
    const text = templateExplanation(plan, p.eventDate, { A: "Ania", B: "Tomek" }, "pl").join(" ");
    expect(text).toContain("6 683 zł");
    expect(text).toContain("05.04.2027");
    expect(text).toContain("Tomek");
    expect(text).toContain("To informacja, a nie decyzja ZUS.");
    expect(text).not.toMatch(/\{[a-z_AB]+\}/);
  });
  it("Ukrainian and English versions", () => {
    const { p, plan } = planOf("ania");
    expect(templateExplanation(plan, p.eventDate, { A: "Ania", B: "Tomek" }, "uk").join(" ")).toContain("Це інформація, а не рішення ZUS.");
    expect(templateExplanation(plan, p.eventDate, { A: "Ania", B: "Tomek" }, "en").join(" ")).toContain("6,683 zł");
  });
  it("debt case explains the repayment deadline", () => {
    const { p, plan } = planOf("kasia");
    const text = templateExplanation(plan, p.eventDate, { A: "Kasia" }, "pl").join(" ");
    expect(text).toContain("19.07.2027");
  });
  it("no insurance case", () => {
    const { p, plan } = planOf("ola");
    expect(templateExplanation(plan, p.eventDate, { A: "Ola" }, "pl")[0]).toContain("nie ma ubezpieczenia chorobowego");
  });
});

import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, PageSizes, rgb } from "pdf-lib";
import { formatDateShort, SEGMENT_LABEL, variantText } from "@/lib/format";
import type { Plan } from "@/lib/engine/types";
import type { Persona } from "@/lib/personas/types";

export type FormKind = "employer" | "zam";

export function variantLabel(plan: Plan) {
  return variantText(plan);
}

/** Print a preview for applicant A, using the same plan as the Plan screen. */
export async function applicationPdf(kind: FormKind, persona: Persona, plan: Plan) {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const response = await fetch("/fonts/dejavu-sans-latin.ttf");
  if (!response.ok) throw new Error("Nie udało się wczytać czcionki.");
  const font = await doc.embedFont(await response.arrayBuffer(), { subset: true });

  const zam = kind === "zam";
  const birth = persona.event === "porod";
  const title = zam ? "ZAM · wniosek o zasiłek macierzyński"
    : birth ? "Wniosek o urlop macierzyński i rodzicielski"
    : "Wniosek o urlop na warunkach urlopu macierzyńskiego i urlop rodzicielski";
  doc.setTitle(title);
  doc.setAuthor("Kompas Rodzica");
  doc.setSubject("Symulacja — wzór poglądowy");

  const page = doc.addPage(PageSizes.A4);
  const { width, height } = page.getSize();
  const left = 44;
  const right = width - left;
  const green = rgb(0.04, 0.33, 0.27);
  const ink = rgb(0.11, 0.15, 0.14);
  const muted = rgb(0.32, 0.39, 0.37);
  const line = rgb(0.82, 0.86, 0.84);
  function text(value: string, x: number, top: number, size = 11, color = ink) {
    page.drawText(value, { x, y: height - top, font, size, color });
  }
  function rule(x: number, end: number, top: number) {
    page.drawLine({ start: { x, y: height - top }, end: { x: end, y: height - top }, thickness: 0.8, color: line });
  }

  text("Kompas Rodzica", left, 48, 12, green);
  page.drawRectangle({ x: right - 200, y: height - 58, width: 200, height: 27, color: rgb(0.89, 0.95, 0.93) });
  text("Symulacja — wzór poglądowy", right - 186, 48, 11, green);
  rule(left, right, 73);
  text(zam ? "DO ZUS   /   FORMULARZ UPROSZCZONY" : "DO PRACODAWCY", left, 107, 10, green);
  const heading = zam ? ["ZAM", "Wniosek o zasiłek macierzyński"]
    : birth ? ["Wniosek o urlop macierzyński", "i rodzicielski"]
    : ["Wniosek o urlop na warunkach urlopu", "macierzyńskiego i urlop rodzicielski"];
  heading.forEach((row, i) => text(row, left, 145 + i * 31, 24));
  const employer = persona.a.periods.find(p => p.title === "umowa_o_prace" &&
    p.from <= persona.eventDate && (!p.to || p.to >= persona.eventDate));
  const fields = [
    ["Osoba składająca wniosek", persona.a.name],
    ["Adresat", zam ? "Zakład Ubezpieczeń Społecznych" : employer?.payerName || "Pracodawca: ........................................"],
    [birth ? "Data porodu / przewidywany termin" : "Data przyjęcia dziecka", formatDateShort(persona.eventDate)],
    ["Liczba dzieci", String(persona.children)],
  ];
  fields.forEach(([label, value], i) => {
    const top = 222 + i * 30;
    text(label, left, top, 10, muted);
    text(value, left + 214, top);
    rule(left, right, top + 10);
  });

  text(zam ? "Wnoszę o wypłatę zasiłku za okresy wskazane poniżej." :
    "Proszę o udzielenie urlopu w okresach wskazanych poniżej.", left, 371, 13);
  text("Wariant wypłaty w planie", left, 407, 10, muted);
  text(variantLabel(plan), left + 214, 407, 13, green);
  rule(left, right, 427);
  text("Okresy osoby składającej wniosek", left, 455, 15, green);

  const segments = plan.segments.filter(s => s.parent === "A" && s.kind !== "ojcowski");
  let top = 484;
  for (const s of segments) {
    text(SEGMENT_LABEL[s.kind], left, top, 12);
    text(`${formatDateShort(s.start)} – ${formatDateShort(s.end)}`, left, top + 19, 11, muted);
    const rate = `${String(s.ratePercent).replace(".", ",")}% podstawy`;
    text(rate, right - font.widthOfTextAtSize(rate, 11), top + 19, 11, muted);
    rule(left, right, top + 30);
    top += 52;
  }
  if (segments.length === 0) text("Plan nie wyznaczył okresów dla tej osoby.", left, top, 11, muted);

  rule(left, left + 190, 730);
  rule(right - 190, right, 730);
  text("Miejscowość i data", left, 747, 10, muted);
  text("Podpis osoby składającej wniosek", right - 190, 747, 10, muted);
  rule(left, right, 783);
  text("Podgląd z planu rodziny. Pobranie dokumentu nie składa wniosku.", left, 803, 10, muted);
  return doc.save();
}

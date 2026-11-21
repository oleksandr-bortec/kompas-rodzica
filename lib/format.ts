const dateFmt = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long", year: "numeric" });
const dateShort = new Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" });

/**
 * Deterministic PLN formatting (same output on server and in every browser —
 * Intl grouping differs between ICU builds and breaks hydration).
 * 6683 → "6 683 zł", 412.5 → "412,50 zł" (non-breaking spaces).
 */
function groupThousands(int: string) {
  return int.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");
}
export function formatPLN(v: number) {
  const sign = v < 0 ? "-" : "";
  return `${sign}${groupThousands(String(Math.round(Math.abs(v))))}\u00A0zł`;
}
export function formatPLN2(v: number) {
  const sign = v < 0 ? "-" : "";
  const [i, f] = Math.abs(v).toFixed(2).split(".");
  return `${sign}${groupThousands(i)},${f}\u00A0zł`;
}
export const formatDate = (iso: string) => dateFmt.format(new Date(iso + "T12:00:00"));
export const formatDateShort = (iso: string) => dateShort.format(new Date(iso + "T12:00:00"));

export function daysUntil(iso: string, from = new Date()) {
  const ms = new Date(iso + "T12:00:00").getTime() - from.getTime();
  return Math.ceil(ms / 86_400_000);
}

export const SEGMENT_LABEL: Record<string, string> = {
  chorobowy: "Zasiłek chorobowy",
  macierzynski: "Urlop macierzyński",
  warunki_macierzynskiego: "Urlop na warunkach macierzyńskiego",
  rodzicielski: "Urlop rodzicielski",
  ojcowski: "Urlop ojcowski",
  uzupelniajacy: "Urlop uzupełniający",
  praca: "Praca",
};

export const TITLE_LABEL: Record<string, string> = {
  umowa_o_prace: "Umowa o pracę",
  umowa_zlecenie: "Umowa zlecenie",
  jdg: "Działalność gospodarcza",
  brak: "Brak tytułu",
};

const MONTHS_SHORT = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];
/** "2027-03" → "mar" (deterministic, no Intl — avoids hydration mismatch). */
export const monthShort = (yyyyMm: string) => MONTHS_SHORT[Number(yyyyMm.slice(5, 7)) - 1];

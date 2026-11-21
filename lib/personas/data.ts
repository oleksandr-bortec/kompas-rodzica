import type { Persona } from "./types";

/**
 * FAKE demo personas (imitacja danych ZUS). Amounts in `demoPlan` are
 * placeholders for the UI skeleton — the real numbers will come from lib/engine.
 */
export const PERSONAS: Persona[] = [
  {
    id: "ania",
    label: "Ania i Tomek",
    tagline: "Umowa o pracę w dużej firmie, oboje rodzice pracują",
    event: "porod",
    eventDate: "2027-03-15",
    children: 1,
    a: {
      name: "Ania",
      age: 29,
      periods: [
        {
          title: "umowa_o_prace",
          payerName: "Nordlogix Sp. z o.o.",
          from: "2019-09-01",
          to: null,
          sicknessInsurance: "obowiazkowe",
          payerInsuredCount: 214,
        },
      ],
      avgMonthlyBase: 8200,
      ezla: [
        { id: "ZLA-1", from: "2026-11-03", to: "2026-12-01", code: "B", issuer: "lek. M. Wrona" },
      ],
      contributionDebt: 0,
    },
    b: {
      name: "Tomek",
      age: 31,
      periods: [
        {
          title: "umowa_o_prace",
          payerName: "Bydbud S.A.",
          from: "2017-03-01",
          to: null,
          sicknessInsurance: "obowiazkowe",
          payerInsuredCount: 87,
        },
      ],
      avgMonthlyBase: 9500,
      ezla: [],
      contributionDebt: 0,
    },
    demoPlan: {
      verdict: {
        tone: "success",
        title: "Masz prawo do zasiłku macierzyńskiego",
        detail: "Jesteś ubezpieczona chorobowo od ponad 30 dni i będziesz w dniu porodu.",
      },
      payerA: "pracodawca",
      payerB: "pracodawca",
      monthlyA: 6683,
      monthlyB: 6650,
      variant: "81,5%",
      segments: [
        { parent: "A", kind: "macierzynski", startWeek: 0, weeks: 20, percent: 81.5 },
        { parent: "A", kind: "rodzicielski", startWeek: 20, weeks: 32, percent: 81.5 },
        { parent: "B", kind: "ojcowski", startWeek: 2, weeks: 2, percent: 100 },
        { parent: "B", kind: "rodzicielski", startWeek: 52, weeks: 9, percent: 70 },
      ],
      nextStep: {
        title: "Złóż wniosek o urlop i wariant 81,5% u pracodawcy",
        date: "2027-04-05",
        href: "/dokumenty",
      },
      risks: [
        {
          id: "r-21",
          tone: "warning",
          title: "Termin 21 dni na wariant 81,5%",
          why: "Jeśli wniosek wpłynie później, zasiłek za urlop macierzyński wyniesie 100%, a za rodzicielski 70%.",
          todo: "Złóż wniosek najpóźniej 21 dni po porodzie.",
          rule: "Art. 31 ust. 3 ustawy zasiłkowej (do potwierdzenia z ZUS)",
        },
      ],
      documents: [
        { id: "d1", what: "Wniosek o urlop macierzyński i rodzicielski", where: "pracodawca", deadline: "21 dni po porodzie", who: "A" },
        { id: "d2", what: "Odpis skrócony aktu urodzenia", where: "USC / gov.pl", deadline: "po porodzie", who: "A" },
        { id: "d3", what: "Wniosek o urlop ojcowski", where: "pracodawca", deadline: "7 dni przed urlopem", who: "B" },
        { id: "d4", what: "Wniosek o część urlopu rodzicielskiego", where: "pracodawca", deadline: "21 dni przed urlopem", who: "B" },
      ],
    },
  },
  {
    id: "kasia",
    label: "Kasia",
    tagline: "Własna działalność, dobrowolne chorobowe, zaległość w składkach",
    event: "porod",
    eventDate: "2027-01-20",
    children: 1,
    a: {
      name: "Kasia",
      age: 33,
      periods: [
        {
          title: "jdg",
          payerName: "Kasia Design (JDG)",
          from: "2026-05-01",
          to: null,
          sicknessInsurance: "dobrowolne",
        },
      ],
      avgMonthlyBase: 4800,
      ezla: [
        { id: "ZLA-7", from: "2026-11-10", to: "2026-11-30", code: "B", issuer: "lek. A. Sowa" },
      ],
      contributionDebt: 412.5,
    },
    demoPlan: {
      verdict: {
        tone: "warning",
        title: "Prawo do zasiłku — po uregulowaniu zaległości",
        detail: "Okres 90 dni dobrowolnego ubezpieczenia minie przed porodem. Masz zaległość w składkach, którą trzeba wyjaśnić.",
      },
      payerA: "ZUS",
      monthlyA: 3912,
      variant: "81,5%",
      segments: [
        { parent: "A", kind: "macierzynski", startWeek: 0, weeks: 20, percent: 81.5 },
        { parent: "A", kind: "rodzicielski", startWeek: 20, weeks: 32, percent: 81.5 },
      ],
      nextStep: { title: "Ureguluj zaległość w składkach", date: "2026-12-15", href: "/ryzyka" },
      risks: [
        {
          id: "r-debt",
          tone: "danger",
          title: "Zaległość w składkach: 412,50 zł",
          why: "Zaległość na dzień powstania prawa może zablokować wypłatę zasiłku.",
          todo: "Opłać zaległość i pobierz zaświadczenie o niezaleganiu.",
          rule: "TODO(ZUS): potwierdzić regułę zaległości dla ubezpieczenia dobrowolnego",
        },
        {
          id: "r-base",
          tone: "info",
          title: "Podwyższenie podstawy w ciąży",
          why: "ZUS może zakwestionować nagłe podwyższenie podstawy wymiaru składek w czasie ciąży.",
          todo: "Nie zmieniaj podstawy bez uzasadnienia biznesowego.",
          rule: "Ryzyka wskazane w opisie wyzwania ZUS",
        },
      ],
      documents: [
        { id: "d1", what: "Wniosek o zasiłek macierzyński", form: "ZAM", where: "ZUS", deadline: "21 dni po porodzie", who: "A" },
        { id: "d2", what: "Zaświadczenie płatnika (JDG na zwolnieniu)", form: "ZAS-53", where: "ZUS", deadline: "z wnioskiem ZAM", who: "A" },
        { id: "d3", what: "Odpis skrócony aktu urodzenia", where: "USC / gov.pl", deadline: "po porodzie", who: "A" },
      ],
    },
  },
  {
    id: "ola",
    label: "Ola",
    tagline: "Umowa zlecenie kończy się przed porodem",
    event: "porod",
    eventDate: "2027-02-20",
    children: 1,
    a: {
      name: "Ola",
      age: 26,
      periods: [
        {
          title: "umowa_zlecenie",
          payerName: "EventPro Sp. z o.o.",
          from: "2026-02-01",
          to: "2027-01-31",
          sicknessInsurance: "dobrowolne",
          payerInsuredCount: 9,
        },
      ],
      avgMonthlyBase: 3900,
      ezla: [],
      contributionDebt: 0,
    },
    demoPlan: {
      verdict: {
        tone: "danger",
        title: "Ryzyko utraty prawa do zasiłku",
        detail: "Umowa kończy się 31.01.2027, a termin porodu to 20.02.2027. W dniu porodu możesz nie mieć ubezpieczenia chorobowego.",
      },
      payerA: "ZUS",
      monthlyA: 0,
      variant: "81,5%",
      segments: [],
      nextStep: { title: "Sprawdź, czy umowa może trwać do porodu", date: "2027-01-15", href: "/ryzyka" },
      risks: [
        {
          id: "r-day",
          tone: "danger",
          title: "Brak ubezpieczenia chorobowego w dniu porodu",
          why: "Prawo do zasiłku macierzyńskiego zależy od ubezpieczenia w dniu porodu.",
          todo: "Porozmawiaj z płatnikiem o przedłużeniu umowy lub innym tytule ubezpieczenia.",
          rule: "Zasady z opisu wyzwania ZUS",
        },
        {
          id: "r-kp",
          tone: "info",
          title: "Ochrona z Kodeksu pracy nie obejmuje zlecenia",
          why: "Przedłużenie umowy do porodu dotyczy umów o pracę na czas określony.",
          todo: "Nie licz na automatyczne przedłużenie umowy zlecenia.",
          rule: "Kodeks pracy — ochrona w ciąży",
        },
      ],
      documents: [
        { id: "d1", what: "Wniosek o zasiłek macierzyński", form: "ZAM", where: "ZUS", deadline: "21 dni po porodzie", who: "A" },
        { id: "d2", what: "Zaświadczenie płatnika składek (wysyła płatnik)", form: "Z-3a", where: "ZUS", deadline: "z wnioskiem ZAM", who: "A" },
      ],
    },
  },
  {
    id: "ewa-marek",
    label: "Ewa i Marek",
    tagline: "Adopcja 3-letniego dziecka",
    event: "adopcja",
    eventDate: "2026-12-01",
    childAgeYears: 3,
    children: 1,
    a: {
      name: "Ewa",
      age: 36,
      periods: [
        {
          title: "umowa_o_prace",
          payerName: "Pracownia Lumen s.c.",
          from: "2021-01-04",
          to: null,
          sicknessInsurance: "obowiazkowe",
          payerInsuredCount: 12,
        },
      ],
      avgMonthlyBase: 6400,
      ezla: [],
      contributionDebt: 0,
    },
    b: {
      name: "Marek",
      age: 38,
      periods: [
        {
          title: "umowa_o_prace",
          payerName: "Transkom S.A.",
          from: "2015-06-01",
          to: null,
          sicknessInsurance: "obowiazkowe",
          payerInsuredCount: 540,
        },
      ],
      avgMonthlyBase: 7800,
      ezla: [],
      contributionDebt: 0,
    },
    demoPlan: {
      verdict: {
        tone: "success",
        title: "Macie prawo do urlopu na warunkach urlopu macierzyńskiego",
        detail: "Dziecko ma 3 lata — przy adopcji prawo przysługuje do 14. roku życia dziecka.",
      },
      payerA: "ZUS",
      payerB: "pracodawca",
      monthlyA: 5216,
      monthlyB: 5460,
      variant: "81,5%",
      segments: [
        // TODO(ZUS): długość urlopu na warunkach macierzyńskiego przy adopcji — brak w PDF
        { parent: "A", kind: "warunki_macierzynskiego", startWeek: 0, weeks: 20, percent: 81.5 },
        { parent: "A", kind: "rodzicielski", startWeek: 20, weeks: 20, percent: 81.5 },
        { parent: "B", kind: "ojcowski", startWeek: 0, weeks: 2, percent: 100 },
        { parent: "B", kind: "rodzicielski", startWeek: 40, weeks: 21, percent: 70 },
      ],
      nextStep: { title: "Złóż wniosek o urlop po uprawomocnieniu postanowienia", date: "2026-12-01", href: "/dokumenty" },
      risks: [
        {
          id: "r-ped",
          tone: "info",
          title: "Urlop ojcowski: 12 miesięcy od uprawomocnienia",
          why: "Przy adopcji termin liczy się od dnia uprawomocnienia postanowienia, nie od urodzenia.",
          todo: "Zaplanuj urlop ojcowski Marka do 01.12.2027.",
          rule: "Urlop ojcowski — zasady z opisu wyzwania ZUS",
        },
      ],
      documents: [
        { id: "d1", what: "Wniosek o zasiłek (urlop na warunkach macierzyńskiego)", form: "ZAM", where: "ZUS", deadline: "21 dni od przyjęcia dziecka", who: "A" },
        { id: "d2", what: "Postanowienie sądu z klauzulą prawomocności", where: "ZUS", deadline: "z wnioskiem", who: "A" },
        { id: "d3", what: "Wniosek o urlop ojcowski", where: "pracodawca", deadline: "7 dni przed urlopem", who: "B" },
        { id: "d4", what: "Wniosek o część urlopu rodzicielskiego", where: "pracodawca", deadline: "21 dni przed urlopem", who: "B" },
      ],
    },
  },
];

export const DEFAULT_PERSONA_ID: Persona["id"] = "ania";

export function getPersona(id: string | null | undefined): Persona {
  return PERSONAS.find((p) => p.id === id) ?? PERSONAS[0];
}

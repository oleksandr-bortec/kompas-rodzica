/**
 * Dokumenty: co, dokąd i do kiedy. Rules:
 * - opis wyzwania ZUS: pracownica — wniosek do pracodawcy (jeden na macierzyński i rodzicielski);
 *   nie-pracownica — ZAM do ZUS; zlecenie — ZAM, płatnik wysyła Z-3a; JDG — ZAM + ZAS-53;
 *   od 24.10.2026 ZUR i ZAO połączono w ZAM;
 * - Kodeks pracy: wniosek o rodzicielski ≥ 21 dni przed rozpoczęciem, o ojcowski ≥ 7 dni przed,
 *   o urlop na warunkach macierzyńskiego — w ciągu 7 dni od przyjęcia dziecka;
 * - ustawa zasiłkowa art. 30a: wniosek o 81,5% najpóźniej 21 dni po porodzie / przyjęciu dziecka;
 * - rozporządzenie w sprawie wniosków: do wniosku dołącza się odpis skrócony aktu urodzenia.
 */
import type { Params } from "./params";
import { addDays } from "./dates";
import { periodOn } from "./eligibility";
import type { DocumentItem, Payer, PlanInputParsed, Segment } from "./types";

const DAYS_BEFORE_PARENTAL = 21;
const DAYS_BEFORE_PATERNITY = 7;
const DAYS_AFTER_ADOPTION = 7;

export function buildDocuments(
  input: PlanInputParsed,
  segments: Segment[],
  payer: { A: Payer; B?: Payer },
  eligibleA: boolean | null,
  variant: "81.5" | "100-70",
  params: Params,
): DocumentItem[] {
  const docs: DocumentItem[] = [];
  const birth = input.event === "porod";
  const pA = periodOn(input.parentA.periods, input.eventDate);
  const titleA = pA?.title;

  if (eligibleA) {
    const combinedDeadline = addDays(input.eventDate, params.combinedRate.applicationDeadlineDays);
    const leaveName = birth ? "urlop macierzyński i rodzicielski" : "urlop na warunkach urlopu macierzyńskiego i rodzicielski";
    const deadline = birth ? combinedDeadline : addDays(input.eventDate, DAYS_AFTER_ADOPTION);
    const deadlineText = birth
      ? variant === "81.5"
        ? `najpóźniej ${params.combinedRate.applicationDeadlineDays} dni po porodzie — warunek 81,5%`
        : "po porodzie"
      : `w ciągu ${DAYS_AFTER_ADOPTION} dni od przyjęcia dziecka`;

    if (titleA === "umowa_o_prace") {
      docs.push({
        id: "leave-application-A",
        parent: "A",
        what: `Wniosek o ${leaveName}${variant === "81.5" ? " w pełnym wymiarze (81,5%)" : ""}`,
        where: "pracodawca",
        deadline,
        deadlineText,
        rule: birth ? "Kodeks pracy · art. 30a ustawy zasiłkowej" : "Kodeks pracy art. 183 § 6",
      });
      if (payer.A === "ZUS") {
        docs.push({
          id: "z3-A",
          parent: "A",
          what: "Zaświadczenie płatnika składek — wystawia i przekazuje do ZUS pracodawca",
          form: "Z-3",
          where: "ZUS",
          deadline: null,
          deadlineText: "po złożeniu wniosku (robi to pracodawca)",
          rule: "Płatnik ≤ 20 ubezpieczonych → zasiłek wypłaca ZUS",
        });
      }
    } else {
      docs.push({
        id: "zam-A",
        parent: "A",
        what: `Wniosek o zasiłek macierzyński${variant === "81.5" ? " (wariant 81,5%)" : ""}`,
        form: "ZAM",
        where: "ZUS",
        deadline,
        deadlineText,
        rule: "Opis wyzwania ZUS: nie-pracownica — ZAM do ZUS (od 24.10.2026 zamiast ZUR / ZAO)",
      });
      if (titleA === "umowa_zlecenie") {
        docs.push({
          id: "z3a-A",
          parent: "A",
          what: "Zaświadczenie płatnika składek — wysyła zleceniodawca",
          form: "Z-3a",
          where: "ZUS",
          deadline: null,
          deadlineText: "razem z wnioskiem ZAM (robi to płatnik)",
          rule: "Opis wyzwania ZUS: zlecenie — płatnik wysyła Z-3a",
        });
      }
      if (titleA === "jdg") {
        docs.push({
          id: "zas53-A",
          parent: "A",
          what: "Zaświadczenie dla osoby prowadzącej działalność",
          form: "ZAS-53",
          where: "ZUS",
          deadline: null,
          deadlineText: "razem z wnioskiem ZAM",
          rule: "Opis wyzwania ZUS: JDG — ZAS-53",
        });
      }
    }

    docs.push(
      birth
        ? {
            id: "birth-certificate",
            parent: "A",
            what: "Odpis skrócony aktu urodzenia dziecka (dołącz do wniosku)",
            where: "USC / gov.pl",
            deadline: null,
            deadlineText: "zaraz po rejestracji urodzenia",
            rule: "Rozporządzenie w sprawie wniosków związanych z rodzicielstwem",
          }
        : {
            id: "court-document",
            parent: "A",
            what:
              input.event === "adopcja"
                ? "Zaświadczenie sądu o wszczęciu postępowania o przysposobienie (dołącz do wniosku)"
                : "Postanowienie o umieszczeniu dziecka w rodzinie zastępczej (dołącz do wniosku)",
            where: "sąd",
            deadline: null,
            deadlineText: "razem z wnioskiem",
            rule: "Rozporządzenie w sprawie wniosków związanych z rodzicielstwem",
          },
    );
  }

  // Second parent
  if (input.parentB) {
    const titleB = periodOn(input.parentB.periods, input.eventDate)?.title;
    const employeeB = titleB === "umowa_o_prace";
    const paternity = segments.find((s) => s.parent === "B" && s.kind === "ojcowski");
    if (paternity) {
      docs.push({
        id: "paternity-B",
        parent: "B",
        what: employeeB ? "Wniosek o urlop ojcowski" : "Wniosek o zasiłek macierzyński za okres urlopu ojcowskiego",
        form: employeeB ? undefined : "ZAM",
        where: employeeB ? "pracodawca" : "ZUS",
        deadline: employeeB ? addDays(paternity.start, -DAYS_BEFORE_PATERNITY) : null,
        deadlineText: employeeB ? `co najmniej ${DAYS_BEFORE_PATERNITY} dni przed urlopem` : "po rozpoczęciu przerwy w pracy",
        rule: "Kodeks pracy art. 182³ § 2",
      });
    }
    const parentalB = segments.find((s) => s.parent === "B" && s.kind === "rodzicielski");
    if (parentalB) {
      docs.push({
        id: "parental-B",
        parent: "B",
        what: employeeB ? "Wniosek o część urlopu rodzicielskiego" : "Wniosek o zasiłek za część urlopu rodzicielskiego",
        form: employeeB ? undefined : "ZAM",
        where: employeeB ? "pracodawca" : "ZUS",
        deadline: employeeB ? addDays(parentalB.start, -DAYS_BEFORE_PARENTAL) : null,
        deadlineText: employeeB ? `co najmniej ${DAYS_BEFORE_PARENTAL} dni przed urlopem` : "przed rozpoczęciem urlopu",
        rule: "Kodeks pracy (urlop rodzicielski — wniosek 21 dni przed)",
      });
    }
  }

  return docs.sort((a, b) => (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999"));
}

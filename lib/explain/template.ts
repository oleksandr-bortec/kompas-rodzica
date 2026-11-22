/**
 * Plain-language explanation without AI (fallback and AI-free mode).
 * Texts contain only {placeholders}; numbers come from the engine via buildVariables.
 */
import type { Plan } from "@/lib/engine";
import { fill, type Vars } from "./fill";
import { buildVariables, type Lang, type Names } from "./variables";

type Reason = "ok" | "no_insurance" | "debt" | "child_age" | "other";

export function reasonCode(plan: Plan): Reason {
  const e = plan.eligibility.A;
  if (e.eligible) return "ok";
  if (!e.insuredOnEventDate) return "no_insurance";
  if (plan.risks.some((r) => r.id === "contribution-debt" && r.severity === "danger")) return "debt";
  if (/wiek|lat/i.test(e.reason)) return "child_age";
  return "other";
}

const RISK_TITLES: Partial<Record<Lang, Record<string, string>>> = {
  uk: {
    "no-insurance-on-event": "немає лікарняного страхування в день пологів",
    "contribution-debt": "борг за внески",
    "deadline-21": "строк 21 день для варіанта 81,5%",
    "late-application": "заяву подано після 21 дня",
    "insurance-started-in-pregnancy": "договір або діяльність розпочато під час вагітності",
    "voluntary-reregister": "після виплати треба знову зголоситися до добровільного страхування",
    "kp-extension": "строковий договір продовжено до дня пологів",
    "no-kp-protection": "захист Кодексу праці не поширюється на zlecenie та ФОП",
    "base-increase": "підвищення бази внесків під час вагітності",
    "b-not-insured": "другий з батьків не має права на виплату",
  },
  en: {
    "no-insurance-on-event": "no sickness insurance on the day of birth",
    "contribution-debt": "unpaid social security contributions",
    "deadline-21": "the 21-day deadline for the 81.5% option",
    "late-application": "application filed after 21 days",
    "insurance-started-in-pregnancy": "contract or business started during pregnancy",
    "voluntary-reregister": "re-register for voluntary sickness insurance after the benefit",
    "kp-extension": "fixed-term contract extended until the day of birth",
    "no-kp-protection": "Labour Code protection does not cover civil contracts or sole traders",
    "base-increase": "contribution base raised during pregnancy",
    "b-not-insured": "the second parent is not entitled to the benefit",
  },
};

const T: Record<Lang, Record<string, string>> = {
  pl: {
    ok: "{imie_A} ma prawo do zasiłku, bo w dniu {data_zdarzenia} ma ubezpieczenie chorobowe. Zasiłek wypłaca {platnik_A}.",
    no_insurance: "Zasiłek macierzyński nie przysługuje, bo w dniu {data_zdarzenia} nie ma ubezpieczenia chorobowego — to warunek prawa do zasiłku.",
    debt: "Na razie zasiłek nie przysługuje: przy działalności gospodarczej zadłużenie w składkach w dniu powstania prawa wstrzymuje wypłatę do spłaty całości. Spłać zadłużenie najpóźniej do {termin_splaty} — inaczej prawo przedawni się.",
    child_age: "Zasiłek nie przysługuje, bo dziecko przekroczyło limit wieku dla adopcji lub rodziny zastępczej.",
    other: "Na podstawie podanych danych nie możemy potwierdzić prawa do zasiłku — sprawdź dane i ryzyka.",
    v815: "Wybrany wariant to {procent_A} podstawy przez cały urlop, czyli {kwota_A} za pełny miesiąc. Warunek: wniosek najpóźniej do {data_wniosku}.",
    v10070: "Za urlop macierzyński dostaniesz {kwota_A} za pełny miesiąc ({procent_A}), a za rodzicielski {kwota_rodz_A} ({procent_rodz_A}).",
    leaveA: "Urlop macierzyński trwa {tyg_mac} tyg., a Twoja część rodzicielskiego {tyg_rodz_A} tyg. — do {koniec_A}.",
    leaveB: "{imie_B} może wziąć urlop ojcowski ({dni_ojc} dni) i {tyg_rodz_B} tyg. rodzicielskiego, których nie można przenieść na drugiego rodzica — za pełny miesiąc {kwota_B} ({procent_B}).",
    risk: "Na co uważać: {ryzyko}.",
    end: "To informacja, a nie decyzja ZUS.",
  },
  uk: {
    ok: "{imie_A} має право на виплату, бо в день {data_zdarzenia} має лікарняне страхування (ubezpieczenie chorobowe). Виплачує {platnik_A}.",
    no_insurance: "Права на zasiłek macierzyński немає, бо в день {data_zdarzenia} немає лікарняного страхування — це обов'язкова умова.",
    debt: "Поки що виплата не належить: для ФОП борг за внески в день виникнення права зупиняє виплату до повного погашення. Погасіть борг не пізніше {termin_splaty}, інакше право втратиться.",
    child_age: "Виплата не належить, бо дитина старша за вікову межу для усиновлення чи прийомної сім'ї.",
    other: "За введеними даними ми не можемо підтвердити право на виплату — перевірте дані та ризики.",
    v815: "Обраний варіант — {procent_A} бази на всю відпустку, тобто {kwota_A} за повний місяць. Умова: заява не пізніше {data_wniosku}.",
    v10070: "За декретну відпустку (macierzyński) — {kwota_A} за повний місяць ({procent_A}), за батьківську (rodzicielski) — {kwota_rodz_A} ({procent_rodz_A}).",
    leaveA: "Декретна відпустка триває {tyg_mac} тиж., ваша частина батьківської — {tyg_rodz_A} тиж., до {koniec_A}.",
    leaveB: "{imie_B} може взяти відпустку для батька (ojcowski, {dni_ojc} днів) і {tyg_rodz_B} тиж. батьківської, які не можна передати іншому з батьків — {kwota_B} за повний місяць ({procent_B}).",
    risk: "На що звернути увагу: {ryzyko}.",
    end: "Це інформація, а не рішення ZUS.",
  },
  en: {
    ok: "{imie_A} is entitled to the benefit because on {data_zdarzenia} they have sickness insurance. It is paid by {platnik_A}.",
    no_insurance: "There is no right to maternity benefit because on {data_zdarzenia} there is no sickness insurance — this is a required condition.",
    debt: "For now the benefit is not payable: for a sole trader, unpaid contributions on the day the right arises stop the payment until the whole debt is paid. Pay it by {termin_splaty}, otherwise the right expires.",
    child_age: "The benefit is not payable because the child is above the age limit for adoption or foster care.",
    other: "Based on the data provided we cannot confirm the right to the benefit — please check the data and risks.",
    v815: "The chosen option is {procent_A} of the base for the whole leave, i.e. {kwota_A} per full month. Condition: apply by {data_wniosku}.",
    v10070: "For maternity leave you get {kwota_A} per full month ({procent_A}), and for parental leave {kwota_rodz_A} ({procent_rodz_A}).",
    leaveA: "Maternity leave lasts {tyg_mac} weeks and your part of parental leave {tyg_rodz_A} weeks — until {koniec_A}.",
    leaveB: "{imie_B} can take paternity leave ({dni_ojc} days) and {tyg_rodz_B} weeks of parental leave that cannot be transferred — {kwota_B} per full month ({procent_B}).",
    risk: "Watch out for: {ryzyko}.",
    end: "This is information, not a ZUS decision.",
  },
};

/** Paragraph keys used for this plan, in reading order (each needs its placeholders filled). */
export function templateKeys(plan: Plan, vars: Vars): string[] {
  const reason = reasonCode(plan);
  const keys: string[] = [reason];
  if (reason === "ok") {
    if (vars.kwota_A) keys.push(plan.variantApplied === "81.5" ? "v815" : vars.kwota_rodz_A ? "v10070" : "v815");
    if (vars.tyg_mac && vars.tyg_rodz_A) keys.push("leaveA");
    if (vars.imie_B && vars.tyg_rodz_B && vars.dni_ojc && vars.kwota_B) keys.push("leaveB");
  }
  if (vars.ryzyko && reason === "ok") keys.push("risk");
  keys.push("end");
  return keys;
}

/** Engine values for placeholders, with the risk title translated for UK / EN. */
export function localizedVariables(plan: Plan, eventDate: string, names: Names, lang: Lang): Vars {
  const vars = buildVariables(plan, eventDate, names, lang);
  const top = plan.risks[0];
  if (top && lang !== "pl") vars.ryzyko = RISK_TITLES[lang]?.[top.id] ?? top.title;
  return vars;
}

export function templateExplanation(plan: Plan, eventDate: string, names: Names, lang: Lang): string[] {
  const vars = localizedVariables(plan, eventDate, names, lang);
  return templateKeys(plan, vars)
    .map((k) => fill(T[lang][k], vars))
    .filter((p) => !/\{[a-z_AB]+\}/.test(p));
}

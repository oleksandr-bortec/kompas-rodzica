import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Building2, CheckCircle2, Compass, FileSearch, FileText, Lock, PencilLine, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildPlan } from "@/lib/engine";
import { getPersona } from "@/lib/personas/data";
import { personaToInput } from "@/lib/personas/to-engine";
import { formatPLN, variantText } from "@/lib/format";

const STEPS = [
  { icon: ShieldCheck, title: "Dane", text: "Logujesz się przez mObywatel albo wpisujesz dane sam. Możesz też wgrać akta sprawy." },
  { icon: BadgeCheck, title: "Silnik reguł", text: "Sprawdza prawo do zasiłku, kto wypłaca, okresy i kwoty — każdy krok z podstawą prawną." },
  { icon: FileText, title: "Plan", text: "Widzisz pieniądze miesiąc po miesiącu, podział urlopów, terminy i dokumenty do złożenia." },
];

const TRUST = [
  { icon: CheckCircle2, text: "Obliczenia sprawdzone testami" },
  { icon: Sparkles, text: "AI tylko czyta dokumenty — nie liczy kwot" },
  { icon: Lock, text: "Twoje dane zostają w przeglądarce" },
];

/** Ekran 1 — Powitanie. Preview numbers come from the rules engine (demo persona). */
export const metadata: Metadata = { title: { absolute: "Przewodnik przyszłego rodzica · Kompas Rodzica" } };

export default function WelcomePage() {
  const demo = getPersona("ania");
  const plan = buildPlan(personaToInput(demo));
  const total = Math.max(...plan.segments.map((s) => s.startWeek + s.weeks), 52);

  return (
    <main className="mx-auto min-h-dvh max-w-6xl px-4 pb-10 pt-8 sm:px-6 lg:px-10 lg:pt-12">
      <div className="flex items-center gap-2">
        <span className="grid size-10 place-items-center rounded-xl bg-kr-primary text-white">
          <Compass className="size-6" aria-hidden />
        </span>
        <span className="font-heading text-xl font-extrabold text-kr-primary-dark">Kompas Rodzica</span>
      </div>

      <div className="mt-12 grid items-center gap-12 lg:mt-16 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <section>
          <h1 className="font-heading text-[32px] font-extrabold leading-10 text-kr-text lg:text-5xl lg:leading-[1.1]">
            Sprawdź, co Ci przysługuje — w&nbsp;3&nbsp;minuty
          </h1>
          <p className="mt-4 max-w-xl text-lg text-kr-text-2">
            Zasiłek, urlopy obojga rodziców, terminy i dokumenty — w jednym planie. Od ciąży do powrotu do pracy — z planem.
          </p>

          <div className="mt-8 flex max-w-md flex-col gap-3">
            <Button asChild size="lg" className="h-14 rounded-2xl text-base">
              <Link href="/logowanie">
                <ShieldCheck aria-hidden /> Zaloguj przez mObywatel
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14 rounded-2xl text-base">
              <Link href="/dane-reczne">
                <PencilLine aria-hidden /> Wprowadź dane samodzielnie
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="h-14 rounded-2xl text-base text-kr-primary-dark">
              <Link href="/sprawdz-sprawe">
                <FileSearch aria-hidden /> Sprawdź przykładową sprawę
              </Link>
            </Button>
          </div>
          <p className="mt-3 kr-small text-kr-text-2">To informacja, a nie decyzja ZUS.</p>
        </section>

        {/* Preview of a plan — demo persona, numbers computed by the engine */}
        <section aria-label="Przykładowy plan" className="relative mx-2 lg:mx-0">
          <div className="absolute -inset-3 -z-10 rounded-[2rem] bg-kr-tint/70 lg:-inset-6" aria-hidden />
          <div className="rounded-3xl border border-kr-border bg-kr-surface p-5 shadow-[0_12px_40px_-12px_rgba(10,85,70,0.25)] sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <p className="kr-caption text-kr-text-2">Przykład · {demo.label}</p>
              <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[#EAF5EF] px-2 py-0.5 kr-caption text-kr-success">
                <CheckCircle2 className="size-3.5" aria-hidden /> Masz prawo
              </span>
            </div>
            <p className="mt-4 kr-small text-kr-text-2">{demo.a.name} · za pełny miesiąc · {variantText(plan)}</p>
            <p className="kr-amount text-kr-primary-dark">{plan.monthly.A !== null ? formatPLN(plan.monthly.A) : "—"}</p>
            <p className="mt-1 inline-flex items-center gap-1.5 kr-small text-kr-text-2">
              <Building2 className="size-4" aria-hidden /> Wypłaca pracodawca
            </p>

            <div className="mt-5 space-y-2" aria-hidden>
              {(["A", "B"] as const).map((parent) => (
                <div key={parent} className="flex items-center gap-2">
                  <span className="w-12 shrink-0 kr-caption font-normal text-kr-text-2">{parent === "A" ? demo.a.name : demo.b?.name}</span>
                  <div className="relative h-7 flex-1 rounded-lg bg-muted">
                    {plan.segments
                      .filter((s) => s.parent === parent)
                      .map((s, i) => (
                        <div
                          key={i}
                          className="absolute inset-y-1 rounded-md"
                          style={{
                            left: `${(Math.max(0, s.startWeek) / total) * 100}%`,
                            width: `max(${(s.weeks / total) * 100}%, 6px)`,
                            background:
                              parent === "A"
                                ? `rgba(14,124,102,${s.ratePercent >= 100 ? 1 : s.ratePercent >= 80 ? 0.7 : 0.35})`
                                : `rgba(91,95,199,${s.ratePercent >= 100 ? 1 : 0.35})`,
                          }}
                        />
                      ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-kr-accent/40 bg-[#FFF6F1] p-3">
              <p className="kr-caption text-kr-text">Następny krok</p>
              <p className="kr-small font-medium">Wniosek o urlop i wariant 81,5% — do 21 dni po porodzie</p>
            </div>
          </div>
        </section>
      </div>

      <section className="mt-16" aria-labelledby="jak-to-dziala">
        <h2 id="jak-to-dziala" className="kr-h2">Jak to działa</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-2xl border border-kr-border bg-kr-surface p-5">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-full bg-kr-tint font-heading font-bold text-kr-primary-dark">{i + 1}</span>
                <s.icon className="size-5 text-kr-primary" aria-hidden />
              </div>
              <p className="mt-3 kr-card-title">{s.title}</p>
              <p className="mt-1 kr-small text-kr-text-2">{s.text}</p>
            </li>
          ))}
        </ol>
        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
          {TRUST.map((t) => (
            <li key={t.text} className="inline-flex items-center gap-2 kr-small text-kr-text-2">
              <t.icon className="size-4 text-kr-primary" aria-hidden /> {t.text}
            </li>
          ))}
        </ul>
        <p className="mt-8 kr-small text-kr-text-2">
          <Link href="/ai" className="font-medium text-kr-primary hover:underline">AI w aplikacji</Link> ·{" "}
          <Link href="/w-ciazy" className="font-medium text-kr-primary hover:underline">Świadczenia w ciąży</Link> ·{" "}
          <Link href="/trudna-sytuacja" className="font-medium text-kr-primary hover:underline">Trudna sytuacja</Link>
        </p>
      </section>
    </main>
  );
}

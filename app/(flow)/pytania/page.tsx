"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { FlowShell } from "@/components/kr/flow-shell";
import { usePersona } from "@/components/kr/persona-provider";
import { cn } from "@/lib/utils";
import { KIDS_OPTIONS, kidsFromLabel, labelFromKids } from "@/lib/personas/answers";

function Choice({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid gap-2" role="radiogroup">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={value === o}
          onClick={() => onChange(o)}
          className={cn(
            "rounded-2xl border p-4 text-left font-medium transition-colors",
            value === o ? "border-kr-primary bg-kr-tint text-kr-primary-dark" : "border-kr-border bg-kr-surface hover:border-kr-primary/40",
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

/** Ekran 4 — Kilka pytań (onboarding, jedno pytanie na ekran). */
export default function QuestionsPage() {
  const router = useRouter();
  const { persona, basePersona, answers, saveAnswers } = usePersona();
  const [i, setI] = useState(0);
  // Start from previous answers, otherwise from (simulated) ZUS data.
  const [date, setDate] = useState(persona.eventDate);
  const [kids, setKids] = useState<string>(labelFromKids(persona.children));
  const [partner, setPartner] = useState(
    answers?.partner === false || !basePersona.b ? "Nie / nie wiem" : "Tak, też chce korzystać z urlopu",
  );
  const [special, setSpecial] = useState(
    answers?.zaZyciem ? "Zaświadczenie „Za życiem”" : answers?.hospital ? "Dziecko w szpitalu / wcześniak" : "Nie",
  );
  const [dateError, setDateError] = useState<string | null>(null);

  function finish() {
    saveAnswers({
      eventDate: date,
      children: kidsFromLabel(kids),
      partner: partner.startsWith("Tak"),
      zaZyciem: special === "Zaświadczenie „Za życiem”",
      hospital: special === "Dziecko w szpitalu / wcześniak",
    });
    router.push("/plan");
  }

  function next() {
    if (i === 0 && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setDateError("Podaj datę — wystarczy przybliżona.");
      return;
    }
    if (last) finish();
    else setI(i + 1);
  }

  const questions = [
    {
      title: persona.event === "adopcja" ? "Kiedy dziecko trafi do Was?" : "Kiedy jest termin porodu?",
      hint: "Wystarczy przybliżona data — plan przeliczymy po porodzie.",
      body: (
        <div className="grid gap-2">
          <Label htmlFor="date">Data</Label>
          <Input id="date" type="date" value={date} onChange={(e) => { setDate(e.target.value); setDateError(null); }} className="h-12" aria-invalid={!!dateError} />
          {dateError && <p role="alert" className="kr-small text-kr-danger">{dateError}</p>}
        </div>
      ),
    },
    {
      title: "Ile dzieci się spodziewasz?",
      hint: "Od liczby dzieci zależy długość urlopu macierzyńskiego.",
      body: <Choice options={[...KIDS_OPTIONS]} value={kids} onChange={setKids} />,
    },
    {
      title: "Czy drugi rodzic też będzie korzystać z urlopu?",
      hint: "Każdemu rodzicowi przysługuje część urlopu rodzicielskiego, której nie można przenieść.",
      body: (
        <Choice
          options={["Tak, też chce korzystać z urlopu", "Nie / nie wiem", "Jestem samodzielnym rodzicem"]}
          value={partner}
          onChange={setPartner}
        />
      ),
    },
    {
      title: "Czy jest coś szczególnego w Twojej sytuacji?",
      hint: "Nieobowiązkowe. Np. wcześniak, ciężka choroba dziecka, zaświadczenie „Za życiem”.",
      body: (
        <Choice
          options={["Nie", "Zaświadczenie „Za życiem”", "Dziecko w szpitalu / wcześniak", "Wolę nie mówić"]}
          value={special}
          onChange={setSpecial}
        />
      ),
    },
  ];
  const q = questions[i];
  const last = i === questions.length - 1;

  return (
    <FlowShell title="Kilka pytań" right={<span className="kr-small text-kr-text-2">{i + 1} / {questions.length}</span>}>
      <Progress value={((i + 1) / questions.length) * 100} className="mb-8 h-1.5" />
      <h1 className="kr-h1">{q.title}</h1>
      <p className="mt-2 mb-6 text-kr-text-2">{q.hint}</p>
      {q.body}
      <div className="mt-auto flex gap-3 pt-8">
        {i > 0 && (
          <Button variant="outline" size="lg" className="h-14 rounded-2xl" onClick={() => setI(i - 1)}>
            Wstecz
          </Button>
        )}
        <Button
          size="lg"
          className="h-14 flex-1 rounded-2xl text-base"
          onClick={next}
        >
          {last ? "Pokaż mój plan" : "Dalej"}
        </Button>
      </div>
    </FlowShell>
  );
}

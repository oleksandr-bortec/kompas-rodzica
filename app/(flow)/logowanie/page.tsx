"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FlowShell } from "@/components/kr/flow-shell";
import { PersonaSwitcher } from "@/components/kr/persona-switcher";
import { Panel, SymulacjaBadge } from "@/components/kr/ui";

const DATA_SCOPE = [
  ["Okresy ubezpieczenia i tytuły", "żeby sprawdzić prawo do zasiłku (30/90 dni)"],
  ["Rodzaj ubezpieczenia chorobowego", "obowiązkowe czy dobrowolne"],
  ["Podstawa wymiaru składek (12 mies.)", "żeby policzyć kwotę"],
  ["Zwolnienia lekarskie e-ZLA", "m.in. kod „B” — ciąża"],
  ["Zaległości w składkach", "ważne przy działalności gospodarczej"],
  ["Liczba ubezpieczonych u płatnika", "kto wypłaci zasiłek: pracodawca czy ZUS"],
];

/** Ekran 2 — Logowanie (mObywatel) i zgoda. */
export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"login" | "consent">("login");
  const [agreed, setAgreed] = useState(false);

  return (
    <FlowShell right={<SymulacjaBadge />}>
      {step === "login" ? (
        <>
          <h1 className="kr-h1">Zaloguj przez mObywatel</h1>
          <p className="mt-2 text-kr-text-2">
            W prototypie wybierz profil demonstracyjny — tak jakbyś potwierdzał(a) logowanie w aplikacji mObywatel.
          </p>
          <Panel className="mt-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-[#E8EEF9] text-kr-info">
                <ShieldCheck className="size-5" aria-hidden />
              </span>
              <div>
                <p className="font-semibold">mObywatel</p>
                <p className="kr-small text-kr-text-2">Profil do zalogowania</p>
              </div>
            </div>
            <PersonaSwitcher />
          </Panel>
          <div className="mt-auto pt-6">
            <Button size="lg" className="h-14 w-full rounded-2xl text-base" onClick={() => setStep("consent")}>
              Potwierdź logowanie
            </Button>
          </div>
        </>
      ) : (
        <>
          <h1 className="kr-h1">Jakie dane pobierzemy z ZUS</h1>
          <p className="mt-2 text-kr-text-2">Używamy ich tylko do zbudowania Twojego planu. Możesz je poprawić na następnym ekranie.</p>
          <Panel className="mt-6">
            <ul className="divide-y divide-kr-border">
              {DATA_SCOPE.map(([what, why]) => (
                <li key={what} className="flex gap-3 py-3">
                  <Check className="mt-0.5 size-5 shrink-0 text-kr-primary" aria-hidden />
                  <div>
                    <p className="font-medium">{what}</p>
                    <p className="kr-small text-kr-text-2">{why}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
          <label className="mt-5 flex items-start gap-3 rounded-2xl bg-kr-surface p-4">
            <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} className="mt-0.5" />
            <span className="kr-small">
              Zgadzam się na pobranie powyższych danych z ZUS w celu przygotowania planu. Zgodę mogę wycofać w Profilu.
            </span>
          </label>
          <div className="mt-auto pt-6">
            <Button size="lg" className="h-14 w-full rounded-2xl text-base" disabled={!agreed} onClick={() => router.push("/dane-zus")}>
              Pobierz dane z ZUS
            </Button>
          </div>
        </>
      )}
    </FlowShell>
  );
}

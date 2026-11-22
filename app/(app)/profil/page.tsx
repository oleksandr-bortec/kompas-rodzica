"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { usePersona } from "@/components/kr/persona-provider";
import { PersonaSwitcher } from "@/components/kr/persona-switcher";
import { Field, PageHeader, Panel, SymulacjaBadge } from "@/components/kr/ui";
import { formatDate, TITLE_LABEL } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Ekran 13 — Profil. */
export default function ProfilePage() {
  const { persona } = usePersona();
  const [lang, setLang] = useState<"pl" | "uk">("pl");
  const [bigText, setBigText] = useState(false);
  const [contrast, setContrast] = useState(false);

  return (
    <div className={cn(bigText && "text-lg")}>
      <PageHeader title="Profil" />
      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <div className="space-y-4">
          <Panel>
            <h2 className="kr-card-title">Twoje dane</h2>
            <div className="divide-y divide-kr-border">
              <Field label="Imię" value={persona.a.age === undefined ? persona.a.name : `${persona.a.name}, ${persona.a.age} l.`} source={persona.id === "custom" ? "user" : "zus"} />
              <Field label="Tytuł ubezpieczenia" value={TITLE_LABEL[persona.a.periods[0].title]} source={persona.id === "custom" ? "user" : "zus"} />
              <Field label={persona.event === "adopcja" ? "Przyjęcie dziecka" : "Termin porodu"} value={formatDate(persona.eventDate)} source="user" />
            </div>
          </Panel>
          <Panel>
            <h2 className="kr-card-title">Drugi rodzic</h2>
            {persona.b ? (
              <div className="divide-y divide-kr-border">
                <Field label="Imię" value={persona.b.age === undefined ? persona.b.name : `${persona.b.name}, ${persona.b.age} l.`} source={persona.id === "custom" ? "user" : "zus"} />
                <Field label="Tytuł ubezpieczenia" value={TITLE_LABEL[persona.b.periods[0].title]} source={persona.id === "custom" ? "user" : "zus"} />
              </div>
            ) : (
              <p className="mt-1 kr-small text-kr-text-2">Nie dodano drugiego rodzica.</p>
            )}
          </Panel>
          <Panel>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="kr-card-title">Profil demonstracyjny</h2>
              <SymulacjaBadge />
            </div>
            <PersonaSwitcher />
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel>
            <h2 className="kr-card-title">Język</h2>
            <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
              {(["pl", "uk"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  aria-pressed={lang === l}
                  className={cn("rounded-lg py-2 kr-small font-medium", lang === l ? "bg-kr-surface shadow-sm text-kr-primary-dark" : "text-kr-text-2")}
                >
                  {l === "pl" ? "Polski" : "Українська"}
                </button>
              ))}
            </div>
            {lang !== "pl" && (
              <p className="mt-2 kr-small text-kr-text-2">
                Interfejs jest po polsku. Wyjaśnienie Twojego planu po ukraińsku i angielsku znajdziesz na ekranie{" "}
                <Link href="/plan/dlaczego" className="font-medium text-kr-primary hover:underline">„Dlaczego tyle?” → „Wyjaśnij mi to”</Link>.
              </p>
            )}
          </Panel>
          <Panel>
            <h2 className="kr-card-title">Dostępność</h2>
            <div className="divide-y divide-kr-border">
              <label className="flex items-center justify-between py-3">Większy tekst <Switch checked={bigText} onCheckedChange={setBigText} /></label>
              <label className="flex items-center justify-between py-3">Wysoki kontrast <Switch checked={contrast} onCheckedChange={setContrast} /></label>
            </div>
          </Panel>
          <Link href="/ai" className="block">
            <Panel className="flex items-center gap-3 hover:border-kr-partner/40">
              <Sparkles className="size-5 text-kr-partner" aria-hidden />
              <span className="flex-1 font-medium">AI w aplikacji — co robi, a czego nie</span>
              <ChevronRight className="size-5 text-kr-text-2" aria-hidden />
            </Panel>
          </Link>
          <Panel>
            <h2 className="kr-card-title">Prywatność</h2>
            <p className="mt-1 kr-small text-kr-text-2">Plan przechowujemy tylko w Twojej przeglądarce. Możesz wycofać zgodę i usunąć dane.</p>
            <Button
              variant="outline"
              className="mt-3 rounded-xl text-kr-danger"
              onClick={() => {
                try { localStorage.clear(); } catch {}
                location.href = "/";
              }}
            >
              <Trash2 aria-hidden /> Usuń moje dane
            </Button>
          </Panel>
        </div>
      </div>
    </div>
  );
}

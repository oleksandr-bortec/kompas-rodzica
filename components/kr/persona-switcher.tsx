"use client";

import { Check } from "lucide-react";
import { PERSONAS } from "@/lib/personas/data";
import { cn } from "@/lib/utils";
import { usePersona } from "./persona-provider";

export function PersonaSwitcher({ onPick }: { onPick?: () => void }) {
  const { persona, setPersonaId } = usePersona();
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {PERSONAS.map((p) => {
        const active = p.id === persona.id;
        return (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => {
                setPersonaId(p.id);
                onPick?.();
              }}
              aria-pressed={active}
              className={cn(
                "flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors",
                active ? "border-kr-primary bg-kr-tint" : "border-kr-border bg-kr-surface hover:border-kr-primary/40",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border",
                  active ? "border-kr-primary bg-kr-primary text-white" : "border-kr-border",
                )}
              >
                {active && <Check className="size-3" aria-hidden />}
              </span>
              <span>
                <span className="block font-semibold text-kr-text">{p.label}</span>
                <span className="block kr-small text-kr-text-2">{p.tagline}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
